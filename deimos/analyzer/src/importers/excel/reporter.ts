import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { logger } from '../../utils/logger';
import type {
  ImportReport,
  ClusterReportEntry,
  OfferCluster,
  ClusterAssignment,
  PersistBatchResult,
  ValidationResult,
  MergeCandidate,
} from '../../types/index';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface ReportInput {
  startedAt: Date;
  finishedAt: Date;
  sourceFile: string;
  worksheetName: string;
  dryRun: boolean;
  totalRowsRead: number;
  skippedEmpty: number;
  validationResults: ValidationResult[];
  assignments: ClusterAssignment[];
  clusters: OfferCluster[];
  persistResult: PersistBatchResult;
  mergeCandidates: MergeCandidate[];
}

// ---------------------------------------------------------------------------
// Construção do relatório
// ---------------------------------------------------------------------------

export function buildReport(input: ReportInput): ImportReport {
  const durationMs = input.finishedAt.getTime() - input.startedAt.getTime();

  // Clusters ordenados por score (maior primeiro)
  const sortedClusters = [...input.clusters].sort(
    (a, b) => b.market_strength_score - a.market_strength_score,
  );

  // Mapa de clusterId → nomes dos candidatos a merge
  const mergeCandidateMap = new Map<string, string[]>();
  for (const mc of input.mergeCandidates) {
    if (!mergeCandidateMap.has(mc.clusterA_id)) mergeCandidateMap.set(mc.clusterA_id, []);
    if (!mergeCandidateMap.has(mc.clusterB_id)) mergeCandidateMap.set(mc.clusterB_id, []);
    mergeCandidateMap.get(mc.clusterA_id)!.push(mc.clusterB_name);
    mergeCandidateMap.get(mc.clusterB_id)!.push(mc.clusterA_name);
  }

  const allClusters: ClusterReportEntry[] = sortedClusters.map((c, i) => ({
    rank:                   i + 1,
    canonical_name:         c.canonical_name,
    canonical_name_reason:  c.canonical_name_reason,
    is_generic_name:        c.is_generic_name,
    total_observations:     c.total_observations,
    distinct_players:       c.distinct_players,
    total_active_ads:       c.total_active_ads,
    first_seen_at:          c.first_seen_at?.toISOString(),
    last_seen_at:           c.last_seen_at?.toISOString(),
    active_days_span:       c.active_days_span,
    market_strength_score:  r2(c.market_strength_score),
    recency_score:          r2(c.recency_score        * 100),
    volume_score:           r2(c.volume_score         * 100),
    diversity_score:        r2(c.diversity_score      * 100),
    constancy_score:        r2(c.constancy_score      * 100),
    observations_score:     r2(c.observations_score   * 100),
    name_variants:          c.name_variants,
    merge_candidate_names:  mergeCandidateMap.get(c.clusterId) ?? [],
  }));

  const validationErrorDetails = input.validationResults
    .filter(r => !r.valid)
    .map(r => ({
      rowIndex: r.rowIndex,
      rawName:  r.errors[0]?.field === 'canonical_name' ? '(sem nome)' : '',
      errors:   r.errors.map(e => `${e.field}: ${e.message}`),
    }));

  const persistenceFailureDetails = input.persistResult.failed.map(f => ({
    rowIndex: f.observation.rowIndex,
    rawName:  f.observation.raw_name,
    error:    f.error,
  }));

  const newClusters = input.persistResult.succeededClusters.filter(c => c.wasInserted).length;
  const updClusters = input.persistResult.succeededClusters.filter(c => !c.wasInserted).length;
  const validObs    = input.totalRowsRead - validationErrorDetails.length;

  return {
    startedAt:             input.startedAt.toISOString(),
    finishedAt:            input.finishedAt.toISOString(),
    durationMs,
    sourceFile:            input.sourceFile,
    worksheetName:         input.worksheetName,
    dryRun:                input.dryRun,
    totalRowsRead:         input.totalRowsRead,
    skippedEmpty:          input.skippedEmpty,
    validationErrors:      validationErrorDetails.length,
    observationsProcessed: validObs,
    clustersIdentified:    input.clusters.length,
    observationsImported:  input.persistResult.succeededObservations.length,
    clustersCreated:       newClusters,
    clustersUpdated:       updClusters,
    persistenceFailed:     persistenceFailureDetails.length,
    topClusters:           allClusters.slice(0, 20),
    allClusters,
    validationErrorDetails,
    persistenceFailureDetails,
    mergeCandidates:       input.mergeCandidates,
  };
}

