import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { listPage } from '@/lib/api';
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

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Olá{user?.first_name ? `, ${user.first_name}` : ''}
      </Text>
      <Text style={styles.subtitle}>Comece pelos cadastros: eles alimentam vendas e estoque.</Text>

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
