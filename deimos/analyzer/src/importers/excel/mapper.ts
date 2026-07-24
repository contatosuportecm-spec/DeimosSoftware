import { normalizeText } from '../../utils/text';
import { logger } from '../../utils/logger';
import type {
  ColumnMappingConfig,
  MappedOffer,
  RawRow,
} from '../../types/index';

/** Mapeamento resolvido: campo DB → índice da coluna no Excel (0-based) */
type ResolvedMapping = Map<string, number>;

/**
 * Resolve qual coluna Excel corresponde a cada campo do banco.
 * Matching case-insensitive e sem acentos.
 * Retorna também os headers não reconhecidos para fins de log.
 */
export function resolveColumnMapping(
  headers: string[],
  config: ColumnMappingConfig,
): { resolved: ResolvedMapping; unmappedHeaders: string[] } {
  const resolved: ResolvedMapping = new Map();
  const normalizedHeaders = headers.map(h => normalizeText(h));
  const mappedHeaderIndices = new Set<number>();

  for (const [field, aliases] of Object.entries(config.mappings)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeText(alias);
      const idx = normalizedHeaders.indexOf(normalizedAlias);
      if (idx !== -1) {
        resolved.set(field, idx);
        mappedHeaderIndices.add(idx);
        break;
      }
    }
  }

  const unmappedHeaders = headers.filter((_, i) => !mappedHeaderIndices.has(i));

  // Log do resultado do mapeamento
  const mappedFields = [...resolved.keys()];
  const totalFields = Object.keys(config.mappings).length;
  logger.info(
    `Mapeamento de colunas: ${mappedFields.length}/${totalFields} campos reconhecidos`,
  );

  if (unmappedHeaders.length > 0) {
    logger.warn(
      `${unmappedHeaders.length} coluna(s) não mapeadas (serão ignoradas): ${unmappedHeaders.join(', ')}`,
    );
  }

  if (!resolved.has('canonical_name')) {
    throw new Error(
      'Coluna obrigatória "canonical_name" não encontrada. ' +
      'Verifique a configuração de mapeamento em config/column-mapping.json. ' +
      `Headers disponíveis: ${headers.join(', ')}`,
    );
  }

  return { resolved, unmappedHeaders };
}

/**
 * Aplica o mapeamento resolvido a uma linha bruta, retornando um MappedOffer.
 */
export function mapRow(
  rowIndex: number,
  rawData: RawRow,
  headers: string[],
  resolved: ResolvedMapping,
  unmappedHeaders: string[],
): MappedOffer {
  const fields: Partial<Record<string, unknown>> = {};

  for (const [field, colIndex] of resolved.entries()) {
    const header = headers[colIndex];
    if (header !== undefined && header in rawData) {
      fields[field] = rawData[header];
    }
  }

  return {
    rowIndex,
    raw: rawData,
    fields: fields as MappedOffer['fields'],
    unmappedColumns: unmappedHeaders,
  };
}

/**
 * Mapeia todas as linhas de uma vez.
 */
export function mapAllRows(
  rows: Array<{ rowIndex: number; data: RawRow }>,
  headers: string[],
  resolved: ResolvedMapping,
  unmappedHeaders: string[],
): MappedOffer[] {
  return rows.map(({ rowIndex, data }) =>
    mapRow(rowIndex, data, headers, resolved, unmappedHeaders),
  );
}
