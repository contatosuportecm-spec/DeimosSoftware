// =============================================================================
// CLI — Ponto de entrada do importador
// Uso: npx ts-node src/run-import.ts --file <path> [opções]
// =============================================================================

import 'dotenv/config';
import { resolve } from 'path';
import { existsSync } from 'fs';

import { runExcelImport } from './importers/excel/index';
import { getPool, closePool } from './db/client';
import { logger } from './utils/logger';
import type { ImportOptions } from './types/index';

// ---------------------------------------------------------------------------
// Parse de argumentos
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): ImportOptions & { help: boolean } {
  const args = argv.slice(2);
  const opts = {
    filePath:         '',
    dryRun:           false,
    clusterThreshold: 0.5,
    batchSize:        50,
    worksheetIndex:   0,
    outputDir:        resolve('reports'),
    help:             false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg  = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--file':
      case '-f':
        opts.filePath = next ?? '';
        i++;
        break;
      case '--dry-run':
      case '--dry':
        opts.dryRun = true;
        break;
      case '--cluster-threshold':
      case '--threshold':
        opts.clusterThreshold = parseFloat(next ?? '0.5');
        i++;
        break;
      case '--batch-size':
        opts.batchSize = parseInt(next ?? '50', 10);
        i++;
        break;
      case '--worksheet':
        opts.worksheetIndex = parseInt(next ?? '0', 10);
        i++;
        break;
      case '--output-dir':
        opts.outputDir = resolve(next ?? 'reports');
        i++;
        break;
      case '--debug':
        (logger as unknown as { minLevel: number }).minLevel = 0;
        break;
      case '--help':
      case '-h':
        opts.help = true;
        break;
      default:
        if (!arg.startsWith('-') && !opts.filePath) {
          opts.filePath = arg;
        } else if (arg.startsWith('-')) {
          logger.warn(`Argumento desconhecido ignorado: ${arg}`);
        }
    }
  }

  return opts;
}

function printHelp(): void {
  console.log(`
Uso:
  npx ts-node src/run-import.ts --file <caminho.xlsx> [opções]

Opções:
  --file,    -f         <caminho>   Caminho para o arquivo Excel (obrigatório)
  --dry-run, --dry                  Simula sem gravar no banco
  --cluster-threshold   <0-1>       Jaccard mínimo para agrupar no mesmo cluster (padrão: 0.5)
  --batch-size          <n>         Tamanho do batch de inserção (padrão: 50)
  --worksheet           <n>         Índice da aba a importar, 0-based (padrão: 0)
  --output-dir          <caminho>   Diretório para os relatórios (padrão: ./reports)
  --debug                           Ativa logs detalhados
  --help,    -h                     Exibe esta ajuda

Exemplos:
  npx ts-node src/run-import.ts --file data/ofertas.xlsx --dry-run
  npx ts-node src/run-import.ts --file data/ofertas.xlsx
  npx ts-node src/run-import.ts --file data/ofertas.xlsx --cluster-threshold 0.6 --debug

Variáveis de ambiente (.env):
  DATABASE_URL     postgresql://user:pass@host:5432/db  (prioridade)
  DB_HOST          localhost
  DB_PORT          5432
  DB_NAME          deimos
  DB_USER          postgres
  DB_PASSWORD      senha

Modelo de dados:
  Cada linha do Excel → offer_observation (preservada individualmente)
  Observações similares → simplified_offer (cluster)
  Score por cluster: recência (35%) + volume de ads (30%) + diversidade de players (20%) + constância (15%)
`);
}

// ---------------------------------------------------------------------------
// Validações iniciais
// ---------------------------------------------------------------------------

function validateOptions(opts: ImportOptions): string[] {
  const errors: string[] = [];

  if (!opts.filePath) {
    errors.push('Argumento --file é obrigatório.');
  } else if (!existsSync(opts.filePath)) {
    errors.push(`Arquivo não encontrado: ${opts.filePath}`);
  } else if (!/\.(xlsx|xls|xlsm)$/i.test(opts.filePath)) {
    errors.push(`Arquivo deve ser .xlsx, .xls ou .xlsm. Recebido: ${opts.filePath}`);
  }

  if (opts.clusterThreshold < 0.1 || opts.clusterThreshold > 1) {
    errors.push('--cluster-threshold deve estar entre 0.1 e 1.');
  }

  if (opts.batchSize < 1 || opts.batchSize > 500) {
    errors.push('--batch-size deve estar entre 1 e 500.');
  }

  if (opts.worksheetIndex < 0) {
    errors.push('--worksheet deve ser >= 0.');
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Execução principal
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const errors = validateOptions(opts);
  if (errors.length > 0) {
    for (const err of errors) logger.error(err);
    console.log('\nUse --help para ver as opções disponíveis.');
    process.exit(1);
  }

  const pool = getPool();

  if (!opts.dryRun) {
    try {
      await pool.query('SELECT 1');
      logger.info('Conexão com o banco estabelecida.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Não foi possível conectar ao banco: ${msg}`);
      logger.error('Verifique DATABASE_URL ou DB_HOST/DB_NAME/DB_USER/DB_PASSWORD.');
      process.exit(1);
    }
  }

  let exitCode = 0;

  try {
    const report = await runExcelImport(opts, pool);
    if (report.persistenceFailed > 0 || report.validationErrors > 0) {
      exitCode = 2;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Importação abortada: ${msg}`);
    if (process.env.DEBUG || process.argv.includes('--debug')) {
      console.error(err);
    }
    exitCode = 1;
  } finally {
    await closePool();
  }

  process.exit(exitCode);
}

main();
