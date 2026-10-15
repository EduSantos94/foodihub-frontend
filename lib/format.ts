const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 });

export const formatBRL = (value: number | string | null | undefined): string =>
  value === null || value === undefined || value === '' ? '—' : brl.format(Number(value));

export const formatNumber = (value: number | string | null | undefined): string =>
  value === null || value === undefined || value === '' ? '—' : num.format(Number(value));

/** Accepts "12,5" and "12.5". Returns NaN when it is not a number. */
export const parseDecimal = (text: string): number => Number(text.trim().replace(',', '.'));

export const toInputNumber = (value: number | string | null | undefined): string =>
  value === null || value === undefined ? '' : String(value).replace('.', ',');

export const fullName = (c: { first_name: string; last_name?: string }): string =>
  [c.first_name, c.last_name].filter(Boolean).join(' ');

/** "2026-10-14" or "2026-10-14T00:00:00.000Z" -> "14/10/2026" (no timezone math: DATE columns have no time) */
export const formatDate = (value: string | null | undefined): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
};

export const todayBR = (): string => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/** "14/10/2026" -> "2026-10-14"; null when it is not a real date */
export const parseDateBR = (text: string): string | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (d.getFullYear() !== Number(yyyy) || d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) return null;
  return `${yyyy}-${mm}-${dd}`;
};
