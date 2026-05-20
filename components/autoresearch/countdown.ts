/**
 * Countdown utility for AutoResearch round timers.
 * Shows how long until the next analysis/decision.
 */

export function getRemainingMs(
  deployStartedAt: string | null,
  iterationMinutes: number
): number {
  if (!deployStartedAt) return 0;
  const start = new Date(deployStartedAt).getTime();
  const end = start + iterationMinutes * 60 * 1000;
  return Math.max(0, end - Date.now());
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "Analisando...";

  const totalSec = Math.ceil(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}
