import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { api, errorMessage, listPage, Page } from '@/lib/api';
import { formatBRL, fullName } from '@/lib/format';
import { colors, font, space } from '@/lib/theme';
import {
  Customer, DELIVERY_LABEL, PAYMENT_LABEL, PAYMENT_STATUS_LABEL, Sale, SaleStatus, STATUS_LABEL,
} from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, Banner } from '@/components/ui/Feedback';
import { Plain, Primary, Secondary } from '@/components/ui/Cell';
import { SelectField } from '@/components/ui/Inputs';
import { ConfirmDialog, Dialog } from '@/components/ui/Modal';

const NEXT: Partial<Record<SaleStatus, { status: SaleStatus; label: string }>> = {
  pending: { status: 'preparing', label: 'Preparar' },
  preparing: { status: 'ready', label: 'Pronto' },
  ready: { status: 'delivered', label: 'Entregar' },
};
const STATUS_TONE: Record<SaleStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  pending: 'warning', preparing: 'warning', ready: 'success', delivered: 'neutral', cancelled: 'danger',
};
const FILTER = [{ value: '', label: 'Todos os status' }, ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))];

const saleLabel = (s: Sale) => s.sale_number || `#${s.id.slice(0, 8)}`;

export default function SalesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const canCancel = user?.role === 'admin' || user?.role === 'manager';

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<Page<Sale> | null>(null);
  const [customers, setCustomers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [detail, setDetail] = useState<Sale | null>(null);
  const [cancelling, setCancelling] = useState<Sale | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  const load = useCallback(async (p: number, st: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/sales', { params: { page: p, limit: 10, status: st || undefined } });
      setResult({ data: res.data.data ?? [], pagination: res.data.pagination });
    } catch (e) {
      setError(errorMessage(e, 'Não foi possível carregar as vendas.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, status);
  }, [load, page, status]);

  useEffect(() => {
    listPage<Customer>('/api/customers', 1, 100)
      .then((r) => setCustomers(new Map(r.data.map((c) => [c.id, fullName(c)]))))
      .catch(() => undefined);
  }, []);

  const update = async (sale: Sale, body: Record<string, unknown>, done: string) => {
    setBusyId(sale.id);
    setNotice(null);
    setError(null);
    try {
      await api.put(`/api/sales/${sale.id}`, body);
      setNotice(done);
      await load(page, status);
    } catch (e) {
      setError(errorMessage(e, 'Não foi possível atualizar a venda.'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    setCancelBusy(true);
    setCancelError(null);
    try {
      await api.post(`/api/sales/${cancelling.id}/cancel`);
      setCancelling(null);
      setNotice('Venda cancelada e estoque devolvido.');
      await load(page, status);
    } catch (e) {
      setCancelError(errorMessage(e, 'Não foi possível cancelar.'));
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={styles.title} accessibilityRole="header">Vendas</Text>
          <Text style={styles.subtitle}>Acompanhe pedidos, pagamentos e entregas.</Text>
        </View>
        <Button label="+ Nova venda" onPress={() => router.push('/pdv' as any)} />
      </View>

      <View style={{ maxWidth: 260 }}>
        <SelectField label="Filtrar" value={status} onChange={(v) => { setPage(1); setStatus(v); }} options={FILTER} />
      </View>

      {notice ? <View style={styles.gap}><Banner tone="success" message={notice} /></View> : null}
      {error ? <View style={styles.gap}><Banner message={error} /></View> : null}

      <DataTable
        columns={[
          {
            key: 'sale',
            title: 'Venda',
            render: (s: Sale) => (
              <>
                <Primary>{saleLabel(s)}</Primary>
                <Secondary>{new Date(s.sale_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Secondary>
              </>
            ),
          },
          {
            key: 'customer',
            title: 'Cliente',
            render: (s: Sale) => (
              <>
                <Plain>{(s.customer_id && customers.get(s.customer_id)) || 'Balcão'}</Plain>
                <Secondary>{DELIVERY_LABEL[s.delivery_type]}</Secondary>
              </>
            ),
          },
          { key: 'total', title: 'Total', width: 120, align: 'right', render: (s: Sale) => <Plain>{formatBRL(s.total_amount)}</Plain> },
          { key: 'status', title: 'Status', width: 120, render: (s: Sale) => <Badge label={STATUS_LABEL[s.status]} tone={STATUS_TONE[s.status]} /> },
          {
            key: 'payment',
            title: 'Pagamento',
            width: 150,
            render: (s: Sale) => (
              <>
                <Badge label={PAYMENT_STATUS_LABEL[s.payment_status]} tone={s.payment_status === 'paid' ? 'success' : s.payment_status === 'cancelled' ? 'danger' : 'warning'} />
                <Secondary>{PAYMENT_LABEL[s.payment_method]}</Secondary>
              </>
            ),
          },
        ]}
        rows={result?.data ?? []}
        rowKey={(s) => s.id}
        loading={loading}
        emptyTitle="Nenhuma venda encontrada"
        emptyHint="Use “Nova venda” para registrar a primeira."
        pagination={result?.pagination}
        onPageChange={setPage}
        actions={(s) => {
          const next = NEXT[s.status];
          const busy = busyId === s.id;
          return (
            <>
              <Button label="Detalhes" variant="ghost" small onPress={() => setDetail(s)} />
              {next ? <Button label={next.label} variant="ghost" small disabled={busy} onPress={() => update(s, { status: next.status }, `Venda ${saleLabel(s)}: ${STATUS_LABEL[next.status].toLowerCase()}.`)} /> : null}
              {s.payment_status === 'pending' && s.status !== 'cancelled' ? (
                <Button label="Receber" variant="ghost" small disabled={busy} onPress={() => update(s, { payment_status: 'paid' }, `Pagamento da venda ${saleLabel(s)} registrado.`)} />
              ) : null}
              {canCancel && s.status !== 'cancelled' && s.status !== 'delivered' ? (
                <Button label="Cancelar" variant="ghost" small onPress={() => { setCancelError(null); setCancelling(s); }} />
              ) : null}
            </>
          );
        }}
      />

      <Dialog
        visible={detail !== null}
        title={detail ? `Venda ${saleLabel(detail)}` : ''}
        onClose={() => setDetail(null)}
        footer={<Button label="Fechar" variant="secondary" onPress={() => setDetail(null)} />}
      >
        {detail ? (
          <View>
            {(detail.items ?? []).map((i) => (
              <View key={i.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{i.quantity}× {i.product_name}</Text>
                <Text style={styles.itemName}>{formatBRL(i.total_price)}</Text>
              </View>
            ))}
            <View style={styles.itemRow}><Text style={styles.muted}>Subtotal</Text><Text style={styles.itemName}>{formatBRL(detail.subtotal)}</Text></View>
            {detail.discount > 0 ? <View style={styles.itemRow}><Text style={styles.muted}>Desconto</Text><Text style={styles.itemName}>−{formatBRL(detail.discount)}</Text></View> : null}
            <View style={styles.itemRow}><Text style={styles.total}>Total</Text><Text style={styles.total}>{formatBRL(detail.total_amount)}</Text></View>
            {detail.delivery_address ? <Text style={[styles.muted, { marginTop: space.md }]}>Entrega: {detail.delivery_address}</Text> : null}
            {detail.notes ? <Text style={[styles.muted, { marginTop: space.sm }]}>Obs.: {detail.notes}</Text> : null}
          </View>
        ) : null}
      </Dialog>

      <ConfirmDialog
        visible={cancelling !== null}
        title="Cancelar venda"
        message={cancelling ? `Cancelar a venda ${saleLabel(cancelling)}? Os produtos voltam ao estoque.` : ''}
        confirmLabel="Cancelar venda"
        loading={cancelBusy}
        error={cancelError}
        onConfirm={confirmCancel}
        onCancel={() => setCancelling(null)}
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
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.xs },
  itemName: { fontSize: font.md, color: colors.ink },
  muted: { fontSize: font.md, color: colors.muted },
  total: { fontSize: font.lg, fontWeight: '800', color: colors.ink },
});