// ---------------------------------------------------------------------------
// Formatação em texto
// ---------------------------------------------------------------------------

export function formatReportText(report: ImportReport): string {
  const lines: string[] = [];
  const LINE = '═'.repeat(72);
  const line = '─'.repeat(72);
  const pad  = (label: string, value: string | number, w = 44): string =>
    `  ${label.padEnd(w)} ${value}`;

  // Cabeçalho
  lines.push(LINE);
  lines.push(
    '  RANKING DE INTELIGÊNCIA DE OFERTAS' +
    (report.dryRun ? ' [DRY RUN]' : ''),
  );
  lines.push(LINE);
  lines.push(pad('Arquivo fonte:', report.sourceFile));
  lines.push(pad('Aba:', report.worksheetName));
  lines.push(pad('Gerado em:', formatDate(report.startedAt)));
  lines.push(pad('Duração:', formatDuration(report.durationMs)));

  // Resumo
  lines.push('');
  lines.push(line);
  lines.push('  RESUMO');
  lines.push(line);
  lines.push(pad('Linhas lidas do Excel:',         report.totalRowsRead));
  lines.push(pad('Erros de validação (ignoradas):', report.validationErrors));
  lines.push(pad('Observações processadas:',        report.observationsProcessed));
  lines.push(pad('Ofertas simplificadas (clusters):',report.clustersIdentified));

  if (!report.dryRun) {
    lines.push('');
    lines.push(pad('Observações gravadas no banco:', report.observationsImported));
    lines.push(pad('Clusters novos:',               report.clustersCreated));
    lines.push(pad('Clusters atualizados:',          report.clustersUpdated));
    lines.push(pad('Falhas de persistência:',        report.persistenceFailed));
  } else {
    lines.push('');
    lines.push('  ⚠  DRY RUN — nenhuma alteração gravada no banco.');
  }

  // Ranking de clusters
  const clusters = report.allClusters;
  if (clusters.length > 0) {
    lines.push('');
    lines.push(line);
    lines.push('  RANKING — OFERTAS SIMPLIFICADAS POR FORÇA DE MERCADO');
    lines.push(line);
    lines.push(
      '  ' +
      '#'.padEnd(5) +
      'Oferta'.padEnd(36) +
      'Obs'.padStart(4) +
      'Players'.padStart(8) +
      'Ads'.padStart(6) +
      'Span'.padStart(6) +
      'Score'.padStart(7),
    );
    lines.push('  ' + '─'.repeat(72));

    const top = clusters.slice(0, 25);
    for (const c of top) {
      const flags =
        (c.is_generic_name           ? '[G]' : '   ') +
        (c.merge_candidate_names.length > 0 ? '[M]' : '   ');
      const rank = String(c.rank).padEnd(5);
      const name = trunc(c.canonical_name, 28).padEnd(28) + ' ' + flags;
      const obs  = String(c.total_observations).padStart(4);
      const plrs = String(c.distinct_players).padStart(8);
      const ads  = String(c.total_active_ads).padStart(6);
      const span = (c.active_days_span + 'd').padStart(6);
      const scr  = c.market_strength_score.toFixed(1).padStart(7);
      lines.push(`  ${rank}${name}${obs}${plrs}${ads}${span}${scr}`);
    }
    if (clusters.length > 25) {
      lines.push(`  ... +${clusters.length - 25} adicionais no relatório JSON`);
    }
    lines.push('  Flags: [G] nome genérico/curto  [M] candidato a merge com outro cluster');
  }

  // Detalhes de score — top 5
  if (clusters.length > 0) {
    lines.push('');
    lines.push(line);
    lines.push('  DETALHES DE SCORE — TOP 5');
    lines.push(line);

    for (const c of clusters.slice(0, 5)) {
      const lastSeen = c.last_seen_at ? formatDate(c.last_seen_at) : 'sem data';
      const genericFlag = c.is_generic_name ? '  ⚠ NOME GENÉRICO' : '';
      const mergeFlag   = c.merge_candidate_names.length > 0
        ? `  ⚠ MERGE? com: ${c.merge_candidate_names.slice(0, 2).map(n => `"${n}"`).join(', ')}`
        : '';
      lines.push(`  #${c.rank}  ${c.canonical_name}${genericFlag}${mergeFlag}`);
      lines.push(`       Nome canônico escolhido por: ${c.canonical_name_reason}`);
      lines.push(`       Diversidade  ${c.diversity_score.toFixed(1).padStart(5)}pts  (peso 30%) — ${c.distinct_players} player(s) distinto(s)`);
      lines.push(`       Constância   ${c.constancy_score.toFixed(1).padStart(5)}pts  (peso 30%) — ${c.active_days_span}d span`);
      lines.push(`       Recência     ${c.recency_score.toFixed(1).padStart(5)}pts  (peso 25%) — última vista: ${lastSeen}`);
      lines.push(`       Volume       ${c.volume_score.toFixed(1).padStart(5)}pts  (peso 15%) — ${c.total_active_ads} anúncios ativos acumulados`);
      lines.push(`       Score Final  ${c.market_strength_score.toFixed(1).padStart(5)}pts`);
      if (c.name_variants.length > 1) {
        const variants = c.name_variants.slice(0, 6).map(v => `"${v}"`).join(', ');
        const extra = c.name_variants.length > 6 ? ` +${c.name_variants.length - 6}` : '';
        lines.push(`       Variantes:   ${variants}${extra}`);
      }
      lines.push('');
    }
  }

  // Candidatos a merge
  if (report.mergeCandidates.length > 0) {
    lines.push('');
    lines.push(line);
    lines.push('  CLUSTERS CANDIDATOS A MERGE (subagrupamento detectado)');
    lines.push(line);
    lines.push('  Estes pares de clusters podem representar a mesma oferta.');
    lines.push('  Revise manualmente e considere unificá-los.');
    lines.push('');
    for (const mc of report.mergeCandidates.slice(0, 10)) {
      lines.push(`  sim=${mc.similarity.toFixed(2)}  "${mc.clusterA_name}"  ↔  "${mc.clusterB_name}"`);
      lines.push(`         motivo: ${mc.reason}`);
    }
    if (report.mergeCandidates.length > 10) {
      lines.push(`  ... +${report.mergeCandidates.length - 10} pares adicionais no relatório JSON`);
    }
  }

  // Erros de validação
  if (report.validationErrorDetails.length > 0) {
    lines.push(line);
    lines.push('  ERROS DE VALIDAÇÃO');
    lines.push(line);
    for (const d of report.validationErrorDetails) {
      lines.push(`  Linha ${String(d.rowIndex).padStart(4)}: ${d.errors.join(' | ')}`);
    }
  }

  // Falhas de persistência
  if (report.persistenceFailureDetails.length > 0) {
    lines.push('');
    lines.push(line);
    lines.push('  FALHAS DE PERSISTÊNCIA');
    lines.push(line);
    for (const f of report.persistenceFailureDetails) {
      lines.push(
        `  Linha ${String(f.rowIndex).padStart(4)} | "${trunc(f.rawName)}": ${f.error}`,
      );
    }
  }

  lines.push('');
  lines.push(LINE);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Salvamento em disco
// ---------------------------------------------------------------------------

export async function saveReport(
  report: ImportReport,
  outputDir: string,
): Promise<{ txtPath: string; jsonPath: string }> {
  await mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const baseName  = `import-report-${timestamp}`;
  const txtPath   = join(outputDir, `${baseName}.txt`);
  const jsonPath  = join(outputDir, `${baseName}.json`);

  await writeFile(txtPath,  formatReportText(report), 'utf8');
  await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  logger.info(`Relatório salvo em: ${txtPath}`);
  logger.info(`Relatório JSON em:  ${jsonPath}`);

  return { txtPath, jsonPath };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

function trunc(s: string, max = 45): string {
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
