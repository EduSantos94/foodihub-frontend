import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { api, errorMessage } from '@/lib/api';
import { Table } from '@/lib/csv';
import { autoMap, columnLetter } from '@/lib/importMapping';
import { MAX_SPREADSHEET_ROWS, pickFile, readSpreadsheet } from '@/lib/spreadsheet';
import { colors, font, radius, space } from '@/lib/theme';
import { Button } from './ui/Button';
import { Banner } from './ui/Feedback';
import { SelectField, SwitchField } from './ui/Inputs';
import { Dialog } from './ui/Modal';

/** A field of the record that a spreadsheet column can be mapped to. */
export interface ImportField {
  key: string;
  label: string;
  /** Header names that map to this field on their own ("telefone", "celular"...) */
  aliases: string[];
}

/** A yes/no setting sent along with the rows (e.g. "skip customers with the same phone"). */
export interface ImportOption {
  key: string;
  label: string;
  help?: string;
  defaultValue: boolean;
}

export interface ImportProblem {
  row: number;
  status: 'error' | 'duplicate' | 'warning';
  error?: string;
  reason?: string;
  warnings: string[];
}

interface ImportResult {
  dry_run: boolean;
  total: number;
  created: number;
  duplicates: number;
  errors: number;
  with_warnings: number;
  problems: ImportProblem[];
  problems_truncated: boolean;
}

export interface ImportConfig {
  /** "Importar clientes" */
  title: string;
  /** "clientes" */
  plural: string;
  /** POST endpoint that accepts { rows, dry_run, ...options } */
  endpoint: string;
  fields: ImportField[];
  options?: ImportOption[];
  /** Message when the mapping is not enough to import (e.g. no name column), or null when it is fine */
  missing: (mapped: Set<string>) => string | null;
  /** One line per problem row, in Portuguese */
  describe: (problem: ImportProblem) => string;
  /** Sheet columns / file hint shown on the first step */
  hint?: string;
}

interface Props {
  config: ImportConfig;
  visible: boolean;
  onClose: () => void;
  /** Called after rows were really imported, so the list can reload */
  onImported: () => void;
}

type Step = 'pick' | 'map' | 'review' | 'done';

