import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { api, errorMessage } from '@/lib/api';
import { formatBRL, formatDate, formatNumber } from '@/lib/format';
import { colors, font, radius, space } from '@/lib/theme';
import { INTEGRATION_STATUS_LABEL, INTEGRATION_TYPE_LABEL, ReportOverview, STATUS_LABEL, WEBHOOK_EVENT_LABEL } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge, Banner, EmptyState } from '@/components/ui/Feedback';

const DAYS = 14;

/** Last DAYS days, oldest first, with zero for days without sales. */
function lastDays(daily: ReportOverview['daily']) {
  const byDate = new Map(daily.map((d) => [d.date, d]));
  const out: { date: string; revenue: number; total_sales: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ date: key, revenue: byDate.get(key)?.revenue ?? 0, total_sales: byDate.get(key)?.total_sales ?? 0 });
  }
  return out;
}

const Kpi = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <View style={styles.kpi}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

const Row = ({ left, sub, right, tone }: { left: string; sub?: string; right: string; tone?: 'danger' }) => (
  <View style={styles.row}>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowName} numberOfLines={1}>{left}</Text>
      {sub ? <Text style={styles.hint} numberOfLines={1}>{sub}</Text> : null}
    </View>
    <Text style={[styles.rowValue, tone === 'danger' && { color: colors.danger }]}>{right}</Text>
  </View>
);

