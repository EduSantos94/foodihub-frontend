/** Every cell as text, rows as read from a sheet or CSV; no empty rows. */
export type Table = string[][];

export const cellText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    const dd = String(value.getUTCDate()).padStart(2, '0');
    const mm = String(value.getUTCMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${value.getUTCFullYear()}`;
  }
  if (typeof value === 'number') return Number.isInteger(value) ? value.toFixed(0) : String(value);
  return String(value).trim();
};

const isEmptyRow = (row: string[]): boolean => row.every((c) => c === '');

/**
 * Cells as text, without the empty rows at the start and end of the sheet. Empty rows in the middle
 * stay, so a row's position still matches its line in the spreadsheet: `firstLine` is the line (1 =
 * first) of `table[0]`.
 */
export const toTable = (rows: unknown[][]): { table: Table; firstLine: number } => {
  const all = rows.map((r) => r.map(cellText));
  let start = 0;
  let end = all.length;
  while (start < end && isEmptyRow(all[start])) start++;
  while (end > start && isEmptyRow(all[end - 1])) end--;
  return { table: all.slice(start, end), firstLine: start + 1 };
};

/** CSV decoded as UTF-8, falling back to Windows-1252 (what Excel in Brazil saves as "CSV") */
export function decodeCsv(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

/** Minimal CSV reader (returns the raw rows, see toTable): quoted fields, "" escapes, CRLF/LF, and the delimiter (; , or tab) is guessed from the first line. */
export function parseCsv(content: string): string[][] {
  const firstLine = content.split(/\r?\n/, 1)[0] ?? '';
  const count = (ch: string) => firstLine.split(ch).length - 1;
  const delimiter = [';', ',', '\t'].reduce((best, ch) => (count(ch) > count(best) ? ch : best), ',');

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (quoted) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && content[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

