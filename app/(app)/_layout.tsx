import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { colors, DESKTOP_BREAKPOINT, font, space } from '@/lib/theme';

const TOPBAR_HEIGHT = 56;

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  // keeps the top bar below the clock/notch and the content above the home indicator on phones
  const insets = useSafeAreaInsets();
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
      platformAdmin={user?.is_platform_admin === true}
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
      <View style={[styles.topbar, { height: TOPBAR_HEIGHT + insets.top, paddingTop: insets.top }]}>
        <Pressable onPress={() => setMenuOpen((o) => !o)} accessibilityRole="button" accessibilityLabel="Menu" hitSlop={12} style={styles.burgerButton}>
          <Text style={styles.burger}>{menuOpen ? '✕' : '☰'}</Text>
        </Pressable>
        <Text style={styles.topbarTitle}>FoodiHub</Text>
      </View>
      {menuOpen ? (
        <View style={[styles.drawer, { paddingBottom: insets.bottom }]}>{sidebar}</View>
      ) : (
        <View style={[styles.main, { paddingBottom: insets.bottom }]}>
          <Slot />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  column: { flex: 1, backgroundColor: colors.bg },
  main: { flex: 1 },
  drawer: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  burgerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  burger: { fontSize: 24, color: colors.ink },
  topbarTitle: { fontSize: font.lg, fontWeight: '800', color: colors.primary },
});
