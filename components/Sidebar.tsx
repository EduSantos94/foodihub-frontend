import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { colors, font, radius, space } from '@/lib/theme';

interface NavItem {
  href: string;
  label: string;
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: 'Visão geral', items: [{ href: '/dashboard', label: 'Início' }] },
  {
    title: 'Vendas',
    items: [
      { href: '/pdv', label: 'Nova venda' },
      { href: '/sales', label: 'Vendas' },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { href: '/products', label: 'Produtos' },
      { href: '/categories', label: 'Categorias' },
    ],
  },
  {
    title: 'Estoque',
    items: [
      { href: '/supplies', label: 'Insumos' },
      { href: '/suppliers', label: 'Fornecedores' },
    ],
  },
  { title: 'Pessoas', items: [{ href: '/customers', label: 'Clientes' }] },
];

interface Props {
  userName: string;
  role: string;
  onSignOut: () => void;
  onNavigate?: () => void;
}

const ROLE_LABEL: Record<string, string> = { admin: 'Administrador', manager: 'Gerente', staff: 'Equipe' };

export function Sidebar({ userName, role, onSignOut, onNavigate }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <Text style={styles.brandText}>FoodiHub</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.lg }}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Pressable
                  key={item.href}
                  onPress={() => {
                    router.push(item.href as any);
                    onNavigate?.();
                  }}
                  accessibilityRole="link"
                  accessibilityState={{ selected: active }}
                  style={({ hovered }: any) => [styles.item, active && styles.itemActive, hovered && !active && styles.itemHover]}
                >
                  <Text style={[styles.itemText, active && styles.itemTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.user}>
        <Text style={styles.userName} numberOfLines={1}>
          {userName}
        </Text>
        <Text style={styles.userRole}>{ROLE_LABEL[role] ?? role}</Text>
        <Pressable onPress={onSignOut} accessibilityRole="button" style={styles.signOut}>
          <Text style={styles.signOutText}>Sair</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: 240, backgroundColor: colors.surface, borderRightWidth: 1, borderRightColor: colors.border, height: '100%' },
  brand: { height: 64, justifyContent: 'center', paddingHorizontal: space.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  brandText: { fontSize: font.xl, fontWeight: '800', color: colors.primary },
  section: { paddingHorizontal: space.md, paddingTop: space.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.faint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: space.xs, paddingHorizontal: space.md },
  item: { paddingVertical: space.sm + 2, paddingHorizontal: space.md, borderRadius: radius.md },
  itemHover: { backgroundColor: colors.bg },
  itemActive: { backgroundColor: colors.primarySoft },
  itemText: { fontSize: font.md, color: colors.ink },
  itemTextActive: { color: colors.primary, fontWeight: '700' },
  user: { padding: space.lg, borderTopWidth: 1, borderTopColor: colors.border },
  userName: { fontSize: font.md, fontWeight: '600', color: colors.ink },
  userRole: { fontSize: 12, color: colors.muted, marginBottom: space.sm },
  signOut: { paddingVertical: space.xs },
  signOutText: { fontSize: font.md, color: colors.primary, fontWeight: '600' },
});
