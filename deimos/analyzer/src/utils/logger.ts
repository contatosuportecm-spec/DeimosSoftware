// =============================================================================
// Logger simples — sem dependências externas
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info:  ' INFO',
  warn:  ' WARN',
  error: 'ERROR',
};

export class Logger {
  private minLevel: number;
  private prefix: string;

  constructor(level: LogLevel = 'info', prefix = 'Import') {
    this.minLevel = LEVEL_RANK[level];
    this.prefix = prefix;
  }

  private format(level: LogLevel, message: string): string {
    const ts = new Date().toISOString();
    return `[${ts}] [${LEVEL_LABELS[level]}] [${this.prefix}] ${message}`;
  }

  private emit(level: LogLevel, message: string, data?: unknown): void {
    if (LEVEL_RANK[level] < this.minLevel) return;
    const line = this.format(level, message);
    const target = level === 'error' ? process.stderr : process.stdout;
    target.write(line + (data !== undefined ? ' ' + JSON.stringify(data) : '') + '\n');
  }

  debug(message: string, data?: unknown): void { this.emit('debug', message, data); }
  info(message: string, data?: unknown): void  { this.emit('info',  message, data); }
  warn(message: string, data?: unknown): void  { this.emit('warn',  message, data); }
  error(message: string, data?: unknown): void { this.emit('error', message, data); }

  /** Título de seção visível no console */
  section(title: string): void {
    const line = '─'.repeat(60);
    process.stdout.write(`\n${line}\n  ${title}\n${line}\n`);
  }
}

// Instância padrão — usada por todos os módulos sem necessidade de injeção
export const logger = new Logger('info');
