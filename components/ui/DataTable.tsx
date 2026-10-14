import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Button } from './Button';
import { EmptyState } from './Feedback';
import { Pagination } from '@/lib/api';
import { colors, font, radius, space } from '@/lib/theme';

export interface Column<T> {
  key: string;
  title: string;
  /** Fixed width in px; columns without it share the remaining space (min 140) */
  width?: number;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle: string;
  emptyHint?: string;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  actions?: (row: T) => React.ReactNode;
}

const ACTIONS_WIDTH = 220;
const COMPACT_BREAKPOINT = 700;

export function DataTable<T>({ columns, rows, rowKey, loading, emptyTitle, emptyHint, pagination, onPageChange, actions }: Props<T>) {
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < COMPACT_BREAKPOINT;
  // a right-aligned column followed by a left-aligned one needs some air between them
  const cell = (c: Column<T>, i: number) => [
    c.width ? { width: c.width } : { flex: 1, minWidth: 140 },
    i > 0 && columns[i - 1].align === 'right' && c.align !== 'right' ? { paddingLeft: space.lg } : null,
  ];
  const minWidth = columns.reduce((sum, c) => sum + (c.width ?? 140), 0) + (actions ? ACTIONS_WIDTH : 0) + space.lg * 2;

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        {(pagination!.page - 1) * pagination!.limit + 1}–{Math.min(pagination!.page * pagination!.limit, pagination!.total)} de {pagination!.total}
      </Text>
      <View style={styles.pager}>
        <Button label="Anterior" variant="secondary" small disabled={pagination!.page <= 1 || loading} onPress={() => onPageChange?.(pagination!.page - 1)} />
        <Text style={styles.footerText}>
          {pagination!.page} / {Math.max(pagination!.total_pages, 1)}
        </Text>
        <Button label="Próxima" variant="secondary" small disabled={pagination!.page >= pagination!.total_pages || loading} onPress={() => onPageChange?.(pagination!.page + 1)} />
      </View>
    </View>
  );

  if (compact) {
    return (
      <View style={styles.cards}>
        {loading && rows.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.card}>
            <EmptyState title={emptyTitle} hint={emptyHint} />
          </View>
        ) : (
          rows.map((row) => (
            <View key={rowKey(row)} style={[styles.card, styles.mobileCard, loading && styles.dim]}>
              {columns.map((c, i) => (
                <View key={c.key} style={i === 0 ? styles.mobileTitle : styles.mobileField}>
                  {i > 0 ? <Text style={styles.mobileLabel}>{c.title}</Text> : null}
                  <View style={i > 0 ? styles.mobileValue : undefined}>{c.render(row)}</View>
                </View>
              ))}
              {actions ? <View style={styles.mobileActions}>{actions(row)}</View> : null}
            </View>
          ))
        )}
        {pagination && pagination.total > 0 ? <View style={styles.card}>{renderFooter()}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: '100%' }}>
        <View style={{ minWidth, flexGrow: 1, width: '100%' }}>
          <View style={[styles.row, styles.headRow]}>
            {columns.map((c, i) => (
              <Text key={c.key} style={[styles.headText, cell(c, i), c.align === 'right' && styles.right]}>
                {c.title}
              </Text>
            ))}
            {actions ? <View style={{ width: ACTIONS_WIDTH }} /> : null}
          </View>

          {loading && rows.length === 0 ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : rows.length === 0 ? (
            <EmptyState title={emptyTitle} hint={emptyHint} />
          ) : (
            rows.map((row, i) => (
              <View key={rowKey(row)} style={[styles.row, i < rows.length - 1 && styles.rowDivider, loading && styles.dim]}>
                {columns.map((c, ci) => (
                  <View key={c.key} style={[cell(c, ci), c.align === 'right' && styles.rightCell]}>
                    {c.render(row)}
                  </View>
                ))}
                {actions ? <View style={styles.actions}>{actions(row)}</View> : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {pagination && pagination.total > 0 ? renderFooter() : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.md },
  headRow: { backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: space.sm },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  dim: { opacity: 0.6 },
  headText: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  right: { textAlign: 'right' },
  rightCell: { alignItems: 'flex-end' },
  actions: { width: ACTIONS_WIDTH, flexDirection: 'row', justifyContent: 'flex-end', gap: space.xs },
  loading: { padding: space.xxl, alignItems: 'center' },
  cards: { gap: space.md },
  mobileCard: { padding: space.lg },
  mobileTitle: { marginBottom: space.sm },
  mobileField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, gap: space.md },
  mobileLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  mobileValue: { flexShrink: 1, alignItems: 'flex-end' },
  mobileActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: space.xs, marginTop: space.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pager: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  footerText: { fontSize: font.sm, color: colors.muted },
});
