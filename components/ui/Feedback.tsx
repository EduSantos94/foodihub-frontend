import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space } from '@/lib/theme';

export function Banner({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' | 'info' }) {
  const palette = {
    error: { bg: colors.dangerSoft, fg: colors.danger },
    success: { bg: colors.successSoft, fg: colors.success },
    info: { bg: colors.warningSoft, fg: colors.warning },
  }[tone];
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: palette.bg }]}>
      <Text style={[styles.bannerText, { color: palette.fg }]}>{message}</Text>
    </View>
  );
}

export function Badge({ label, tone }: { label: string; tone: 'success' | 'neutral' | 'warning' | 'danger' }) {
  const palette = {
    success: { bg: colors.successSoft, fg: colors.success },
    neutral: { bg: colors.bg, fg: colors.muted },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export const ActiveBadge = ({ active }: { active: boolean }) => (
  <Badge label={active ? 'Ativo' : 'Inativo'} tone={active ? 'success' : 'neutral'} />
);

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: space.md, borderRadius: radius.md },
  bannerText: { fontSize: font.md },
  badge: { alignSelf: 'flex-start', paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  empty: { padding: space.xxl, alignItems: 'center' },
  emptyTitle: { fontSize: font.lg, fontWeight: '600', color: colors.ink },
  emptyHint: { fontSize: font.md, color: colors.muted, marginTop: space.xs, textAlign: 'center' },
});
