import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { api, errorMessage } from '@/lib/api';
import { formatPhone, MASKS, unmask } from '@/lib/masks';
import { colors, font, radius, space } from '@/lib/theme';
import { ROLE_LABEL, StoreUser } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Inputs';

const MIN_PASSWORD = 8;

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StoreUser | null>(null);

  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [changing, setChanging] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get(`/api/users/${user.id}`)
      .then((res) => {
        const u: StoreUser = res.data.data;
        setProfile(u);
        setFirst(u.first_name ?? '');
        setLast(u.last_name ?? '');
        setPhone(formatPhone(u.phone ?? ''));
      })
      .catch((e) => setLoadError(errorMessage(e, 'Não foi possível carregar o perfil.')))
      .finally(() => setLoading(false));
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaveMsg(null);
    if (!first.trim()) return setSaveMsg({ tone: 'error', text: 'Informe o nome.' });
    const phoneError = phone ? MASKS.phone.validate(phone) : null;
    if (phoneError) return setSaveMsg({ tone: 'error', text: phoneError });
    setSaving(true);
    try {
      await api.put(`/api/users/${user.id}`, { first_name: first.trim(), last_name: last.trim(), phone: unmask('phone', phone) });
      setSaveMsg({ tone: 'success', text: 'Perfil atualizado. O nome no menu muda no próximo login.' });
    } catch (e) {
      setSaveMsg({ tone: 'error', text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!user) return;
    setPwMsg(null);
    if (!current) return setPwMsg({ tone: 'error', text: 'Informe a senha atual.' });
    if (next.length < MIN_PASSWORD) return setPwMsg({ tone: 'error', text: `A nova senha deve ter ao menos ${MIN_PASSWORD} caracteres.` });
    if (next !== confirm) return setPwMsg({ tone: 'error', text: 'A confirmação não confere com a nova senha.' });
    setChanging(true);
    try {
      await api.post(`/api/users/${user.id}/change-password`, { current_password: current, new_password: next });
      setCurrent('');
      setNext('');
      setConfirm('');
      setPwMsg({ tone: 'success', text: 'Senha alterada.' });
    } catch (e) {
      setPwMsg({ tone: 'error', text: errorMessage(e, 'Não foi possível alterar a senha.') });
    } finally {
      setChanging(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">Meu perfil</Text>
      <Text style={styles.subtitle}>{profile ? `${profile.email} · ${ROLE_LABEL[profile.role] ?? profile.role}` : ' '}</Text>

      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {loadError ? <Banner message={loadError} /> : null}

      {profile ? (
        <View style={styles.cols}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dados pessoais</Text>
            {saveMsg ? <View style={styles.gap}><Banner tone={saveMsg.tone} message={saveMsg.text} /></View> : null}
            <TextField label="Nome" required value={first} onChangeText={setFirst} maxLength={100} />
            <TextField label="Sobrenome" value={last} onChangeText={setLast} maxLength={100} />
            <TextField label="Telefone" mask="phone" value={phone} onChangeText={setPhone} />
            <Button label="Salvar" onPress={saveProfile} loading={saving} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Trocar senha</Text>
            {pwMsg ? <View style={styles.gap}><Banner tone={pwMsg.tone} message={pwMsg.text} /></View> : null}
            <TextField label="Senha atual" secure value={current} onChangeText={setCurrent} autoComplete="current-password" />
            <TextField label="Nova senha" secure value={next} onChangeText={setNext} autoComplete="new-password" help={`Mínimo de ${MIN_PASSWORD} caracteres.`} />
            <TextField label="Confirmar nova senha" secure value={confirm} onChangeText={setConfirm} autoComplete="new-password" onSubmit={changePassword} />
            <Button label="Alterar senha" onPress={changePassword} loading={changing} />
          </View>
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
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xl, alignItems: 'flex-start' },
  card: { flexGrow: 1, flexBasis: 340, maxWidth: 520, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg },
  cardTitle: { fontSize: font.lg, fontWeight: '700', color: colors.ink, marginBottom: space.md },
  gap: { marginBottom: space.md },
});
