import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RootLayoutNav() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Navegar para tela apropriada baseado no token
    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      // Usuário não autenticado, ir para login
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Usuário autenticado, ir para dashboard
      router.replace('/(app)/dashboard');
    }
  }, [token, isLoading, segments]);

  // Loading state
  if (isLoading) {
    return (
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Carregando...',
            headerShown: false,
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack.Group screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack.Group>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
