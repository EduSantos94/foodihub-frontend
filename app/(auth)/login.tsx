import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AuthCard } from '@/components/AuthCard';
import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Inputs';
import { colors, font } from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      router.replace('/(app)/dashboard');
    } catch (err: any) {
      setError(translate(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse o painel da sua loja."
      footer={
        <Pressable onPress={() => router.push('/(auth)/register')} accessibilityRole="link">
          <Text style={{ fontSize: font.md, color: colors.muted }}>
            Ainda não tem conta? <Text style={{ color: colors.primary, fontWeight: '700' }}>Cadastre sua loja</Text>
          </Text>
        </Pressable>
      }
    >
      {error ? (
        <View style={{ marginBottom: 16 }}>
          <Banner message={error} />
        </View>
      ) : null}
      <TextField label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" placeholder="voce@sualoja.com" />
      <TextField label="Senha" value={password} onChangeText={setPassword} secure autoComplete="current-password" onSubmit={submit} />
      <Button label="Entrar" onPress={submit} loading={loading} />
    </AuthCard>
  );
}

function translate(message: string): string {
  if (message === 'Invalid credentials') return 'E-mail ou senha incorretos.';
  if (message === 'User account is inactive') return 'Esta conta está desativada. Fale com o administrador da sua loja.';
  if (message.includes('Too many')) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  return message || 'Não foi possível entrar. Tente novamente.';
}
