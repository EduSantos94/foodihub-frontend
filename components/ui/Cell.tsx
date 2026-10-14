import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, font } from '@/lib/theme';

export const Primary = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.primary} numberOfLines={2}>
    {children}
  </Text>
);

export const Secondary = ({ children }: { children?: React.ReactNode }) =>
  children ? (
    <Text style={styles.secondary} numberOfLines={1}>
      {children}
    </Text>
  ) : null;

export const Plain = ({ children }: { children?: React.ReactNode }) => (
  <Text style={styles.plain} numberOfLines={1}>
    {children || '—'}
  </Text>
);

const styles = StyleSheet.create({
  primary: { fontSize: font.md, fontWeight: '600', color: colors.ink },
  secondary: { fontSize: 12, color: colors.muted, marginTop: 2 },
  plain: { fontSize: font.md, color: colors.ink },
});
