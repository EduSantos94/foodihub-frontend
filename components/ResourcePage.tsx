import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, errorMessage, listPage, Page } from '@/lib/api';
import { parseDecimal, toInputNumber } from '@/lib/format';
import { colors, font, space } from '@/lib/theme';
import { Button } from './ui/Button';
import { DataTable, Column } from './ui/DataTable';
import { Banner } from './ui/Feedback';
import { SelectField, SwitchField, TextField, Option } from './ui/Inputs';
import { ConfirmDialog, Dialog } from './ui/Modal';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'decimal' | 'integer' | 'select' | 'switch' | 'email';
  required?: boolean;
  placeholder?: string;
  help?: string;
  maxLength?: number;
  /** Static options for type "select" */
  options?: Option[];
  /** Options loaded from the API for type "select" (first page of up to 100 items) */
  remote?: {
    endpoint: string;
    label: (row: any) => string;
    emptyLabel?: string;
    /** Hides rows that should not be offered (the currently selected value is always kept) */
    filter?: (row: any) => boolean;
  };
  /** Only shown when editing (e.g. the "active" switch) */
  editOnly?: boolean;
  /** Only shown when creating */
  createOnly?: boolean;
  defaultValue?: string | boolean;
}

export interface ResourceConfig<T extends { id: string }> {
  title: string;
  subtitle?: string;
  singular: string; // "produto"
  endpoint: string; // "/api/products"
  /** Feminine nouns need "Nova"/"nenhuma" */
  feminine?: boolean;
  columns: (lookups: Record<string, Map<string, string>>) => Column<T>[];
  fields: FieldDef[];
  /** Maps other resources to id -> label so columns can show names instead of ids */
  lookups?: Record<string, { endpoint: string; label: (row: any) => string }>;
  itemName: (row: T) => string;
  emptyHint?: string;
}

type Values = Record<string, string | boolean>;

