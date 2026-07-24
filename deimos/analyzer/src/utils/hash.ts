import { createHash } from 'crypto';

/**
 * SHA-256 de uma string.
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Identificador de cluster baseado no nome normalizado.
 * Determinístico: mesmo nome normalizado → mesmo clusterId.
 */
export function computeClusterId(normalizedName: string): string {
  return sha256(normalizedName);
}
