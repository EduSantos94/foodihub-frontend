import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { api, errorMessage } from '@/lib/api';
import { ProductSize } from '@/lib/types';
import { colors, font, radius, space } from '@/lib/theme';
import { Button } from './ui/Button';
import { ActiveBadge, Banner } from './ui/Feedback';
import { TextField } from './ui/Inputs';
import { Dialog } from './ui/Modal';

interface Props {
  product: { id: string; name: string } | null;
  onClose: () => void;
}

/** Sizes (P, M, G...) of one product: list, add, activate/deactivate and remove. */
export function ProductSizesDialog({ product, onClose }: Props) {
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!product) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/products/${product.id}/sizes`);
      setSizes(res.data.data ?? []);
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível carregar os tamanhos.'));
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    setName('');
    setSizes([]);
    if (product) load();
  }, [product, load]);

  if (!product) return null;

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Informe o nome do tamanho.');
      return;
    }
    setAdding(true);
    setError(null);
    try {
      await api.post(`/api/products/${product.id}/sizes`, { name: trimmed });
      setName('');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (size: ProductSize) => {
    setBusyId(size.id);
    setError(null);
    try {
      await api.put(`/api/products/${product.id}/sizes/${size.id}`, { active: !size.active });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (size: ProductSize) => {
    setBusyId(size.id);
    setError(null);
    try {
      await api.delete(`/api/products/${product.id}/sizes/${size.id}`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog visible title={`Tamanhos — ${product.name}`} onClose={onClose} width={520} footer={<Button label="Fechar" variant="secondary" onPress={onClose} />}>
      {error ? (
        <View style={{ marginBottom: space.md }}>
          <Banner message={error} />
        </View>
      ) : null}

      <View style={styles.addRow}>
        <View style={{ flex: 1 }}>
          <TextField label="Novo tamanho" value={name} onChangeText={setName} placeholder="Ex.: P, M, G ou 500ml" maxLength={100} />
        </View>
        <View style={styles.addButton}>
          <Button label="Adicionar" onPress={add} loading={adding} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : sizes.length === 0 ? (
        <Text style={styles.empty}>Nenhum tamanho cadastrado. O produto é vendido em tamanho único.</Text>
      ) : (
        sizes.map((s) => (
          <View key={s.id} style={styles.row}>
            <Text style={styles.sizeName}>{s.name}</Text>
            <View>
              <ActiveBadge active={s.active} />
            </View>
            <View style={styles.rowActions}>
              <Button label={s.active ? 'Desativar' : 'Ativar'} variant="ghost" small disabled={busyId === s.id} onPress={() => toggle(s)} />
              <Button label="Excluir" variant="ghost" small disabled={busyId === s.id} onPress={() => remove(s)} />
            </View>
          </View>
        ))
      )}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  addButton: { marginBottom: space.lg },
  empty: { color: colors.muted, fontSize: font.md, paddingVertical: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRadius: radius.sm,
  },
  sizeName: { flex: 1, fontSize: font.md, fontWeight: '600', color: colors.ink },
  rowActions: { flexDirection: 'row' },
});
