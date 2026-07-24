// =============================================================================
// Orquestrador do importador Excel — Modelo v2
//
// Fluxo:
//   1. Leitura do Excel
//   2. Mapeamento de colunas
//   3. Validação + normalização (cada linha → NormalizedObservation)
//   4. Clustering (agrupa observações em OfferClusters, sem descartar nada)
//   5. Persistência (dry-run ou real)
//   6. Relatório
// =============================================================================

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { Pool } from 'pg';

import { readExcelFile }                                        from './reader';
import { resolveColumnMapping, mapAllRows }                    from './mapper';
import { validateRow, normalizeRow }                           from './normalizer';
import { clusterObservations }                                 from './clusterer';
import { persistClustersAndObservations, createImportJob, finalizeImportJob } from './persister';
import { buildReport, saveReport, formatReportText }          from './reporter';
import { logger }                                              from '../../utils/logger';
import type {
  ImportOptions,
  ColumnMappingConfig,
  NormalizedObservation,
  ValidationResult,
  PersistBatchResult,
  ImportReport,
} from '../../types/index';

// ---------------------------------------------------------------------------
// Entrada pública
// ---------------------------------------------------------------------------

export async function runExcelImport(
  options: ImportOptions,
  pool: Pool,
): Promise<ImportReport> {
  const startedAt = new Date();
  logger.section('IMPORTADOR DE BASE HISTÓRICA — Excel → Observações + Clusters');
  logger.info(`Arquivo: ${options.filePath}`);
  logger.info(`Modo:     ${options.dryRun ? 'DRY RUN (sem escrita no banco)' : 'PRODUÇÃO'}`);
  logger.info(`Threshold de clustering: ${options.clusterThreshold}`);

  const mappingConfig = await loadMappingConfig();

  let jobId: number | null = null;
  if (!options.dryRun) {
    try {
      jobId = await createImportJob(options.filePath, pool);
      logger.info(`Job criado no banco: ID ${jobId}`);
    } catch {
      logger.warn('Não foi possível criar o job no banco — prosseguindo sem rastreamento.');
    }
  }

  // -------------------------------------------------------------------------
  // ETAPA 1: Leitura do Excel
  // -------------------------------------------------------------------------
  logger.section('Etapa 1 / 5 — Leitura do Excel');
  const sheetData = await readExcelFile(options.filePath, {
    worksheetIndex: options.worksheetIndex,
  });

  // -------------------------------------------------------------------------
  // ETAPA 2: Mapeamento de colunas
  // -------------------------------------------------------------------------
  logger.section('Etapa 2 / 5 — Mapeamento de colunas');
  const { resolved, unmappedHeaders } = resolveColumnMapping(
    sheetData.headers,
    mappingConfig,
  );
  const mappedOffers = mapAllRows(
    sheetData.rows,
    sheetData.headers,
    resolved,
    unmappedHeaders,
  );

  // -------------------------------------------------------------------------
  // ETAPA 3: Validação e normalização
  // -------------------------------------------------------------------------
  logger.section('Etapa 3 / 5 — Validação e normalização');

  const validationResults: ValidationResult[] = [];
  const observations: NormalizedObservation[] = [];

  for (const mapped of mappedOffers) {
    const validation = validateRow(mapped, mappingConfig);
    validationResults.push(validation);

    if (!validation.valid) {
      logger.warn(
        `Linha ${mapped.rowIndex}: ${validation.errors.length} erro(s) — linha ignorada`,
        { errors: validation.errors.map(e => `${e.field}: ${e.message}`) },
      );
      continue;
    }

    if (validation.warnings.length > 0) {
      logger.debug(
        `Linha ${mapped.rowIndex}: ${validation.warnings.length} aviso(s)`,
        { warnings: validation.warnings.map(w => `${w.field}: ${w.message}`) },
      );
    }

    observations.push(normalizeRow(mapped));
  }

  const invalidCount = validationResults.filter(r => !r.valid).length;
  logger.info(`Validação: ${observations.length} válidas, ${invalidCount} inválidas`);

  // -------------------------------------------------------------------------
  // ETAPA 4: Clustering
  // -------------------------------------------------------------------------
  logger.section('Etapa 4 / 5 — Clustering de Ofertas Simplificadas');
  const { assignments, clusters, mergeCandidates } = clusterObservations(observations, options);

  // -------------------------------------------------------------------------
  // ETAPA 5: Persistência
  // -------------------------------------------------------------------------
  logger.section('Etapa 5 / 5 — Persistência');

  let persistResult: PersistBatchResult = {
    succeededObservations: [],
    succeededClusters: [],
    failed: [],
  };

  if (options.dryRun) {
    logger.info('Dry run: persistência pulada — nenhum dado gravado no banco.');
  } else {
    persistResult = await persistClustersAndObservations(
      assignments,
      clusters,
      pool,
      options.batchSize,
    );
  }

  // -------------------------------------------------------------------------
  // Relatório
  // -------------------------------------------------------------------------
  logger.section('Relatório');
  const finishedAt = new Date();

  const report = buildReport({
    startedAt,
    finishedAt,
    sourceFile:       resolve(options.filePath),
    worksheetName:    sheetData.sheetName,
    dryRun:           options.dryRun,
    totalRowsRead:    sheetData.rows.length,
    skippedEmpty:     0,
    validationResults,
    assignments,
    clusters,
    persistResult,
    mergeCandidates,
  });

  process.stdout.write('\n' + formatReportText(report) + '\n');
  await saveReport(report, options.outputDir);

  if (!options.dryRun && jobId !== null) {
    try {
      await finalizeImportJob(
        jobId,
        {
          itemsTotal:     sheetData.rows.length,
          itemsProcessed: report.observationsImported,
          itemsFailed:    report.persistenceFailed + report.validationErrors,
          hasErrors:      report.persistenceFailed > 0 || report.validationErrors > 0,
          report,
        },
        pool,
      );
    } catch {
      logger.warn('Não foi possível atualizar o job no banco.');
    }
  }

  return report;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadMappingConfig(): Promise<ColumnMappingConfig> {
  const candidates = [
    resolve('config/column-mapping.json'),
    resolve('../../config/column-mapping.json'),
  ];

  for (const path of candidates) {
    try {
      const content = await readFile(path, 'utf8');
      return JSON.parse(content) as ColumnMappingConfig;
    } catch {
      // tenta o próximo
    }
  }

  throw new Error(
    'Arquivo config/column-mapping.json não encontrado. ' +
    'Certifique-se de executar o comando a partir da raiz do projeto.',
  );
}
