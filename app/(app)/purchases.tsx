import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { api, errorMessage, listPage, Page } from '@/lib/api';
import { formatBRL, formatDate, formatNumber, parseDateBR, parseDecimal, todayBR } from '@/lib/format';
import { colors, font, radius, space } from '@/lib/theme';
import {
  Purchase, PURCHASE_PAYMENT_LABEL, PURCHASE_PAYMENT_STATUS_LABEL, PurchasePaymentMethod, PurchasePaymentStatus, Supplier, Supply,
} from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, Banner } from '@/components/ui/Feedback';
import { Plain, Primary, Secondary } from '@/components/ui/Cell';
import { SelectField, SwitchField, TextField } from '@/components/ui/Inputs';
import { ConfirmDialog, Dialog } from '@/components/ui/Modal';

interface Line {
  supply_id: string;
  quantity: string;
  unit_price: string;
  batch_number: string;
  expiry_date: string;
}
const emptyLine = (): Line => ({ supply_id: '', quantity: '', unit_price: '', batch_number: '', expiry_date: '' });
const lineTotal = (l: Line) => {
  const q = parseDecimal(l.quantity);
  const p = parseDecimal(l.unit_price);
  return Number.isFinite(q) && Number.isFinite(p) ? q * p : 0;
};
const STATUS_TONE: Record<PurchasePaymentStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  pending: 'warning', partial: 'warning', paid: 'success', cancelled: 'danger',
};
const METHOD_OPTIONS = Object.entries(PURCHASE_PAYMENT_LABEL).map(([value, label]) => ({ value, label }));
const purchaseLabel = (p: Purchase) => p.purchase_number || `#${p.id.slice(0, 8)}`;

