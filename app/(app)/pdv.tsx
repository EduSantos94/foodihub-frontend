import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { api, errorMessage, listPage } from '@/lib/api';
import { formatBRL, fullName, parseDecimal } from '@/lib/format';
import { colors, DESKTOP_BREAKPOINT, font, radius, space } from '@/lib/theme';
import { Customer, DELIVERY_LABEL, DeliveryType, PAYMENT_LABEL, PaymentMethod, Product, ProductSize } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Feedback';
import { SelectField, SwitchField, TextField } from '@/components/ui/Inputs';
import { Dialog } from '@/components/ui/Modal';

interface CartLine {
  key: string;
  product: Product;
  sizeId?: string;
  sizeName?: string;
  qty: number;
}
const lineKey = (productId: string, sizeId?: string) => `${productId}:${sizeId ?? ''}`;

const toOptions = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

export default function PdvScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= DESKTOP_BREAKPOINT + 200;

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState<CartLine[]>([]);
  const [picking, setPicking] = useState<{ product: Product; sizes: ProductSize[] } | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('takeout');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [discountText, setDiscountText] = useState('');
  const [notes, setNotes] = useState('');
  const [paidNow, setPaidNow] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [p, c] = await Promise.all([listPage<Product>('/api/products', 1, 100), listPage<Customer>('/api/customers', 1, 100)]);
      setProducts(p.data.filter((x) => x.active));
      setCustomers(c.data.filter((x) => x.active));
    } catch (e) {
      setLoadError(errorMessage(e, 'Não foi possível carregar produtos e clientes.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? products.filter((p) => p.name.toLowerCase().includes(term)) : products;
  }, [products, search]);

  const lines = cart;
  const inCartOf = (productId: string) => cart.filter((l) => l.product.id === productId).reduce((sum, l) => sum + l.qty, 0);
  const subtotal = lines.reduce((sum, l) => sum + Number(l.product.price) * l.qty, 0);
  const discount = discountText.trim() === '' ? 0 : parseDecimal(discountText);
  const discountInvalid = Number.isNaN(discount) || discount < 0 || discount > subtotal;
  const total = subtotal - (discountInvalid ? 0 : discount);

  /** Changes the quantity of one cart line; the stock limit is shared by every size of the product. */
  const changeQty = (line: CartLine, delta: number) => {
    setSuccess(null);
    setCart((prev) => {
      const others = prev.filter((l) => l.product.id === line.product.id && l.key !== line.key).reduce((sum, l) => sum + l.qty, 0);
      const max = Math.max(Number(line.product.amount) - others, 0);
      return prev
        .map((l) => (l.key === line.key ? { ...l, qty: Math.min(l.qty + delta, max) } : l))
        .filter((l) => l.qty > 0);
    });
  };

  const addToCart = (product: Product, size?: ProductSize) => {
    setSuccess(null);
    setPicking(null);
    setCart((prev) => {
      const key = lineKey(product.id, size?.id);
      const total = prev.filter((l) => l.product.id === product.id).reduce((sum, l) => sum + l.qty, 0);
      if (total >= Number(product.amount)) return prev;
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { key, product, sizeId: size?.id, sizeName: size?.name, qty: 1 }];
    });
  };

  /** Products with active sizes ask which one; the others go straight to the cart. */
  const pick = async (product: Product) => {
    setCheckingId(product.id);
    try {
      const res = await api.get(`/api/products/${product.id}/sizes`);
      const sizes: ProductSize[] = (res.data.data ?? []).filter((s: ProductSize) => s.active);
      if (sizes.length > 0) setPicking({ product, sizes });
      else addToCart(product);
    } catch {
      addToCart(product); // sizes are optional: a failure to load them must not block the sale
    } finally {
      setCheckingId(null);
    }
  };

  const reset = () => {
    setCart([]);
    setCustomerId('');
    setDeliveryType('takeout');
    setAddress('');
    setPayment('cash');
    setDiscountText('');
    setNotes('');
    setPaidNow(true);
  };

  const finalize = async () => {
    setError(null);
    if (lines.length === 0) return setError('Adicione ao menos um produto.');
    if (discountInvalid) return setError('O desconto deve ser um valor entre 0 e o subtotal.');
    if (deliveryType === 'delivery' && !address.trim()) return setError('Informe o endereço de entrega.');

    setSaving(true);
    try {
      const res = await api.post('/api/sales', {
        items: lines.map((l) => ({ product_id: l.product.id, product_size_id: l.sizeId, quantity: l.qty })),
        customer_id: customerId || undefined,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? address.trim() : undefined,
        payment_method: payment,
        discount: discount || undefined,
        notes: notes.trim() || undefined,
      });
      const sale = res.data.data ?? res.data;
      let message = `Venda registrada: ${formatBRL(sale.total_amount ?? total)}.`;
      if (paidNow && sale.id) {
        try {
          await api.put(`/api/sales/${sale.id}`, { payment_status: 'paid' });
        } catch {
          message += ' Não foi possível marcar como paga; faça isso em Vendas.';
        }
      }
      reset();
      setSuccess(message);
      load(); // refresh stock
    } catch (e) {
      setError(errorMessage(e, 'Não foi possível registrar a venda.'));
    } finally {
      setSaving(false);
    }
  };

  const catalog = (
    <View style={wide ? styles.catalog : undefined}>
      <TextField label="Buscar produto" value={search} onChangeText={setSearch} placeholder="Digite o nome" />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ padding: space.xl }} />
      ) : visible.length === 0 ? (
        <Text style={styles.muted}>{products.length === 0 ? 'Nenhum produto ativo cadastrado.' : 'Nenhum produto encontrado.'}</Text>
      ) : (
        <View style={styles.grid}>
          {visible.map((p) => {
            const stock = Number(p.amount);
            const out = stock <= 0;
            const inCart = inCartOf(p.id);
            return (
              <Pressable
                key={p.id}
                disabled={out || inCart >= stock || checkingId === p.id}
                onPress={() => pick(p)}
                accessibilityRole="button"
                accessibilityLabel={`Adicionar ${p.name}`}
                style={({ hovered }: any) => [styles.tile, hovered && !out && styles.tileHover, (out || inCart >= stock) && styles.tileOff]}
              >
                <Text style={styles.tileName} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={styles.tilePrice}>{formatBRL(p.price)}</Text>
                <Text style={[styles.tileStock, out && { color: colors.danger }]}>{out ? 'Sem estoque' : `${stock} em estoque`}</Text>
                {inCart > 0 ? (
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyBadgeText}>{inCart}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );

  const checkout = (
    <View style={[styles.card, wide && styles.checkout]}>
      <Text style={styles.cardTitle}>Pedido</Text>
      {lines.length === 0 ? (
        <Text style={styles.muted}>Toque em um produto para adicionar.</Text>
      ) : (
        lines.map((line) => (
          <View key={line.key} style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineName} numberOfLines={1}>
                {line.product.name}
                {line.sizeName ? ` (${line.sizeName})` : ''}
              </Text>
              <Text style={styles.lineSub}>{formatBRL(Number(line.product.price) * line.qty)}</Text>
            </View>
            <Button label="−" variant="secondary" small onPress={() => changeQty(line, -1)} />
            <Text style={styles.qty}>{line.qty}</Text>
            <Button label="+" variant="secondary" small disabled={inCartOf(line.product.id) >= Number(line.product.amount)} onPress={() => changeQty(line, 1)} />
          </View>
        ))
      )}

      <View style={{ height: space.lg }} />
      <SelectField
        label="Cliente"
        value={customerId}
        onChange={setCustomerId}
        placeholder="Sem cliente (balcão)"
        options={[{ value: '', label: 'Sem cliente (balcão)' }, ...customers.map((c) => ({ value: c.id, label: fullName(c) }))]}
      />
      <SelectField label="Tipo" value={deliveryType} onChange={(v) => setDeliveryType(v as DeliveryType)} options={toOptions(DELIVERY_LABEL)} />
      {deliveryType === 'delivery' ? <TextField label="Endereço de entrega" required value={address} onChangeText={setAddress} /> : null}
      <SelectField label="Pagamento" value={payment} onChange={(v) => setPayment(v as PaymentMethod)} options={toOptions(PAYMENT_LABEL)} />
      <TextField
        label="Desconto (R$)"
        value={discountText}
        onChangeText={setDiscountText}
        mask="decimal"
        placeholder="0,00"
        error={discountInvalid ? 'Valor inválido ou maior que o subtotal' : undefined}
      />
      <TextField label="Observações" value={notes} onChangeText={setNotes} multiline />
      <SwitchField label="Pagamento já recebido" value={paidNow} onChange={setPaidNow} />

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.muted}>Subtotal</Text>
          <Text style={styles.lineName}>{formatBRL(subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatBRL(total)}</Text>
        </View>
      </View>

      {error ? (
        <View style={{ marginBottom: space.md }}>
          <Banner message={error} />
        </View>
      ) : null}
      <Button label="Finalizar venda" onPress={finalize} loading={saving} disabled={lines.length === 0} />
      {lines.length > 0 ? (
        <View style={{ marginTop: space.sm }}>
          <Button label="Limpar pedido" variant="ghost" onPress={reset} disabled={saving} />
        </View>
      ) : null}
    </View>
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Nova venda
      </Text>
      <Text style={styles.subtitle}>Monte o pedido e finalize. O estoque é baixado na hora.</Text>

      {success ? (
        <View style={{ marginBottom: space.lg }}>
          <Banner tone="success" message={success} />
        </View>
      ) : null}
      {loadError ? (
        <View style={{ marginBottom: space.lg }}>
          <Banner message={loadError} />
          <View style={{ marginTop: space.sm, alignSelf: 'flex-start' }}>
            <Button label="Tentar novamente" variant="secondary" small onPress={load} />
          </View>
        </View>
      ) : null}

      {wide ? (
        <View style={styles.cols}>
          {catalog}
          {checkout}
        </View>
      ) : (
        <>
          {catalog}
          <View style={{ height: space.lg }} />
          {checkout}
        </>
      )}

      <Dialog visible={picking !== null} title={picking ? `Tamanho — ${picking.product.name}` : ''} onClose={() => setPicking(null)} width={420}>
        {picking?.sizes.map((size) => (
          <Button key={size.id} label={size.name} variant="secondary" onPress={() => addToCart(picking.product, size)} style={{ marginBottom: space.sm }} />
        ))}
      </Dialog>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl * 2 },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: font.md, color: colors.muted, marginTop: space.xs, marginBottom: space.xl },
  cols: { flexDirection: 'row', gap: space.xl, alignItems: 'flex-start' },
  catalog: { flex: 1 },
  checkout: { width: 380 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    width: 160,
    minHeight: 110,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tileHover: { borderColor: colors.primary },
  tileOff: { opacity: 0.5 },
  tileName: { fontSize: font.md, fontWeight: '600', color: colors.ink },
  tilePrice: { fontSize: font.lg, fontWeight: '800', color: colors.primary, marginTop: space.xs },
  tileStock: { fontSize: 12, color: colors.muted, marginTop: 'auto' },
  qtyBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  qtyBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg },
  cardTitle: { fontSize: font.lg, fontWeight: '700', color: colors.ink, marginBottom: space.md },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  lineName: { fontSize: font.md, fontWeight: '600', color: colors.ink },
  lineSub: { fontSize: 12, color: colors.muted },
  qty: { minWidth: 24, textAlign: 'center', fontWeight: '700', color: colors.ink },
  totals: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.md, marginBottom: space.lg, gap: space.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: font.lg, fontWeight: '700', color: colors.ink },
  totalValue: { fontSize: font.xl, fontWeight: '800', color: colors.ink },
  muted: { fontSize: font.md, color: colors.muted },
});
