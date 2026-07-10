// =============================================================================
// Utilitários de texto e similaridade
// Sem dependências externas — implementações próprias leves
// =============================================================================

// ---------------------------------------------------------------------------
// Normalização
// ---------------------------------------------------------------------------

/**
 * Normalização base: remove acentos, lowercase, trim, colapsa espaços.
 * Usada para matching de cabeçalhos e comparação de enum aliases.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Extrai o domínio de uma URL ou string de domínio.
 * Retorna apenas o hostname em lowercase, sem www, sem path.
 * Ex: "https://www.MinhaLanding.com.br/page?id=1" → "minhalanding.com.br"
 */
export function normalizeDomain(input: string): string {
  if (!input) return '';
  let str = input.trim().toLowerCase();
  // Adiciona protocolo se não tiver (para o URL parser funcionar)
  if (!str.startsWith('http://') && !str.startsWith('https://')) {
    str = 'https://' + str;
  }
  try {
    const url = new URL(str);
    return url.hostname.replace(/^www\./, '');
  } catch {
    // Fallback: retira protocolo e path manualmente
    return str
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0];
  }
}

/**
 * Normaliza uma URL: lowercase no domínio, remove trailing slash, preserva path.
 */
export function normalizeUrl(input: string): string {
  if (!input) return '';
  try {
    const url = new URL(input.trim());
    url.hostname = url.hostname.toLowerCase();
    return url.toString().replace(/\/$/, '');
  } catch {
    return input.trim().replace(/\/$/, '');
  }
}

// ---------------------------------------------------------------------------
// Tokenização para Jaccard
// ---------------------------------------------------------------------------

/** Stopwords PT-BR e EN removidas antes do cálculo de similaridade */
const STOPWORDS = new Set([
  // PT-BR
  'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'para', 'com', 'por', 'uma', 'um', 'e', 'ou', 'que', 'se',
  'como', 'ao', 'aos', 'pelo', 'pela', 'ser', 'ter', 'ate',
  // EN
  'the', 'a', 'an', 'and', 'or', 'for', 'of', 'in', 'on', 'to',
  'with', 'by', 'is', 'are', 'was', 'be', 'as', 'at', 'from',
]);

/**
 * Tokeniza uma string para cálculo de similaridade.
 * - Normaliza acentos e lowercase
 * - Remove stopwords e tokens curtos (< 3 chars)
 * - Retorna Set de tokens únicos
 */
export function tokenize(value: string): Set<string> {
  const normalized = normalizeText(value);
  const tokens = normalized
    .split(/[\s\-_\/.,;:!?()'"""]+/)
    .filter(t => t.length >= 3 && !STOPWORDS.has(t));
  return new Set(tokens);
}

// ---------------------------------------------------------------------------
// Similaridade Jaccard
// ---------------------------------------------------------------------------

/**
 * Similaridade Jaccard entre dois conjuntos de tokens.
 * J(A, B) = |A ∩ B| / |A ∪ B|
 * Retorna 0–1. 1 = idênticos, 0 = nenhum token em comum.
 */
export function jaccardSimilarity(tokensA: Set<string>, tokensB: Set<string>): number {
  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return intersection / union;
}

/**
 * Calcula a similaridade Jaccard entre duas strings.
 * Conveniência sobre tokenize() + jaccardSimilarity().
 */
export function stringSimilarity(a: string, b: string): number {
  return jaccardSimilarity(tokenize(a), tokenize(b));
}

// ---------------------------------------------------------------------------
// Parsing de datas
// ---------------------------------------------------------------------------

/**
 * Tenta parsear uma data de múltiplos formatos comuns em planilhas.
 * Retorna undefined se não conseguir.
 */
export function parseDate(value: unknown): Date | undefined {
  if (value == null || value === '') return undefined;

  // exceljs retorna Date diretamente para células do tipo data
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }

  // Número: serial Excel (exceljs pode não converter todos os casos)
  if (typeof value === 'number') {
    if (value < 1 || value > 2958465) return undefined; // fora do range razoável
    const d = excelSerialToDate(value);
    return isNaN(d.getTime()) ? undefined : d;
  }

  if (typeof value !== 'string') return undefined;

  const str = value.trim();
  if (!str) return undefined;

  // ISO 8601: "2026-03-24"
  let parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  // DD/MM/YYYY ou DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    parsed = new Date(
      parseInt(dmyMatch[3]),
      parseInt(dmyMatch[2]) - 1,
      parseInt(dmyMatch[1]),
    );
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // MM/YYYY ou MM-YYYY (sem dia — assume dia 1)
  const myMatch = str.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (myMatch) {
    parsed = new Date(parseInt(myMatch[2]), parseInt(myMatch[1]) - 1, 1);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return undefined;
}

/** Converte serial Excel para Date (época: 1900-01-00) */
function excelSerialToDate(serial: number): Date {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  return new Date(excelEpoch.getTime() + serial * 86400000);
}

// ---------------------------------------------------------------------------
// Utilitários gerais
// ---------------------------------------------------------------------------

/** Converte um valor desconhecido para string, ou undefined se vazio */
export function toStringOrUndefined(value: unknown): string | undefined {
  if (value == null) return undefined;
  const str = String(value).trim();
  return str.length > 0 ? str : undefined;
}

/** Converte para número, ou undefined se inválido */
export function toNumberOrUndefined(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

/** Converte para boolean de forma permissiva (sim/yes/true/1 → true) */
export function toBooleanOrDefault(value: unknown, defaultValue: boolean): boolean {
  if (value == null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const str = String(value).toLowerCase().trim();
  if (['sim', 'yes', 'true', '1'].includes(str)) return true;
  if (['não', 'nao', 'no', 'false', '0'].includes(str)) return false;
  return defaultValue;
}

/** Trunca uma string para exibição em logs */
export function truncate(value: string, maxLength = 60): string {
  return value.length > maxLength ? value.slice(0, maxLength - 3) + '...' : value;
}
