import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { colors, DESKTOP_BREAKPOINT, font, space } from '@/lib/theme';

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const desktop = width >= DESKTOP_BREAKPOINT;

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const sidebar = (
    <Sidebar
      userName={user ? `${user.first_name} ${user.last_name}`.trim() || user.email : 'Usuário'}
      role={user?.role ?? ''}
      onSignOut={handleSignOut}
      onNavigate={() => setMenuOpen(false)}
    />
  );

  if (desktop) {
    return (
      <View style={styles.row}>
        {sidebar}
        <View style={styles.main}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.column}>
      <View style={styles.topbar}>
        <Pressable onPress={() => setMenuOpen((o) => !o)} accessibilityRole="button" accessibilityLabel="Menu" hitSlop={8}>
          <Text style={styles.burger}>{menuOpen ? '✕' : '☰'}</Text>
        </Pressable>
        <Text style={styles.topbarTitle}>FoodiHub</Text>
      </View>
      {menuOpen ? <View style={styles.drawer}>{sidebar}</View> : <View style={styles.main}><Slot /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  column: { flex: 1, backgroundColor: colors.bg },
  main: { flex: 1 },
  drawer: { flex: 1 },
  topbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  burger: { fontSize: 22, color: colors.ink },
  topbarTitle: { fontSize: font.lg, fontWeight: '800', color: colors.primary },
});