interface Props<T extends { id: string }> {
  config: ResourceConfig<T>;
  canWrite: boolean;
  /** Extra buttons on each row (e.g. "Tamanhos") */
  rowActions?: (row: T) => React.ReactNode;
  /** Message when the user cannot write */
  readOnlyNote?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ResourcePage<T extends { id: string }>({ config, canWrite, rowActions, readOnlyNote }: Props<T>) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lookups, setLookups] = useState<Record<string, Map<string, string>>>({});
  const [notice, setNotice] = useState<string | null>(null);

  // form dialog
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [remoteOptions, setRemoteOptions] = useState<Record<string, Option[]>>({});

  // delete dialog
  const [deleting, setDeleting] = useState<T | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setLoadError(null);
      try {
        setResult(await listPage<T>(config.endpoint, p));
      } catch (err) {
        setLoadError(errorMessage(err, `Não foi possível carregar ${config.title.toLowerCase()}.`));
      } finally {
        setLoading(false);
      }
    },
    [config.endpoint, config.title]
  );

  useEffect(() => {
    load(page);
  }, [load, page]);

  // id -> label maps for columns that reference other resources
  useEffect(() => {
    if (!config.lookups) return;
    let cancelled = false;
    Object.entries(config.lookups).forEach(async ([key, def]) => {
      try {
        const res = await listPage<any>(def.endpoint, 1, 100);
        if (!cancelled) {
          setLookups((prev) => ({ ...prev, [key]: new Map(res.data.map((r) => [r.id, def.label(r)])) }));
        }
      } catch {
        /* names fall back to "—"; the page itself still works */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [config.lookups]);

  const isNew = editing === 'new';
  const visibleFields = useMemo(
    () => config.fields.filter((f) => (isNew ? !f.editOnly : !f.createOnly)),
    [config.fields, isNew]
  );

  const openForm = async (row: T | 'new') => {
    const initial: Values = {};
    for (const f of config.fields) {
      const raw = row === 'new' ? undefined : (row as any)[f.key];
      if (f.type === 'switch') initial[f.key] = row === 'new' ? Boolean(f.defaultValue ?? true) : Boolean(raw);
      else if (f.type === 'decimal' || f.type === 'integer') initial[f.key] = raw === undefined || raw === null ? String(f.defaultValue ?? '') : toInputNumber(raw);
      else initial[f.key] = raw === undefined || raw === null ? String(f.defaultValue ?? '') : String(raw);
    }
    setValues(initial);
    setErrors({});
    setFormError(null);
    setEditing(row);

    // load remote select options once per dialog open
    for (const f of config.fields) {
      if (f.type === 'select' && f.remote) {
        try {
          const res = await listPage<any>(f.remote.endpoint, 1, 100);
          const current = row === 'new' ? '' : String((row as any)[f.key] ?? '');
          const opts = res.data
            .filter((r) => !f.remote!.filter || f.remote!.filter(r) || r.id === current)
            .map((r) => ({ value: r.id, label: f.remote!.label(r) }));
          setRemoteOptions((prev) => ({ ...prev, [f.key]: [{ value: '', label: f.remote!.emptyLabel ?? 'Nenhuma' }, ...opts] }));
        } catch {
          setRemoteOptions((prev) => ({ ...prev, [f.key]: [] }));
        }
      }
    }
  };

  const setValue = (key: string, v: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    for (const f of visibleFields) {
      const v = values[f.key];
      if (f.type === 'switch') continue;
      const text = String(v ?? '').trim();
      if (f.required && !text) {
        next[f.key] = 'Campo obrigatório';
        continue;
      }
      if (!text) continue;
      if (f.type === 'decimal') {
        const n = parseDecimal(text);
        if (Number.isNaN(n) || n < 0) next[f.key] = 'Informe um número válido (maior ou igual a 0)';
      } else if (f.type === 'integer') {
        const n = parseDecimal(text);
        if (!Number.isInteger(n) || n < 0) next[f.key] = 'Informe um número inteiro (maior ou igual a 0)';
      } else if (f.type === 'email' && !EMAIL.test(text)) {
        next[f.key] = 'E-mail inválido';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {};
    for (const f of visibleFields) {
      const v = values[f.key];
      if (f.type === 'switch') {
        payload[f.key] = Boolean(v);
        continue;
      }
      const text = String(v ?? '').trim();
      if (!text) {
        // creating: leave optional fields out; editing: clear them
        if (!isNew) payload[f.key] = f.required ? undefined : null;
        continue;
      }
      payload[f.key] = f.type === 'decimal' || f.type === 'integer' ? parseDecimal(text) : text;
    }
    return payload;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    setFormError(null);
    try {
      if (isNew) await api.post(config.endpoint, buildPayload());
      else await api.put(`${config.endpoint}/${(editing as T).id}`, buildPayload());
      setEditing(null);
      setNotice(isNew ? `${cap(config.singular)} ${config.feminine ? 'criada' : 'criado'} com sucesso.` : 'Alterações salvas.');
      if (isNew && page !== 1) setPage(1);
      else await load(page);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.delete(`${config.endpoint}/${deleting.id}`);
      setDeleting(null);
      setNotice(`${cap(config.singular)} ${config.feminine ? 'excluída' : 'excluído'}.`);
      // stay on a valid page when the last row of the last page was removed
      const left = (result?.data.length ?? 1) - 1;
      if (left === 0 && page > 1) setPage(page - 1);
      else await load(page);
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo(() => config.columns(lookups), [config, lookups]);
  const newLabel = `${config.feminine ? 'Nova' : 'Novo'} ${config.singular}`;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={styles.title} accessibilityRole="header">
            {config.title}
          </Text>
          {config.subtitle ? <Text style={styles.subtitle}>{config.subtitle}</Text> : null}
        </View>
        {canWrite ? <Button label={`+ ${newLabel}`} onPress={() => openForm('new')} /> : null}
      </View>

      {!canWrite && readOnlyNote ? <Banner tone="info" message={readOnlyNote} /> : null}
      {notice ? (
        <View style={styles.gap}>
          <Banner tone="success" message={notice} />
        </View>
      ) : null}
      {loadError ? (
        <View style={styles.gap}>
          <Banner message={loadError} />
          <View style={{ marginTop: space.sm, alignSelf: 'flex-start' }}>
            <Button label="Tentar novamente" variant="secondary" small onPress={() => load(page)} />
          </View>
        </View>
      ) : null}

      <View style={styles.gap}>
        <DataTable
          columns={columns}
          rows={result?.data ?? []}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle={`Nenhum${config.feminine ? 'a' : ''} ${config.singular} ${config.feminine ? 'cadastrada' : 'cadastrado'}`}
          emptyHint={canWrite ? (config.emptyHint ?? `Use “${newLabel}” para começar.`) : undefined}
          pagination={result?.pagination}
          onPageChange={setPage}
          actions={
            canWrite
              ? (row) => (
                  <>
                    {rowActions?.(row)}
                    <Button label="Editar" variant="ghost" small onPress={() => openForm(row)} />
                    <Button
                      label="Excluir"
                      variant="ghost"
                      small
                      onPress={() => {
                        setDeleteError(null);
                        setDeleting(row);
                      }}
                    />
                  </>
                )
              : rowActions
          }
        />
      </View>

      <Dialog
        visible={editing !== null}
        title={isNew ? newLabel : `Editar ${config.singular}`}
        onClose={() => (saving ? undefined : setEditing(null))}
        footer={
          <>
            <Button label="Cancelar" variant="secondary" onPress={() => setEditing(null)} disabled={saving} />
            <Button label={isNew ? 'Criar' : 'Salvar'} onPress={save} loading={saving} />
          </>
        }
      >
        {formError ? (
          <View style={{ marginBottom: space.md }}>
            <Banner message={formError} />
          </View>
        ) : null}
        {visibleFields.map((f) => {
          if (f.type === 'switch') {
            return <SwitchField key={f.key} label={f.label} help={f.help} value={Boolean(values[f.key])} onChange={(v) => setValue(f.key, v)} />;
          }
          if (f.type === 'select') {
            return (
              <SelectField
                key={f.key}
                label={f.label}
                required={f.required}
                help={f.help}
                error={errors[f.key]}
                value={String(values[f.key] ?? '')}
                onChange={(v) => setValue(f.key, v)}
                options={f.options ?? remoteOptions[f.key] ?? []}
              />
            );
          }
          return (
            <TextField
              key={f.key}
              label={f.label}
              required={f.required}
              help={f.help}
              error={errors[f.key]}
              placeholder={f.placeholder}
              maxLength={f.maxLength}
              multiline={f.type === 'textarea'}
              keyboardType={f.type === 'decimal' ? 'decimal-pad' : f.type === 'integer' ? 'number-pad' : f.type === 'email' ? 'email-address' : 'default'}
              value={String(values[f.key] ?? '')}
              onChangeText={(t) => setValue(f.key, t)}
            />
          );
        })}
      </Dialog>

      <ConfirmDialog
        visible={deleting !== null}
        title={`Excluir ${config.singular}`}
        message={deleting ? `Tem certeza que deseja excluir “${config.itemName(deleting)}”? Esta ação não pode ser desfeita.` : ''}
        loading={deleteLoading}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </ScrollView>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap', marginBottom: space.lg },
  title: { fontSize: font.xxl, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: font.md, color: colors.muted, marginTop: 2 },
  gap: { marginTop: space.md },
});
