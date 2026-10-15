import { cleanCnpj, isValidCnpj, maskCnpj, onlyDigits } from './cnpj';
import { parseDateBR } from './format';

/**
 * Input masks shared by every form. Each one knows how to format while typing, how to validate and
 * whether the value is stored as digits only (documents, phone and CEP are, so uniqueness and search
 * do not depend on punctuation; the CNPJ keeps its letters). To add a new mask, add an entry to MASKS and use `mask="name"` on a
 * TextField or `mask: 'name'` on a ResourcePage field.
 */
export type MaskName = 'phone' | 'cnpj' | 'cpf' | 'cep' | 'uf' | 'date' | 'decimal' | 'integer';

export interface MaskDef {
  /** Formats what was typed so far; safe to call on an already formatted value */
  format: (text: string) => string;
  /** Error message for a non-empty value, or null when it is fine */
  validate: (text: string) => string | null;
  /** Strips the punctuation: the value sent to the API (null = send the text as typed, trimmed) */
  clean: ((text: string) => string) | null;
  maxLength: number;
  placeholder?: string;
  keyboard: 'default' | 'number-pad' | 'decimal-pad' | 'phone-pad';
}

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

/** 11144477735 -> 111.444.777-35 */
export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length: number): number => {
    const sum = Array.from({ length }, (_, i) => Number(cpf[i]) * (length + 1 - i)).reduce((a, b) => a + b, 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

/** 11912345678 -> (11) 91234-5678 ; 1134567890 -> (11) 3456-7890 */
export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 01310100 -> 01310-100 */
export function formatCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function formatDate(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Digits and a single comma ("12,50"); a typed dot becomes a comma */
function formatDecimal(value: string): string {
  const cleaned = value.replace(/\./g, ',').replace(/[^\d,]/g, '');
  const [int, ...rest] = cleaned.split(',');
  return rest.length ? `${int},${rest.join('')}` : int;
}

export const MASKS: Record<MaskName, MaskDef> = {
  phone: {
    format: formatPhone,
    validate: (t) => {
      const d = onlyDigits(t);
      return (d.length === 10 || d.length === 11) && Number(d.slice(0, 2)) >= 11 ? null : 'Telefone inválido. Informe o DDD e o número.';
    },
    clean: onlyDigits,
    maxLength: 15,
    placeholder: '(11) 91234-5678',
    keyboard: 'phone-pad',
  },
  cnpj: {
    format: maskCnpj,
    validate: (t) => (isValidCnpj(t) ? null : 'CNPJ inválido'),
    clean: cleanCnpj,
    maxLength: 18,
    placeholder: 'XX.XXX.XXX/XXXX-00',
    keyboard: 'default',
  },
  cpf: {
    format: formatCpf,
    validate: (t) => (isValidCpf(t) ? null : 'CPF inválido'),
    clean: onlyDigits,
    maxLength: 14,
    placeholder: '000.000.000-00',
    keyboard: 'number-pad',
  },
  cep: {
    format: formatCep,
    validate: (t) => (onlyDigits(t).length === 8 ? null : 'CEP inválido. Use 8 números.'),
    clean: onlyDigits,
    maxLength: 9,
    placeholder: '00000-000',
    keyboard: 'number-pad',
  },
  uf: {
    format: (t) => t.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2),
    validate: (t) => (UFS.includes(t.toUpperCase()) ? null : 'UF inválida'),
    clean: null,
    maxLength: 2,
    placeholder: 'SP',
    keyboard: 'default',
  },
  date: {
    format: formatDate,
    validate: (t) => (parseDateBR(t) ? null : 'Data inválida. Use DD/MM/AAAA.'),
    clean: null,
    maxLength: 10,
    placeholder: 'DD/MM/AAAA',
    keyboard: 'number-pad',
  },
  decimal: {
    format: formatDecimal,
    validate: () => null,
    clean: null,
    maxLength: 15,
    keyboard: 'decimal-pad',
  },
  integer: {
    format: (t) => onlyDigits(t),
    validate: () => null,
    clean: null,
    maxLength: 9,
    keyboard: 'number-pad',
  },
};

/** The value to send to the API for a masked field */
export function unmask(mask: MaskName, text: string): string {
  const def = MASKS[mask];
  return def.clean ? def.clean(text) : text.trim();
}
