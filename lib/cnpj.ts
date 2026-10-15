export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

/** Strips punctuation and upper-cases: the CNPJ accepts letters in its first 12 characters. */
export const cleanCnpj = (value: string): string => value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

/** 11222333000181 -> 11.222.333/0001-81 ; 12ABC34501DE35 -> 12.ABC.345/01DE-35 (formats what exists so far) */
export function maskCnpj(value: string): string {
  const raw = cleanCnpj(value);
  // the last two characters are check digits: numbers only
  const c = raw.slice(0, 12) + onlyDigits(raw.slice(12)).slice(0, 2);
  let out = c.slice(0, 2);
  if (c.length > 2) out += `.${c.slice(2, 5)}`;
  if (c.length > 5) out += `.${c.slice(5, 8)}`;
  if (c.length > 8) out += `/${c.slice(8, 12)}`;
  if (c.length > 12) out += `-${c.slice(12)}`;
  return out;
}

/** Same rule the API applies: numeric or alphanumeric CNPJ with both check digits. */
export function isValidCnpj(value: string): boolean {
  const cnpj = cleanCnpj(value);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) return false;
  const digit = (length: number): number => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const rest = weights.reduce((sum, w, i) => sum + (cnpj.charCodeAt(i) - 48) * w, 0) % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13]);
}
