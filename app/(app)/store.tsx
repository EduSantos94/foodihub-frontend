import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { api, errorMessage } from '@/lib/api';
import { colors, font, radius, space } from '@/lib/theme';
import { Store } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Inputs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Form = { name: string; email: string; phone: string; address: string; city: string; state: string; zip_code: string };

export default function StoreScreen() {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';
  const [store, setStore] = useState<Store | null>(null);
  const [form, setForm] = useState<Form>({ name: '', email: '', phone: '', address: '', city: '', state: '', zip_code: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api
      .get('/api/stores')
      .then((res) => {
        const s: Store = res.data.data?.data?.[0];
        if (!s) throw new Error('empty');
        setStore(s);
        setForm({ name: s.name ?? '', email: s.email ?? '', phone: s.phone ?? '', address: s.address ?? '', city: s.city ?? '', state: s.state ?? '', zip_code: s.zip_code ?? '' });
      })
      .catch((e) => setLoadError(errorMessage(e, 'Não foi possível carregar a loja.')))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const save = async () => {
    if (!store) return;
    setMsg(null);
    if (!form.name.trim()) return setMsg({ tone: 'error', text: 'Informe o nome da loja.' });
    if (!EMAIL.test(form.email.trim())) return setMsg({ tone: 'error', text: 'E-mail inválido.' });
    setSaving(true);
    try {
      await api.put(`/api/stores/${store.id}`, Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])));
      setMsg({ tone: 'success', text: 'Dados da loja atualizados.' });
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">Minha loja</Text>
      <Text style={styles.subtitle}>{store ? `CNPJ ${store.document}` : ' '}</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {loadError ? <Banner message={loadError} /> : null}

      {store ? (
        <View style={styles.card}>
          {!canEdit ? <View style={styles.gap}><Banner tone="info" message="Somente o administrador da loja edita estes dados." /></View> : null}
          {msg ? <View style={styles.gap}><Banner tone={msg.tone} message={msg.text} /></View> : null}
          <TextField label="Nome" required value={form.name} onChangeText={set('name')} maxLength={255} />
          <TextField label="E-mail" required value={form.email} onChangeText={set('email')} keyboardType="email-address" />
          <TextField label="Telefone" value={form.phone} onChangeText={set('phone')} maxLength={20} />
          <TextField label="Endereço" value={form.address} onChangeText={set('address')} />
          <TextField label="Cidade" value={form.city} onChangeText={set('city')} />
          <TextField label="UF" value={form.state} onChangeText={set('state')} maxLength={2} />
          <TextField label="CEP" value={form.zip_code} onChangeText={set('zip_code')} maxLength={10} />
          {canEdit ? <Button label="Salvar" onPress={save} loading={saving} /> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl * 2 },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: font.md, color: colors.muted, marginTop: space.xs, marginBottom: space.xl },
  card: { maxWidth: 560, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg },
  gap: { marginBottom: space.md },
});
