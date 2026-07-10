// =============================================================================
// MÓDULO DE INTELIGÊNCIA DE OFERTAS — Tipos centrais
// Modelo v2: Observações independentes + Clusters (Ofertas Simplificadas)
//
// Filosofia:
//   - Cada linha do Excel = uma observação de mercado (nunca descartada)
//   - Observações parecidas → agrupadas em clusters (oferta simplificada)
//   - A força do cluster reflete quantos players estão clonando aquela lógica
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (mantidos para compatibilidade e uso futuro no banco)
// ---------------------------------------------------------------------------

export type OfferStatus =
  | 'new'
  | 'observing'
  | 'promising'
  | 'strong_candidate'
  | 'saturated'
  | 'discarded'
  | 'validated';

export type OfferType =
  | 'lead_gen'
  | 'ecommerce'
  | 'info_product'
  | 'saas'
  | 'affiliate'
  | 'service'
  | 'other';

export type FunnelType =
  | 'vsl'
  | 'webinar'
  | 'quiz'
  | 'landing_page'
  | 'direct_sales'
  | 'free_trial'
  | 'book_funnel'
  | 'bridge_page'
  | 'other';

// ---------------------------------------------------------------------------
// Configuração do importador
// ---------------------------------------------------------------------------

export interface ColumnMappingConfig {
  mappings: Record<string, string[]>;
  enumAliases?: {
    offer_type?: Record<string, string>;
    funnel_type?: Record<string, string>;
    current_status?: Record<string, string>;
  };
}

export interface ImportOptions {
  filePath: string;
  dryRun: boolean;
  /** Jaccard >= threshold → mesma oferta simplificada (padrão: 0.5) */
  clusterThreshold: number;
  batchSize: number;
  worksheetIndex: number;
  outputDir: string;
}

// ---------------------------------------------------------------------------
// Pipeline: camadas de dados
// ---------------------------------------------------------------------------

/** Linha bruta do Excel — valores exatamente como lidos */
export type RawRow = Record<string, unknown>;

/** Campos mapeados de uma linha de observação (valores ainda brutos) */
export interface RawObservationFields {
  canonical_name: unknown;
  primary_domain: unknown;
  observed_at: unknown;
  active_ads_day1: unknown;
  active_ads_day2: unknown;
  active_ads_day3: unknown;
  active_ads_day4: unknown;
  active_ads_day5: unknown;
  active_ads_day6: unknown;
  checkout_type: unknown;
  offer_tested: unknown;
  roi_result: unknown;
  insights: unknown;
  notes: unknown;
}

/** Após o mapper: campos identificados, valores ainda brutos */
export interface MappedOffer {
  rowIndex: number;
  raw: RawRow;
  fields: Partial<RawObservationFields>;
  unmappedColumns: string[];
}

/** Observação normalizada — cada linha do Excel preservada como registro individual */
export interface NormalizedObservation {
  rowIndex: number;
  // Identidade
  raw_name: string;           // exatamente como estava no Excel
  normalized_name: string;    // lowercase, sem acentos (para clustering)
  // Atribuição / anunciante
  domain?: string;            // extraído de primary_domain (Link da oferta)
  // Temporal
  observed_at?: Date;         // "Data" da linha
  // Métricas diárias de criativos ativos
  active_ads_day1?: number;
  active_ads_day2?: number;
  active_ads_day3?: number;
  active_ads_day4?: number;
  active_ads_day5?: number;
  active_ads_day6?: number;
  /** Pico semanal: max dos dias disponíveis — indica intensidade de veiculação */
  total_active_ads: number;
  // Conteúdo
  checkout_type?: string;
  offer_tested?: boolean;
  roi_result?: string;
  insights?: string;
  notes?: string;
  // Snapshot original (preservado para auditoria)
  _raw: RawRow;
}

// ---------------------------------------------------------------------------
// Clustering — Ofertas Simplificadas
// ---------------------------------------------------------------------------

