import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AuthCard } from '@/components/AuthCard';
import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Inputs';
import { api, errorMessage } from '@/lib/api';
import { isValidCnpj, maskCnpj } from '@/lib/cnpj';
import { colors, font } from '@/lib/theme';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Form {
  store_name: string;
  store_document: string;
  store_email: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_password: string;
  confirm: string;
}

const EMPTY: Form = { store_name: '', store_document: '', store_email: '', admin_first_name: '', admin_last_name: '', admin_email: '', admin_password: '', confirm: '' };

/** Anyone can sign up a store with its CNPJ; they become the admin of that store and of nothing else. */
export default function RegisterScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = (key: keyof Form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: key === 'store_document' ? maskCnpj(value) : value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof Form, string>> = {};
    if (!form.store_name.trim()) next.store_name = 'Informe o nome da loja';
    if (!isValidCnpj(form.store_document)) next.store_document = 'CNPJ inválido';
    if (!EMAIL.test(form.store_email)) next.store_email = 'E-mail inválido';
    if (!form.admin_first_name.trim()) next.admin_first_name = 'Informe seu nome';
    if (!form.admin_last_name.trim()) next.admin_last_name = 'Informe seu sobrenome';
    if (!EMAIL.test(form.admin_email)) next.admin_email = 'E-mail inválido';
    if (form.admin_password.length < 8) next.admin_password = 'Use pelo menos 8 caracteres';
    if (form.confirm !== form.admin_password) next.confirm = 'As senhas não conferem';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const { confirm, ...payload } = form;
      await api.post('/auth/register', { ...payload, store_name: payload.store_name.trim() });
      await signIn(form.admin_email.trim(), form.admin_password);
      router.replace('/(app)/dashboard');
    } catch (err) {
      setApiError(translate(errorMessage(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Cadastre sua loja"
      subtitle="Use o CNPJ da loja. Você será o administrador e só enxerga os dados dela."
      footer={
        <Pressable onPress={() => router.push('/(auth)/login')} accessibilityRole="link">
          <Text style={{ fontSize: font.md, color: colors.muted }}>
            Já tem conta? <Text style={{ color: colors.primary, fontWeight: '700' }}>Entrar</Text>
          </Text>
        </Pressable>
      }
    >
      {apiError ? (
        <View style={{ marginBottom: 16 }}>
          <Banner message={apiError} />
        </View>
      ) : null}
      <TextField label="Nome da loja" required value={form.store_name} onChangeText={set('store_name')} error={errors.store_name} maxLength={255} />
      <TextField label="CNPJ" required value={form.store_document} onChangeText={set('store_document')} error={errors.store_document} keyboardType="number-pad" placeholder="00.000.000/0000-00" maxLength={18} />
      <TextField label="E-mail da loja" required value={form.store_email} onChangeText={set('store_email')} error={errors.store_email} keyboardType="email-address" />
      <TextField label="Seu nome" required value={form.admin_first_name} onChangeText={set('admin_first_name')} error={errors.admin_first_name} autoComplete="name" />
      <TextField label="Seu sobrenome" required value={form.admin_last_name} onChangeText={set('admin_last_name')} error={errors.admin_last_name} />
      <TextField label="Seu e-mail de acesso" required value={form.admin_email} onChangeText={set('admin_email')} error={errors.admin_email} keyboardType="email-address" autoComplete="email" />
      <TextField label="Senha" required secure value={form.admin_password} onChangeText={set('admin_password')} error={errors.admin_password} autoComplete="new-password" help="Mínimo de 8 caracteres." />
      <TextField label="Confirmar senha" required secure value={form.confirm} onChangeText={set('confirm')} error={errors.confirm} autoComplete="new-password" onSubmit={submit} />
      <Button label="Criar minha loja" onPress={submit} loading={loading} />
    </AuthCard>
  );
}

function translate(message: string): string {
  if (message.includes('valid CNPJ')) return 'CNPJ inválido.';
  if (message.includes('document already exists')) return 'Já existe uma loja cadastrada com este CNPJ.';
  if (message.includes('email already exists')) return 'Este e-mail de acesso já está em uso.';
  if (message.includes('Too many')) return 'Muitos cadastros deste endereço. Tente novamente mais tarde.';
  if (message.includes('Password')) return 'A senha precisa ter pelo menos 8 caracteres.';
  return message;
}
