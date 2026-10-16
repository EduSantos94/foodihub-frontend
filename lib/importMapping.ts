/** Helpers to map spreadsheet columns to record fields. */

export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const columnLetter = (i: number): string => {
  let n = i;
  let out = '';
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
};

/** Maps each field to the column whose title matches one of its aliases (exact match first, then a whole-word match). */
export function autoMap(headers: string[], fields: { key: string; aliases: string[] }[]): Record<string, string> {
  const titles = headers.map(normalize);
  const used = new Set<number>();
  const result: Record<string, string> = {};
  const assign = (matches: (title: string, alias: string) => boolean) => {
    for (const field of fields) {
      if (result[field.key] !== undefined) continue;
      const aliases = field.aliases.map(normalize);
      const index = titles.findIndex((t, i) => !used.has(i) && t !== '' && aliases.some((a) => matches(t, a)));
      if (index >= 0) {
        used.add(index);
        result[field.key] = String(index);
      }
    }
  };
  assign((t, a) => t === a);
  assign((t, a) => ` ${t} `.includes(` ${a} `));
  return result;
}