export default function ReportsScreen() {
  const { user } = useAuth();
  const allowed = user?.role === 'admin' || user?.role === 'manager';
  const [data, setData] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/reports/overview');
      setData(res.data.data);
    } catch (e) {
      setError(errorMessage(e, 'Não foi possível carregar os relatórios.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const days = useMemo(() => (data ? lastDays(data.daily) : []), [data]);
  const peak = Math.max(...days.map((d) => d.revenue), 0);
  const maxRevenue = peak || 1;

  if (!allowed) return <EmptyState title="Acesso restrito" hint="Somente administradores e gerentes veem os relatórios." />;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={styles.title} accessibilityRole="header">Relatórios</Text>
          <Text style={styles.subtitle}>Resumo dos últimos {data?.period_days ?? 30} dias. Vendas canceladas não entram no faturamento.</Text>
        </View>
        <Button label="Atualizar" variant="secondary" onPress={load} disabled={loading} />
      </View>

      {error ? <View style={styles.gap}><Banner message={error} /></View> : null}
      {loading && !data ? <ActivityIndicator color={colors.primary} /> : null}

      {data ? (
        <>
          <View style={styles.kpis}>
            <Kpi label="Faturamento" value={formatBRL(data.summary.total_revenue)} />
            <Kpi label="Vendas" value={formatNumber(data.summary.total_sales)} />
            <Kpi label="Ticket médio" value={formatBRL(data.summary.avg_ticket)} />
            <Kpi label="Canceladas" value={formatNumber(data.summary.cancelled_sales)} />
          </View>

          <Card title={`Faturamento por dia (últimos ${DAYS} dias)`}>
            <View style={styles.bars}>
              {days.map((d) => (
                <View key={d.date} style={styles.barCol} accessibilityLabel={`${formatDate(d.date)}: ${formatBRL(d.revenue)}, ${d.total_sales} vendas`}>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: `${Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 3 : 0)}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{d.date.slice(8)}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.hint}>Pico: {formatBRL(peak)} em um dia.</Text>
          </Card>

          <View style={styles.cols}>
            <Card title="Vendas por status">
              {data.sales_by_status.length === 0 ? <Text style={styles.hint}>Sem vendas no período.</Text> : null}
              {data.sales_by_status.map((s) => (
                <Row key={s.status} left={STATUS_LABEL[s.status] ?? s.status} sub={`${s.total_sales} venda(s)`} right={formatBRL(s.total_revenue)} />
              ))}
            </Card>

            <Card title="Produtos mais vendidos">
              {data.top_products.length === 0 ? <Text style={styles.hint}>Sem vendas no período.</Text> : null}
              {data.top_products.map((p) => (
                <Row key={p.product_id} left={p.name} sub={`${formatNumber(p.total_quantity)} un. em ${p.num_sales} venda(s)`} right={formatBRL(p.total_revenue)} />
              ))}
            </Card>
          </View>

          <View style={styles.cols}>
            <Card title="Produtos com estoque mais baixo">
              {data.low_stock_products.length === 0 ? <Text style={styles.hint}>Nenhum produto ativo.</Text> : null}
              {data.low_stock_products.map((p) => (
                <Row key={p.id} left={p.name} right={`${formatNumber(p.amount)} un.`} tone={p.amount <= 0 ? 'danger' : undefined} />
              ))}
            </Card>

            <Card title="Insumos com estoque mais baixo">
              {data.low_stock_supplies.length === 0 ? <Text style={styles.hint}>Nenhum insumo ativo.</Text> : null}
              {data.low_stock_supplies.map((s) => (
                <Row
                  key={s.supply_id}
                  left={s.name}
                  sub={s.next_expiry_date ? `Próxima validade: ${formatDate(s.next_expiry_date)}` : undefined}
                  right={`${formatNumber(s.amount)} ${s.unit_measure}`}
                  tone={s.amount <= 0 ? 'danger' : undefined}
                />
              ))}
            </Card>
          </View>

          {data.integrations.length > 0 || data.webhook_errors.length > 0 ? (
            <View style={styles.cols}>
              <Card title="Integrações">
                {data.integrations.length === 0 ? <Text style={styles.hint}>Nenhuma integração.</Text> : null}
                {data.integrations.map((i) => (
                  <View key={i.integration_id} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{i.name}</Text>
                      <Text style={styles.hint}>
                        {INTEGRATION_TYPE_LABEL[i.type]} · {i.pending_events} evento(s) na fila{i.last_error ? ` · ${i.last_error}` : ''}
                      </Text>
                    </View>
                    <Badge label={INTEGRATION_STATUS_LABEL[i.status]} tone={i.status === 'active' ? 'success' : i.status === 'error' ? 'danger' : 'neutral'} />
                  </View>
                ))}
              </Card>

              <Card title="Webhooks com problema">
                {data.webhook_errors.length === 0 ? <Text style={styles.hint}>Nenhuma falha de entrega.</Text> : null}
                {data.webhook_errors.map((w) => (
                  <Row
                    key={w.id}
                    left={`${w.integration_name} · ${WEBHOOK_EVENT_LABEL[w.event_type] ?? w.event_type}`}
                    sub={`${w.attempt_count} tentativa(s)${w.response_status ? ` · HTTP ${w.response_status}` : ''}`}
                    right={w.status === 'failed' ? 'Falhou' : 'Tentando'}
                    tone={w.status === 'failed' ? 'danger' : undefined}
                  />
                ))}
              </Card>
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl * 2, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap', marginBottom: space.lg },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: font.md, color: colors.muted, marginTop: space.xs },
  gap: { marginBottom: space.lg },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, marginBottom: space.lg },
  kpi: { flexGrow: 1, flexBasis: 180, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg },
  kpiLabel: { fontSize: font.md, fontWeight: '600', color: colors.muted },
  kpiValue: { fontSize: 28, fontWeight: '800', color: colors.ink, marginTop: 2 },
  hint: { fontSize: 12, color: colors.muted },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, marginBottom: space.lg },
  card: { flexGrow: 1, flexBasis: 360, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg, marginBottom: space.lg },
  cardTitle: { fontSize: font.lg, fontWeight: '700', color: colors.ink, marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: colors.border },
  rowName: { fontSize: font.md, fontWeight: '600', color: colors.ink },
  rowValue: { fontSize: font.md, fontWeight: '700', color: colors.ink },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 140, marginBottom: space.sm },
  barCol: { flex: 1, height: '100%', alignItems: 'center' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: colors.primary, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barLabel: { fontSize: 11, color: colors.muted, marginTop: 4 },
});
