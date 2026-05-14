import ExcelJS from 'exceljs';
import { logger } from '../../utils/logger';
import type { RawRow } from '../../types/index';

export interface SheetData {
  sheetName: string;
  headers: string[];
  rows: Array<{ rowIndex: number; data: RawRow }>;
}

export interface ReaderOptions {
  worksheetIndex?: number;   // 0-based; default = 0 (primeira aba)
  headerRow?: number;        // 1-based; default = 1 (primeira linha)
}

/**
 * Lê um arquivo Excel e retorna dados da aba selecionada.
 * - Usa exceljs para preservar tipos nativos (Date, Number, Boolean, String)
 * - Linhas completamente vazias são ignoradas automaticamente
 * - Células de fórmula retornam o valor calculado (result), não a fórmula
 */
export async function readExcelFile(
  filePath: string,
  options: ReaderOptions = {},
): Promise<SheetData> {
  const { worksheetIndex = 0, headerRow = 1 } = options;

  logger.info(`Lendo arquivo: ${filePath}`);

  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(filePath);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Falha ao abrir o arquivo Excel: ${msg}`);
  }

  // Identificar a aba
  const worksheets = workbook.worksheets;
  if (worksheets.length === 0) {
    throw new Error('O arquivo Excel não contém nenhuma aba.');
  }
  if (worksheetIndex >= worksheets.length) {
    throw new Error(
      `Índice de aba ${worksheetIndex} inválido. O arquivo tem ${worksheets.length} aba(s): ` +
      worksheets.map((ws, i) => `[${i}] ${ws.name}`).join(', '),
    );
  }

  const worksheet = worksheets[worksheetIndex];
  logger.info(`Aba selecionada: "${worksheet.name}" (${worksheets.length} aba(s) disponíveis)`);

  // Extrair headers da linha especificada
  const headerRowData = worksheet.getRow(headerRow);
  const headers: string[] = [];
  headerRowData.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const value = extractCellValue(cell);
    headers[colNumber - 1] = value != null ? String(value).trim() : `Column_${colNumber}`;
  });

  if (headers.length === 0) {
    throw new Error(`A linha ${headerRow} está vazia. Verifique se o arquivo possui cabeçalhos.`);
  }

  logger.info(`Cabeçalhos encontrados (${headers.length}): ${headers.slice(0, 8).join(', ')}${headers.length > 8 ? '...' : ''}`);

  // Extrair linhas de dados
  const rows: Array<{ rowIndex: number; data: RawRow }> = [];
  let skippedEmpty = 0;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRow) return; // pula cabeçalho

    const data: RawRow = {};
    let hasAnyValue = false;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (!header) return;
      const value = extractCellValue(cell);
      data[header] = value;
      if (value != null && value !== '') hasAnyValue = true;
    });

    if (!hasAnyValue) {
      skippedEmpty++;
      return;
    }

    // Preenche colunas ausentes na linha com null
    headers.forEach(h => {
      if (!(h in data)) data[h] = null;
    });

    rows.push({ rowIndex: rowNumber, data });
  });

  logger.info(`Linhas lidas: ${rows.length} (${skippedEmpty} linha(s) vazia(s) ignoradas)`);

  return {
    sheetName: worksheet.name,
    headers,
    rows,
  };
}

/**
 * Extrai o valor de uma célula respeitando seu tipo nativo.
 * Fórmulas retornam o resultado calculado.
 */
function extractCellValue(cell: ExcelJS.Cell): unknown {
  const { value } = cell;

  if (value == null) return null;

  // Fórmula: pega o resultado calculado
  if (typeof value === 'object' && 'formula' in value) {
    const formulaValue = value as ExcelJS.CellFormulaValue;
    return formulaValue.result ?? null;
  }

  // Rich text: concatena as partes
  if (typeof value === 'object' && 'richText' in value) {
    const rtValue = value as ExcelJS.CellRichTextValue;
    return rtValue.richText.map(rt => rt.text).join('');
  }

  // Hyperlink: retorna o texto de exibição ou o endereço
  if (typeof value === 'object' && 'hyperlink' in value) {
    const hlValue = value as ExcelJS.CellHyperlinkValue;
    return hlValue.text ?? hlValue.hyperlink ?? null;
  }

  // Erro de célula
  if (typeof value === 'object' && 'error' in value) {
    return null;
  }

  return value;
}
