import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { EVENT_STATUS_LABEL, Integration, Webhook, WEBHOOK_EVENT_LABEL, WebhookEvent, WebhookEventStatus } from '@/lib/types';
import { colors, font, space } from '@/lib/theme';
import { Button } from './ui/Button';
import { ActiveBadge, Badge, Banner } from './ui/Feedback';
import { SelectField, TextField } from './ui/Inputs';
import { Dialog } from './ui/Modal';

interface Props {
  integration: Integration | null;
  onClose: () => void;
}

const CREATABLE_EVENTS = ['order.created', 'order.updated', 'order.cancelled'].map((value) => ({ value, label: WEBHOOK_EVENT_LABEL[value] }));
const EVENT_TONE: Record<WebhookEventStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  pending: 'warning', sent: 'warning', delivered: 'success', failed: 'danger', skipped: 'neutral',
};

const time = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? formatDate(iso) : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

/** Webhooks of one integration (add, test, activate, remove) and the delivery log with retry. */
export function IntegrationWebhooksDialog({ integration, onClose }: Props) {
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [eventType, setEventType] = useState('order.created');
  const [url, setUrl] = useState('');
  const [retries, setRetries] = useState('5');
  const [adding, setAdding] = useState(false);

  const base = integration ? `/api/integrations/${integration.id}` : '';

  const load = useCallback(async () => {
    if (!integration) return;
    setLoading(true);
    try {
      const [h, e] = await Promise.all([api.get(`${base}/webhooks`), api.get(`${base}/events`, { params: { page: 1, limit: 10 } })]);
      setHooks(h.data.data ?? []);
      setEvents(e.data.data ?? []);
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível carregar os webhooks.'));
    } finally {
      setLoading(false);
    }
  }, [integration, base]);

  useEffect(() => {
    setHooks([]);
    setEvents([]);
    setError(null);
    setNotice(null);
    setUrl('');
    if (integration) load();
  }, [integration, load]);

  if (!integration) return null;

  const run = async (id: string | null, action: () => Promise<unknown>, done?: string) => {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (done) setNotice(done);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const add = async () => {
    const endpoint = url.trim();
    const max = Number(retries);
    if (!/^https?:\/\//i.test(endpoint)) return setError('Informe uma URL começando com http:// ou https://.');
    if (!Number.isInteger(max) || max < 1 || max > 10) return setError('Tentativas deve ser um número entre 1 e 10.');
    setAdding(true);
    await run(null, () => api.post(`${base}/webhooks`, { event_type: eventType, endpoint_url: endpoint, max_retries: max }), 'Webhook adicionado.');
    setUrl('');
    setAdding(false);
  };

  return (
    <Dialog visible title={`Webhooks — ${integration.name}`} onClose={onClose} width={720} footer={<Button label="Fechar" variant="secondary" onPress={onClose} />}>
      {error ? <View style={styles.gap}><Banner message={error} /></View> : null}
      {notice ? <View style={styles.gap}><Banner tone="success" message={notice} /></View> : null}

      <Text style={styles.hint}>
        Cada evento da loja (pedido criado, atualizado ou cancelado) é enviado por POST para a URL, assinado com HMAC-SHA256 no cabeçalho X-Webhook-Signature.
      </Text>

      <SelectField label="Evento" value={eventType} onChange={setEventType} options={CREATABLE_EVENTS} />
      <TextField label="URL de destino" value={url} onChangeText={setUrl} placeholder="https://exemplo.com/webhook" keyboardType="default" />
      <TextField label="Tentativas máximas" value={retries} onChangeText={setRetries} mask="integer" maxLength={2} help="Entre 1 e 10. Falhas são repetidas com intervalo crescente." />
      <Button label="Adicionar webhook" onPress={add} loading={adding} style={{ alignSelf: 'flex-start', marginBottom: space.xl }} />

      <Text style={styles.section}>Webhooks cadastrados</Text>
      {loading && hooks.length === 0 ? <ActivityIndicator color={colors.primary} /> : null}
      {!loading && hooks.length === 0 ? <Text style={styles.empty}>Nenhum webhook cadastrado.</Text> : null}
      {hooks.map((h) => (
        <View key={h.id} style={styles.row}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <Text style={styles.name}>{WEBHOOK_EVENT_LABEL[h.event_type] ?? h.event_type}</Text>
            <Text style={styles.sub} numberOfLines={1}>{h.endpoint_url}</Text>
          </View>
          <ActiveBadge active={h.active} />
          <View style={styles.actions}>
            <Button label="Testar" variant="ghost" small disabled={busyId === h.id} onPress={() => run(h.id, () => api.post(`${base}/webhooks/${h.id}/test`), 'Evento de teste enviado para a fila.')} />
            <Button label={h.active ? 'Desativar' : 'Ativar'} variant="ghost" small disabled={busyId === h.id} onPress={() => run(h.id, () => api.put(`${base}/webhooks/${h.id}`, { active: !h.active }))} />
            <Button label="Excluir" variant="ghost" small disabled={busyId === h.id} onPress={() => run(h.id, () => api.delete(`${base}/webhooks/${h.id}`), 'Webhook removido.')} />
          </View>
        </View>
      ))}

      <View style={styles.sectionRow}>
        <Text style={styles.section}>Últimos eventos</Text>
        <Button label="Atualizar" variant="ghost" small onPress={load} disabled={loading} />
      </View>
      {events.length === 0 ? <Text style={styles.empty}>Nenhum evento enviado ainda.</Text> : null}
      {events.map((ev) => (
        <View key={ev.id} style={styles.row}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <Text style={styles.name}>{WEBHOOK_EVENT_LABEL[ev.event_type] ?? ev.event_type}</Text>
            <Text style={styles.sub}>
              {time(ev.created_at)} · {ev.attempt_count} tentativa(s){ev.response_status ? ` · HTTP ${ev.response_status}` : ''}
            </Text>
          </View>
          <Badge label={EVENT_STATUS_LABEL[ev.status]} tone={EVENT_TONE[ev.status]} />
          {ev.status === 'failed' || ev.status === 'skipped' ? (
            <Button label="Reenviar" variant="ghost" small disabled={busyId === ev.id} onPress={() => run(ev.id, () => api.post(`${base}/events/${ev.id}/retry`), 'Evento recolocado na fila.')} />
          ) : null}
        </View>
      ))}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  gap: { marginBottom: space.md },
  hint: { fontSize: font.sm, color: colors.muted, marginBottom: space.lg, lineHeight: 20 },
  section: { fontSize: font.lg, fontWeight: '700', color: colors.ink, marginBottom: space.sm },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xl },
  empty: { color: colors.muted, fontSize: font.md, paddingVertical: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.md, paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: font.md, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted },
  actions: { flexDirection: 'row' },
});