export default function PurchasesScreen() {
  const { user } = useAuth();
  const canDelete = user?.role === 'admin' || user?.role === 'manager';

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page<Purchase> | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // new purchase dialog
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(todayBR());
  const [number, setNumber] = useState('');
  const [invoice, setInvoice] = useState('');
  const [method, setMethod] = useState<PurchasePaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [paidNow, setPaidNow] = useState(false);
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<Purchase | null>(null);
  const [deleting, setDeleting] = useState<Purchase | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const supplierName = useMemo(() => new Map(suppliers.map((s) => [s.id, s.name])), [suppliers]);
  const supplyById = useMemo(() => new Map(supplies.map((s) => [s.id, s])), [supplies]);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      setResult(await listPage<Purchase>('/api/purchases', p));
    } catch (e) {
      setError(errorMessage(e, 'Não foi possível carregar as compras.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  useEffect(() => {
    listPage<Supplier>('/api/suppliers', 1, 100).then((r) => setSuppliers(r.data.filter((s) => s.active))).catch(() => undefined);
    listPage<Supply>('/api/supplies', 1, 100).then((r) => setSupplies(r.data.filter((s) => s.active))).catch(() => undefined);
  }, []);

  const total = lines.reduce((sum, l) => sum + lineTotal(l), 0);

  const openForm = () => {
    setSupplierId('');
    setDate(todayBR());
    setNumber('');
    setInvoice('');
    setMethod('cash');
    setNotes('');
    setPaidNow(false);
    setLines([emptyLine()]);
    setFormError(null);
    setOpen(true);
  };

  const setLine = (i: number, patch: Partial<Line>) => setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const save = async () => {
    setFormError(null);
    if (!supplierId) return setFormError('Escolha o fornecedor.');
    const purchaseDate = parseDateBR(date);
    if (!purchaseDate) return setFormError('Data da compra inválida. Use DD/MM/AAAA.');

    const items: Record<string, unknown>[] = [];
    for (const [i, l] of lines.entries()) {
      const n = i + 1;
      if (!l.supply_id) return setFormError(`Item ${n}: escolha o insumo.`);
      const quantity = parseDecimal(l.quantity);
      const unit_price = parseDecimal(l.unit_price);
      if (!Number.isFinite(quantity) || quantity <= 0) return setFormError(`Item ${n}: quantidade deve ser maior que zero.`);
      if (!Number.isFinite(unit_price) || unit_price < 0) return setFormError(`Item ${n}: preço inválido.`);
      let expiry: string | undefined;
      if (l.expiry_date.trim()) {
        const parsed = parseDateBR(l.expiry_date);
        if (!parsed) return setFormError(`Item ${n}: validade inválida. Use DD/MM/AAAA.`);
        expiry = parsed;
      }
      items.push({ supply_id: l.supply_id, quantity, unit_price, batch_number: l.batch_number.trim() || undefined, expiry_date: expiry });
    }

    setSaving(true);
    try {
      const res = await api.post('/api/purchases', {
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        purchase_number: number.trim() || undefined,
        invoice_number: invoice.trim() || undefined,
        payment_method: method,
        notes: notes.trim() || undefined,
        items,
      });
      const created = res.data.data ?? res.data;
      let message = `Compra registrada: ${formatBRL(created.total_amount ?? total)}. O estoque dos insumos foi atualizado.`;
      if (paidNow && created.id) {
        try {
          await api.put(`/api/purchases/${created.id}`, {
            payment_status: 'paid',
            paid_amount: created.total_amount,
            payment_date: purchaseDate,
          });
        } catch {
          message += ' Não foi possível marcar como paga; faça isso na lista.';
        }
      }
      setOpen(false);
      setNotice(message);
      setPage(1);
      await load(1);
    } catch (e) {
      setFormError(errorMessage(e, 'Não foi possível registrar a compra.'));
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (p: Purchase) => {
    setBusyId(p.id);
    setNotice(null);
    setError(null);
    try {
      await api.put(`/api/purchases/${p.id}`, { payment_status: 'paid', paid_amount: p.total_amount, payment_date: new Date().toISOString().slice(0, 10) });
      setNotice(`Compra ${purchaseLabel(p)} marcada como paga.`);
      await load(page);
    } catch (e) {
      setError(errorMessage(e, 'Não foi possível atualizar a compra.'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/purchases/${deleting.id}`);
      setDeleting(null);
      setNotice('Compra excluída e quantidades retiradas do estoque.');
      await load(page);
    } catch (e) {
      setDeleteError(errorMessage(e, 'Não foi possível excluir a compra.'));
    } finally {
      setDeleteBusy(false);
    }
  };

  const supplyOptions = supplies.map((s) => ({ value: s.id, label: `${s.name} (${s.unit_measure})` }));

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={styles.title} accessibilityRole="header">Compras</Text>
          <Text style={styles.subtitle}>Compras de insumos dos fornecedores. Ao registrar, o estoque dos insumos aumenta.</Text>
        </View>
        <Button label="+ Nova compra" onPress={openForm} />
      </View>

      {notice ? <View style={styles.gap}><Banner tone="success" message={notice} /></View> : null}
      {error ? <View style={styles.gap}><Banner message={error} /></View> : null}

      <DataTable
        columns={[
          {
            key: 'purchase',
            title: 'Compra',
            render: (p: Purchase) => (
              <>
                <Primary>{purchaseLabel(p)}</Primary>
                <Secondary>{formatDate(p.purchase_date)}</Secondary>
              </>
            ),
          },
          {
            key: 'supplier',
            title: 'Fornecedor',
            render: (p: Purchase) => (
              <>
                <Plain>{supplierName.get(p.supplier_id)}</Plain>
                <Secondary>{p.invoice_number ? `NF ${p.invoice_number}` : undefined}</Secondary>
              </>
            ),
          },
          { key: 'total', title: 'Total', width: 120, align: 'right', render: (p: Purchase) => <Plain>{formatBRL(p.total_amount)}</Plain> },
          {
            key: 'payment',
            title: 'Pagamento',
            width: 150,
            render: (p: Purchase) => (
              <>
                <Badge label={PURCHASE_PAYMENT_STATUS_LABEL[p.payment_status]} tone={STATUS_TONE[p.payment_status]} />
                <Secondary>{p.payment_method ? PURCHASE_PAYMENT_LABEL[p.payment_method] : undefined}</Secondary>
              </>
            ),
          },
        ]}
        rows={result?.data ?? []}
        rowKey={(p) => p.id}
        loading={loading}
        emptyTitle="Nenhuma compra registrada"
        emptyHint="Use “Nova compra” para lançar a primeira."
        pagination={result?.pagination}
        onPageChange={setPage}
        actions={(p) => (
          <>
            <Button label="Detalhes" variant="ghost" small onPress={() => setDetail(p)} />
            {p.payment_status !== 'paid' && p.payment_status !== 'cancelled' ? (
              <Button label="Pagar" variant="ghost" small disabled={busyId === p.id} onPress={() => markPaid(p)} />
            ) : null}
            {canDelete ? <Button label="Excluir" variant="ghost" small onPress={() => { setDeleteError(null); setDeleting(p); }} /> : null}
          </>
        )}
      />

      <Dialog
        visible={open}
        title="Nova compra"
        width={760}
        onClose={() => (saving ? undefined : setOpen(false))}
        footer={
          <>
            <Button label="Cancelar" variant="secondary" onPress={() => setOpen(false)} disabled={saving} />
            <Button label="Registrar compra" onPress={save} loading={saving} />
          </>
        }
      >
        {formError ? <View style={{ marginBottom: space.md }}><Banner message={formError} /></View> : null}
        <SelectField
          label="Fornecedor"
          required
          value={supplierId}
          onChange={setSupplierId}
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          help={suppliers.length === 0 ? 'Cadastre um fornecedor antes.' : undefined}
        />
        <TextField label="Data da compra" required value={date} onChangeText={setDate} mask="date" />
        <TextField label="Nº do pedido" value={number} onChangeText={setNumber} maxLength={50} />
        <TextField label="Nota fiscal" value={invoice} onChangeText={setInvoice} maxLength={50} />
        <SelectField label="Forma de pagamento" value={method} onChange={(v) => setMethod(v as PurchasePaymentMethod)} options={METHOD_OPTIONS} />

        <Text style={styles.section}>Itens</Text>
        {lines.map((l, i) => {
          const unit = supplyById.get(l.supply_id)?.unit_measure;
          return (
            <View key={i} style={styles.lineBox}>
              <SelectField
                label={`Insumo ${i + 1}`}
                required
                value={l.supply_id}
                onChange={(v) => setLine(i, { supply_id: v })}
                options={supplyOptions}
                help={supplies.length === 0 ? 'Cadastre insumos antes.' : undefined}
              />
              <TextField label={`Quantidade${unit ? ` (${unit})` : ''}`} required value={l.quantity} onChangeText={(v) => setLine(i, { quantity: v })} mask="decimal" placeholder="0" />
              <TextField label={`Preço unitário${unit ? ` (por ${unit})` : ''}`} required value={l.unit_price} onChangeText={(v) => setLine(i, { unit_price: v })} mask="decimal" placeholder="0,00" />
              <TextField label="Lote" value={l.batch_number} onChangeText={(v) => setLine(i, { batch_number: v })} maxLength={50} />
              <TextField label="Validade" value={l.expiry_date} onChangeText={(v) => setLine(i, { expiry_date: v })} mask="date" />
              <View style={styles.lineFooter}>
                <Text style={styles.muted}>Subtotal: {formatBRL(lineTotal(l))}</Text>
                {lines.length > 1 ? <Button label="Remover item" variant="ghost" small onPress={() => setLines((prev) => prev.filter((_, idx) => idx !== i))} /> : null}
              </View>
            </View>
          );
        })}
        <Button label="+ Adicionar item" variant="secondary" small onPress={() => setLines((prev) => [...prev, emptyLine()])} style={{ alignSelf: 'flex-start', marginBottom: space.lg }} />

        <TextField label="Observações" value={notes} onChangeText={setNotes} multiline />
        <SwitchField label="Já foi pago" value={paidNow} onChange={setPaidNow} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatBRL(total)}</Text>
        </View>
      </Dialog>

      <Dialog visible={detail !== null} title={detail ? `Compra ${purchaseLabel(detail)}` : ''} onClose={() => setDetail(null)} footer={<Button label="Fechar" variant="secondary" onPress={() => setDetail(null)} />}>
        {detail ? (
          <View>
            <Text style={styles.muted}>{supplierName.get(detail.supplier_id)} · {formatDate(detail.purchase_date)}</Text>
            <View style={{ height: space.md }} />
            {(detail.items ?? []).map((i) => (
              <View key={i.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>
                    {formatNumber(i.quantity)} {supplyById.get(i.supply_id)?.unit_measure ?? ''} · {supplyById.get(i.supply_id)?.name ?? 'Insumo'}
                  </Text>
                  <Text style={styles.muted}>
                    {formatBRL(i.unit_price)} cada{i.batch_number ? ` · lote ${i.batch_number}` : ''}{i.expiry_date ? ` · val. ${formatDate(i.expiry_date)}` : ''}
                  </Text>
                </View>
                <Text style={styles.itemName}>{formatBRL(i.total_price)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatBRL(detail.total_amount)}</Text>
            </View>
            {detail.notes ? <Text style={[styles.muted, { marginTop: space.md }]}>Obs.: {detail.notes}</Text> : null}
          </View>
        ) : null}
      </Dialog>

      <ConfirmDialog
        visible={deleting !== null}
        title="Excluir compra"
        message={deleting ? `Excluir a compra ${purchaseLabel(deleting)}? As quantidades saem do estoque dos insumos (com piso em zero).` : ''}
        loading={deleteBusy}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl * 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap', marginBottom: space.lg },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: font.md, color: colors.muted, marginTop: space.xs },
  gap: { marginBottom: space.lg },
  section: { fontSize: font.lg, fontWeight: '700', color: colors.ink, marginBottom: space.sm },
  lineBox: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.md, marginBottom: space.md },
  lineFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { fontSize: font.md, color: colors.ink, fontWeight: '600' },
  muted: { fontSize: font.sm, color: colors.muted },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: space.md },
  totalLabel: { fontSize: font.lg, fontWeight: '700', color: colors.ink },
  totalValue: { fontSize: font.xl, fontWeight: '800', color: colors.ink },
});
