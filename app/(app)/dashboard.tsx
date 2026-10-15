import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { api, listPage } from '@/lib/api';
import { formatBRL } from '@/lib/format';
import { ReportOverview } from '@/lib/types';
import { colors, font, radius, space } from '@/lib/theme';

interface Card {
  key: string;
  title: string;
  hint: string;
  endpoint: string;
  href: string;
}

const CARDS: Card[] = [
  { key: 'products', title: 'Produtos', hint: 'Itens do cardápio', endpoint: '/api/products', href: '/products' },
  { key: 'categories', title: 'Categorias', hint: 'Agrupam os produtos', endpoint: '/api/categories', href: '/categories' },
  { key: 'supplies', title: 'Insumos', hint: 'Ingredientes e materiais', endpoint: '/api/supplies', href: '/supplies' },
  { key: 'suppliers', title: 'Fornecedores', hint: 'De quem você compra', endpoint: '/api/suppliers', href: '/suppliers' },
  { key: 'customers', title: 'Clientes', hint: 'Quem compra de você', endpoint: '/api/customers', href: '/customers' },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [totals, setTotals] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportOverview | null>(null);
  const canSeeReports = user?.role === 'admin' || user?.role === 'manager';

  const load = useCallback(async () => {
    setLoading(true);
    const entries = await Promise.all(
      CARDS.map(async (c) => {
        try {
          const res = await listPage(c.endpoint, 1, 1);
          return [c.key, res.pagination.total] as const;
        } catch {
          return [c.key, null] as const;
        }
      })
    );
    setTotals(Object.fromEntries(entries));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // sales summary is only for admin/manager; if it fails the registry cards still work
  useEffect(() => {
    if (!canSeeReports) return;
    api
      .get('/api/reports/overview')
      .then((res) => setReport(res.data.data))
      .catch(() => undefined);
  }, [canSeeReports]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Olá{user?.first_name ? `, ${user.first_name}` : ''}
      </Text>
      <Text style={styles.subtitle}>Comece pelos cadastros: eles alimentam vendas e estoque.</Text>

      {report ? (
        <View style={[styles.grid, { marginBottom: space.lg }]}>
          <Pressable onPress={() => router.push('/reports' as any)} accessibilityRole="link" style={({ hovered }: any) => [styles.card, hovered && styles.cardHover]}>
            <Text style={styles.cardTitle}>Faturamento (30 dias)</Text>
            <Text style={styles.cardValue}>{formatBRL(report.summary.total_revenue)}</Text>
            <Text style={styles.cardHint}>{report.summary.total_sales} venda(s) · ticket médio {formatBRL(report.summary.avg_ticket)}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/reports' as any)} accessibilityRole="link" style={({ hovered }: any) => [styles.card, hovered && styles.cardHover]}>
            <Text style={styles.cardTitle}>Estoque baixo</Text>
            <Text style={styles.cardValue}>
              {report.low_stock_products.filter((p) => p.amount <= 0).length + report.low_stock_supplies.filter((s) => s.amount <= 0).length}
            </Text>
            <Text style={styles.cardHint}>zerados entre os mais baixos</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.grid}>
        {CARDS.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => router.push(c.href as any)}
            accessibilityRole="link"
            style={({ hovered }: any) => [styles.card, hovered && styles.cardHover]}
          >
            <Text style={styles.cardTitle}>{c.title}</Text>
            {loading && totals[c.key] === undefined ? (
              <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 6 }} />
            ) : (
              <Text style={styles.cardValue}>{totals[c.key] ?? '—'}</Text>
            )}
            <Text style={styles.cardHint}>{c.hint}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  title: { fontSize: font.xxl, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: font.md, color: colors.muted, marginTop: 2, marginBottom: space.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  card: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  cardHover: { borderColor: colors.primary },
  cardTitle: { fontSize: font.md, fontWeight: '600', color: colors.muted },
  cardValue: { fontSize: 32, fontWeight: '800', color: colors.ink, marginVertical: 2 },
  cardHint: { fontSize: font.sm, color: colors.faint },
});