/**
 * Cluster de oferta simplificada.
 * Agrupa observações que compartilham o mesmo conceito de oferta
 * (mesma promessa, mesmo mecanismo, mesma lógica de mercado).
 */
export interface OfferCluster {
  clusterId: string;              // SHA-256 do normalized_name do primeiro seed
  canonical_name: string;         // nome representativo (melhor scoring semântico)
  canonical_name_score: number;   // score do nome canônico escolhido
  canonical_name_reason: string;  // motivo da escolha do nome canônico
  is_generic_name: boolean;       // true se o nome canônico for genérico/curto demais
  name_variants: string[];        // todos os nomes vistos neste cluster
  seed_tokens: Set<string>;       // tokens do seed original (imutável — para matching estável)
  token_set: Set<string>;         // union de tokens (cresce conforme novas observações chegam)
  // Observações vinculadas
  observations: NormalizedObservation[];
  // Agregados calculados
  total_observations: number;     // contagem total de observações
  distinct_players: number;       // domínios/anunciantes distintos
  total_active_ads: number;       // soma dos picos semanais de todas as observações
  first_seen_at?: Date;           // data mais antiga
  last_seen_at?: Date;            // data mais recente
  active_days_span: number;       // last - first em dias (constância temporal)
  // Componentes de score (0–1 internamente)
  recency_score: number;
  volume_score: number;
  diversity_score: number;
  constancy_score: number;
  observations_score: number;     // componente: volume de observações (sustentação)
  // Score final de força de mercado (0–100)
  market_strength_score: number;
}

/** Par de clusters candidatos a merge (subagrupamento detectado) */
export interface MergeCandidate {
  clusterA_id: string;
  clusterA_name: string;
  clusterB_id: string;
  clusterB_name: string;
  similarity: number;
  reason: string;
}

/** Resultado do clustering de uma observação individual */
export interface ClusterAssignment {
  observation: NormalizedObservation;
  cluster: OfferCluster;
  similarityScore: number;
  isNewCluster: boolean;
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  rowIndex: number;
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

// ---------------------------------------------------------------------------
// Persistência
// ---------------------------------------------------------------------------

export interface PersistedObservation {
  id: number;
  simplifiedOfferId: number;
}

export interface PersistedCluster {
  id: number;
  canonicalName: string;
  wasInserted: boolean;
}

export interface PersistBatchResult {
  succeededObservations: PersistedObservation[];
  succeededClusters: PersistedCluster[];
  failed: Array<{ observation: NormalizedObservation; error: string }>;
}

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

export interface ClusterReportEntry {
  rank: number;
  canonical_name: string;
  canonical_name_reason: string;
  is_generic_name: boolean;
  total_observations: number;
  distinct_players: number;
  total_active_ads: number;
  first_seen_at?: string;
  last_seen_at?: string;
  active_days_span: number;
  market_strength_score: number;
  recency_score: number;
  volume_score: number;
  diversity_score: number;
  constancy_score: number;
  observations_score: number;
  name_variants: string[];
  merge_candidate_names: string[];  // nomes dos clusters candidatos a merge com este
}

export interface ImportReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  sourceFile: string;
  worksheetName: string;
  dryRun: boolean;
  // Contagens
  totalRowsRead: number;
  skippedEmpty: number;
  validationErrors: number;
  observationsProcessed: number;
  clustersIdentified: number;
  observationsImported: number;
  clustersCreated: number;
  clustersUpdated: number;
  persistenceFailed: number;
  // Ranking completo e top clusters
  topClusters: ClusterReportEntry[];
  allClusters: ClusterReportEntry[];
  // Detalhes de erros
  validationErrorDetails: Array<{ rowIndex: number; rawName: string; errors: string[] }>;
  persistenceFailureDetails: Array<{ rowIndex: number; rawName: string; error: string }>;
  // Sugestões de merge entre clusters
  mergeCandidates: MergeCandidate[];
}
