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
