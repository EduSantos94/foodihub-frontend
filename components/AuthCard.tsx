import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space } from '@/lib/theme';

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>FoodiHub</Text>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {children}
        </View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  brand: { fontSize: 28, fontWeight: '800', color: colors.primary, marginBottom: space.lg },
  card: { width: '100%', maxWidth: 440, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.xl },
  title: { fontSize: font.xxl, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: font.md, color: colors.muted, marginTop: 2, marginBottom: space.xl },
  footer: { marginTop: space.lg, alignItems: 'center' },
});
