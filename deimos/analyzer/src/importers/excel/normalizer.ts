import {
  normalizeText,
  normalizeDomain,
  parseDate,
  toStringOrUndefined,
  toNumberOrUndefined,
  toBooleanOrDefault,
} from '../../utils/text';
import type {
  ColumnMappingConfig,
  MappedOffer,
  NormalizedObservation,
  ValidationResult,
} from '../../types/index';

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

/**
 * Valida os campos de um MappedOffer antes da normalização.
 * Apenas canonical_name é obrigatório — todo o resto é opcional.
 */
export function validateRow(
  mapped: MappedOffer,
  _config: ColumnMappingConfig,
): ValidationResult {
  const result: ValidationResult = {
    rowIndex: mapped.rowIndex,
    valid: true,
    errors: [],
    warnings: [],
  };

  const { fields } = mapped;

  // Obrigatório: nome da oferta
  const name = toStringOrUndefined(fields.canonical_name);
  if (!name) {
    result.errors.push({
      field: 'canonical_name',
      message: 'Campo obrigatório ausente ou vazio',
    });
  }

  // Aviso: data ausente (afeta scoring de recência)
  if (fields.observed_at == null || fields.observed_at === '') {
    result.warnings.push({
      field: 'observed_at',
      message: 'Data de observação ausente — afeta cálculo de recência e constância',
    });
  } else {
    const d = parseDate(fields.observed_at);
    if (!d) {
      result.warnings.push({
        field: 'observed_at',
        message: `Data "${fields.observed_at}" não pôde ser interpretada`,
      });
    }
  }

  if (result.errors.length > 0) result.valid = false;
  return result;
}

// ---------------------------------------------------------------------------
// Normalização
// ---------------------------------------------------------------------------

/**
 * Normaliza um MappedOffer validado em NormalizedObservation.
 * Cada linha do Excel se torna uma observação individual — nunca descartada.
 */
export function normalizeRow(mapped: MappedOffer): NormalizedObservation {
  const { fields, raw, rowIndex } = mapped;

  const raw_name = toStringOrUndefined(fields.canonical_name)!;
  const normalized_name = normalizeText(raw_name);

  const domainRaw = toStringOrUndefined(fields.primary_domain);
  const domain = domainRaw
    ? (normalizeDomain(domainRaw) || undefined)
    : undefined;

  const observed_at = parseDate(fields.observed_at);

  const day1 = toNonNegativeInt(fields.active_ads_day1);
  const day2 = toNonNegativeInt(fields.active_ads_day2);
  const day3 = toNonNegativeInt(fields.active_ads_day3);
  const day4 = toNonNegativeInt(fields.active_ads_day4);
  const day5 = toNonNegativeInt(fields.active_ads_day5);
  const day6 = toNonNegativeInt(fields.active_ads_day6);

  const dayCounts = [day1, day2, day3, day4, day5, day6].filter(
    (d): d is number => d != null,
  );
  // Pico semanal: máximo dos dias disponíveis
  const total_active_ads = dayCounts.length > 0 ? Math.max(...dayCounts) : 0;

  const normalizeField = (val: unknown): string | undefined => {
    const s = toStringOrUndefined(val);
    return s ? s.trim().replace(/\s+/g, ' ') : undefined;
  };

  return {
    rowIndex,
    raw_name,
    normalized_name,
    domain,
    observed_at,
    active_ads_day1: day1,
    active_ads_day2: day2,
    active_ads_day3: day3,
    active_ads_day4: day4,
    active_ads_day5: day5,
    active_ads_day6: day6,
    total_active_ads,
    checkout_type:  normalizeField(fields.checkout_type),
    offer_tested:   fields.offer_tested != null
      ? toBooleanOrDefault(fields.offer_tested, false)
      : undefined,
    roi_result:     normalizeField(fields.roi_result),
    insights:       normalizeField(fields.insights),
    notes:          normalizeField(fields.notes),
    _raw: raw,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNonNegativeInt(value: unknown): number | undefined {
  const n = toNumberOrUndefined(value);
  if (n == null || isNaN(n) || n < 0) return undefined;
  return Math.round(n);
}
