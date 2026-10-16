import { Platform } from 'react-native';
import { decodeCsv, parseCsv, Table, toTable } from './csv';

export const MAX_SPREADSHEET_ROWS = 5000;

/**
 * Reads the first sheet of an .xlsx file or a .csv file. `firstLine` is the spreadsheet line of the
 * first row returned. Throws an Error with a message for the user.
 */
export async function readSpreadsheet(file: File): Promise<{ table: Table; firstLine: number }> {
  const name = file.name.toLowerCase();
  let result: { table: Table; firstLine: number };

  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    result = toTable(parseCsv(decodeCsv(await file.arrayBuffer())));
  } else if (name.endsWith('.xlsx')) {
    try {
      const { readSheet } = await import('read-excel-file/browser');
      result = toTable(await readSheet(file));
    } catch {
      throw new Error('Não foi possível ler o arquivo. Confira se é uma planilha .xlsx válida.');
    }
  } else if (name.endsWith('.xls')) {
    throw new Error('O formato .xls antigo não é suportado. Salve a planilha como .xlsx ou .csv e tente de novo.');
  } else {
    throw new Error('Formato não suportado. Use um arquivo .xlsx ou .csv.');
  }

  if (result.table.length === 0) throw new Error('A planilha está vazia.');
  return result;
}

/** Opens the browser's file chooser. Resolves null when the user cancels. Web only. */
export function pickFile(accept: string): Promise<File | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.reject(new Error('A importação de planilhas está disponível na versão web.'));
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    input.onchange = () => {
      resolve(input.files?.[0] ?? null);
      input.remove();
    };
    // fires when the chooser is dismissed without a choice (browsers that support it)
    input.oncancel = () => {
      resolve(null);
      input.remove();
    };
    document.body.appendChild(input);
    input.click();
  });
}