export function ImportDialog({ config, visible, onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>('pick');
  const [fileName, setFileName] = useState('');
  const [table, setTable] = useState<Table>([]);
  /** Spreadsheet line of table[0], so the report points at the right line */
  const [firstLine, setFirstLine] = useState(1);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!visible) return;
    setStep('pick');
    setFileName('');
    setTable([]);
    setFirstLine(1);
    setHasHeader(true);
    setMapping({});
    setOptions(Object.fromEntries((config.options ?? []).map((o) => [o.key, o.defaultValue])));
    setError(null);
    setResult(null);
    setBusy(false);
  }, [visible, config]);

  const width = Math.max(0, ...table.map((r) => r.length));
  const headers = useMemo(
    () => Array.from({ length: width }, (_, i) => (hasHeader ? (table[0]?.[i] ?? '') : `Coluna ${columnLetter(i)}`)),
    [table, width, hasHeader]
  );
  const dataRows = hasHeader ? table.slice(1) : table;
  const firstDataLine = firstLine + (hasHeader ? 1 : 0);
  const filledRows = dataRows.filter((r) => r.some((c) => c !== '')).length;

  const columnOptions = useMemo(
    () => [
      { value: '', label: '— Não importar —' },
      ...headers.map((h, i) => ({ value: String(i), label: `${columnLetter(i)} · ${h || '(sem título)'}` })),
    ],
    [headers]
  );

  const sample = (column: string): string | undefined => {
    if (column === '') return undefined;
    const value = dataRows.map((r) => r[Number(column)]).find((v) => v);
    return value ? `Exemplo: ${value}` : 'Coluna sem valores';
  };

  const choose = async () => {
    setError(null);
    try {
      const file = await pickFile('.xlsx,.csv,.txt');
      if (!file) return;
      setBusy(true);
      const { table: rows, firstLine: line } = await readSpreadsheet(file);
      if (rows.length - 1 > MAX_SPREADSHEET_ROWS) {
        throw new Error(`A planilha tem mais de ${MAX_SPREADSHEET_ROWS} linhas. Divida em arquivos menores e importe um de cada vez.`);
      }
      setFileName(file.name);
      setTable(rows);
      setFirstLine(line);
      setHasHeader(true);
      setMapping(autoMap(rows[0], config.fields));
      setStep('map');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível abrir o arquivo.');
    } finally {
      setBusy(false);
    }
  };

  const toggleHeader = (value: boolean) => {
    setHasHeader(value);
    setMapping(value ? autoMap(table[0] ?? [], config.fields) : {});
  };

  const mappedKeys = new Set(Object.entries(mapping).filter(([, v]) => v !== '').map(([k]) => k));

  const buildRows = () =>
    dataRows
      .map((cells, i) => {
        const row: Record<string, unknown> = { row: firstDataLine + i };
        let filled = false;
        for (const [key, column] of Object.entries(mapping)) {
          if (column === '') continue;
          const value = (cells[Number(column)] ?? '').trim();
          if (value) {
            row[key] = value;
            filled = true;
          }
        }
        return filled ? row : null;
      })
      .filter((r): r is Record<string, unknown> => r !== null);

  const send = async (dryRun: boolean): Promise<ImportResult | null> => {
    const rows = buildRows();
    if (rows.length === 0) {
      setError('Nenhuma linha com dados nas colunas escolhidas.');
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.post(config.endpoint, { rows, dry_run: dryRun, ...options }, { timeout: 120000 });
      return res.data.data as ImportResult;
    } catch (e) {
      setError(errorMessage(e, 'Não foi possível processar a planilha.'));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    const missing = config.missing(mappedKeys);
    if (missing) return setError(missing);
    const r = await send(true);
    if (r) {
      setResult(r);
      setStep('review');
    }
  };

  const run = async () => {
    const r = await send(false);
    if (r) {
      setResult(r);
      setStep('done');
      onImported();
    }
  };

  const footer = (() => {
    if (step === 'pick') return <Button label="Cancelar" variant="secondary" onPress={onClose} />;
    if (step === 'map')
      return (
        <>
          <Button label="Trocar arquivo" variant="secondary" onPress={() => setStep('pick')} disabled={busy} />
          <Button label="Verificar" onPress={check} loading={busy} />
        </>
      );
    if (step === 'review')
      return (
        <>
          <Button label="Voltar ao mapeamento" variant="secondary" onPress={() => setStep('map')} disabled={busy} />
          <Button label={`Importar ${result?.created ?? 0} ${config.plural}`} onPress={run} loading={busy} disabled={!result || result.created === 0} />
        </>
      );
    return <Button label="Fechar" onPress={onClose} />;
  })();

  const problems = result?.problems ?? [];

  return (
    <Dialog visible={visible} title={config.title} onClose={busy ? () => undefined : onClose} width={760} footer={footer}>
      {error ? (
        <View style={styles.gap}>
          <Banner message={error} />
        </View>
      ) : null}

      {step === 'pick' ? (
        <View>
          <Text style={styles.text}>
            Escolha uma planilha <Text style={styles.bold}>.xlsx</Text> ou <Text style={styles.bold}>.csv</Text> com a primeira linha contendo os títulos das colunas. Na próxima etapa você diz qual coluna vai para qual campo.
          </Text>
          {config.hint ? <Text style={[styles.text, styles.muted]}>{config.hint}</Text> : null}
          <Button label="Escolher arquivo" onPress={choose} loading={busy} style={{ alignSelf: 'flex-start', marginTop: space.lg }} />
        </View>
      ) : null}

      {step === 'map' ? (
        <View>
          <Text style={styles.text}>
            <Text style={styles.bold}>{fileName}</Text> · {filledRows} linha(s) de dados e {width} coluna(s).
          </Text>
          <View style={{ height: space.lg }} />
          <SwitchField label="A primeira linha tem os títulos das colunas" value={hasHeader} onChange={toggleHeader} />
          {config.fields.map((field) => (
            <SelectField
              key={field.key}
              label={field.label}
              value={mapping[field.key] ?? ''}
              options={columnOptions}
              onChange={(v) => {
                setError(null);
                setMapping((m) => ({ ...m, [field.key]: v }));
              }}
              help={sample(mapping[field.key] ?? '')}
            />
          ))}
          {(config.options ?? []).map((o) => (
            <SwitchField key={o.key} label={o.label} help={o.help} value={options[o.key] ?? o.defaultValue} onChange={(v) => setOptions((cur) => ({ ...cur, [o.key]: v }))} />
          ))}
        </View>
      ) : null}

      {step === 'review' || step === 'done' ? (
        <View>
          {busy ? <ActivityIndicator color={colors.primary} /> : null}
          {step === 'done' ? (
            <View style={styles.gap}>
              <Banner tone="success" message={`${result?.created ?? 0} ${config.plural} importado(s) com sucesso.`} />
            </View>
          ) : (
            <Text style={styles.text}>Confira o resultado antes de importar. Nada foi salvo ainda.</Text>
          )}
          <View style={styles.stats}>
            <Stat label={step === 'done' ? 'Importados' : 'Serão importados'} value={result?.created ?? 0} tone="success" />
            <Stat label="Já cadastrados / repetidos" value={result?.duplicates ?? 0} tone="muted" />
            <Stat label="Com erro" value={result?.errors ?? 0} tone="danger" />
            <Stat label="Com aviso" value={result?.with_warnings ?? 0} tone="warning" />
          </View>

          {problems.length > 0 ? (
            <View style={{ marginTop: space.lg }}>
              <Text style={styles.sectionTitle}>Linhas que merecem atenção</Text>
              {problems.map((p) => (
                <View key={`${p.row}-${p.status}`} style={styles.problem}>
                  <Text style={styles.problemRow}>Linha {p.row}</Text>
                  <Text style={[styles.problemText, p.status === 'error' && { color: colors.danger }]}>{config.describe(p)}</Text>
                </View>
              ))}
              {result?.problems_truncated ? <Text style={[styles.text, styles.muted]}>Mostrando só as primeiras {problems.length} ocorrências.</Text> : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </Dialog>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'success' | 'muted' | 'danger' | 'warning' }) {
  const color = { success: colors.success, muted: colors.muted, danger: colors.danger, warning: colors.warning }[tone];
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { marginBottom: space.md },
  text: { fontSize: font.md, color: colors.ink, lineHeight: 22, marginBottom: space.sm },
  muted: { color: colors.muted },
  bold: { fontWeight: '700' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.sm },
  stat: { flexGrow: 1, flexBasis: 140, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.md },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: font.sm, color: colors.muted },
  sectionTitle: { fontSize: font.lg, fontWeight: '700', color: colors.ink, marginBottom: space.sm },
  problem: { flexDirection: 'row', gap: space.md, paddingVertical: space.xs, borderTopWidth: 1, borderTopColor: colors.border },
  problemRow: { width: 80, fontSize: font.sm, fontWeight: '700', color: colors.muted },
  problemText: { flex: 1, fontSize: font.sm, color: colors.ink },
});
