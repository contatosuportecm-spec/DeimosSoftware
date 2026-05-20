"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FlaskConical, ArrowUpRight, Play, Square, Trash2, Loader2, CheckCircle2, Clock } from "lucide-react";
import { CampaignStatusBadge } from "./StatusBadge";
import type { CampaignWithLatest } from "@/hooks/useAutoresearch";
import type { RoundStatus } from "@/types/autoresearch";
import { formatCountdown, getRemainingMs } from "./countdown";

interface CampaignCardProps {
  campaign: CampaignWithLatest;
  onStart?: (id: string) => Promise<void>;
  onPause?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const ROUND_LABELS: Record<RoundStatus, string> = {
  generating: "Gerando headlines",
  pending_approval: "Aguardando aprovacao",
  deploying: "Fazendo deploy",
  measuring: "Medindo resultados",
  decided: "Round decidido",
  error: "Erro no round",
};

const ACTIVE_STATUSES: RoundStatus[] = ["generating", "deploying", "measuring"];

/* ── Mini sparkline SVG ── */
function OptimizationSparkline({ campaign }: { campaign: CampaignWithLatest }) {
  const decided = (campaign.rounds ?? []).filter(
    (r) => r.status === "decided" && r.play_rate != null
  );
  if (decided.length < 2) return null;

  const rates = decided.map((r) => Number(r.play_rate));
  const baseVal = Number(campaign.baseline_play_rate ?? rates[0]);
  const allVals = [baseVal, ...rates];
  const min = Math.min(...allVals) * 0.95;
  const max = Math.max(...allVals) * 1.05;
  const range = max - min || 1;

  const W = 200;
  const H = 48;
  const padX = 4;
  const padY = 4;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const points = decided.map((r, i) => ({
    x: padX + (i / (decided.length - 1)) * chartW,
    y: padY + chartH - ((Number(r.play_rate) - min) / range) * chartH,
    promoted: r.decision === "promoted",
  }));

  const baselineY = padY + chartH - ((baseVal - min) / range) * chartH;

  const linePath =
    points.length === 2
      ? `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
      : points
          .map((p, i) => {
            if (i === 0) return `M ${p.x} ${p.y}`;
            const prev = points[i - 1];
            const cpx = (prev.x + p.x) / 2;
            return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
          })
          .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  return (
    <div className="mt-3 mb-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`spark-${campaign.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1={padX} y1={baselineY} x2={W - padX} y2={baselineY}
          stroke="rgba(245,158,11,0.25)" strokeWidth={0.8} strokeDasharray="3 2"
        />
        <path d={areaPath} fill={`url(#spark-${campaign.id})`} />
        <path d={linePath} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={2.5}
            fill={p.promoted ? "#22c55e" : "#f59e0b"}
            stroke="rgba(0,0,0,0.5)" strokeWidth={1}
          />
        ))}
      </svg>
    </div>
  );
}

export default function CampaignCard({ campaign, onStart, onPause, onDelete }: CampaignCardProps) {
  const c = campaign;
  const baseline = Number(c.baseline_play_rate ?? 0);
  const best = Number(c.best_play_rate ?? 0);
  const delta = baseline > 0 ? ((best - baseline) / baseline) * 100 : 0;

  const isNew = c.status === "paused" && c.iteration_count === 0;
  const isActive = c.status === "active";
  const isCompleted = c.status === "completed";
  const latestRound = c.latest_round;
  const roundStatus = latestRound?.status as RoundStatus | undefined;
  const isWorking = isActive && roundStatus && ACTIVE_STATUSES.includes(roundStatus);
  const isMeasuring = roundStatus === "measuring" && !c.simulate_mode;

  // Live countdown for measuring rounds
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!isMeasuring || !latestRound?.deploy_started_at) return;
    const tick = () => {
      const ms = getRemainingMs(latestRound.deploy_started_at, c.iteration_minutes);
      setCountdown(formatCountdown(ms));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isMeasuring, latestRound?.deploy_started_at, c.iteration_minutes]);

  return (
    <Link
      href={`/autoresearch/${c.id}`}
      className={`group block rounded-2xl border p-5 hover:bg-white/[0.04] transition-all duration-200 ${
        isNew
          ? "border-emerald-500/30 bg-emerald-500/[0.03] shadow-[0_0_20px_rgba(34,197,94,0.06)]"
          : isActive
            ? "border-nova/20 bg-white/[0.02]"
            : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isActive ? "bg-nova/15" : isNew ? "bg-emerald-500/15" : "bg-nova/15"
          }`}>
            <FlaskConical size={15} strokeWidth={1.5} className={isNew ? "text-emerald-400" : "text-nova"} />
          </div>
          <h3 className="text-[14px] font-semibold text-white truncate max-w-[200px]">
            {c.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <CampaignStatusBadge status={c.status} />
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(c.id);
              }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/15 transition-all"
            >
              <Trash2 size={13} strokeWidth={1.5} className="text-red-400/60" />
            </button>
          )}
        </div>
      </div>

      {/* Live status bar — active campaigns */}
      {isActive && latestRound && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] mb-3">
          {isWorking && (
            <Loader2 size={12} strokeWidth={2} className="text-nova animate-spin shrink-0" />
          )}
          <p className="text-[11px] text-white/50 truncate">
            {roundStatus ? ROUND_LABELS[roundStatus] : "Processando"}
            <span className="text-white/25"> · </span>
            <span className="font-mono text-white/40">R{latestRound.iteration_number}</span>
            {isMeasuring && countdown && (
              <>
                <span className="text-white/25"> · </span>
                <Clock size={9} strokeWidth={1.5} className="inline text-white/30 -mt-px" />
                <span className="font-mono text-amber-400/70 ml-0.5">{countdown}</span>
              </>
            )}
            {roundStatus === "measuring" && !c.simulate_mode && latestRound.sessions_collected > 0 && (
              <span className="text-white/25"> · {latestRound.sessions_collected} sess</span>
            )}
          </p>
          {c.max_rounds != null && (
            <span className="ml-auto text-[10px] font-mono text-white/25 shrink-0">
              {c.iteration_count}/{c.max_rounds}
            </span>
          )}
        </div>
      )}

      {/* Completed status */}
      {isCompleted && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/15 mb-3">
          <CheckCircle2 size={12} strokeWidth={1.5} className="text-emerald-400 shrink-0" />
          <p className="text-[11px] text-emerald-400/70">
            Completa · {c.iteration_count} rounds
            {best > 0 && baseline > 0 && delta > 0 && (
              <span className="font-mono"> · +{delta.toFixed(1)}%</span>
            )}
          </p>
        </div>
      )}

      {/* Headline */}
      {c.current_value && !isNew && (
        <div className="bg-white/[0.03] rounded-xl p-3 mb-3">
          <p className="text-[12px] text-white/60 line-clamp-2 leading-relaxed">
            &ldquo;{c.current_value}&rdquo;
          </p>
        </div>
      )}

      {/* Optimization sparkline */}
      <OptimizationSparkline campaign={c} />

      {/* Metrics — only show when we have data */}
      {(best > 0 || baseline > 0) && (
        <div className="flex items-end justify-between mb-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">Play Rate</p>
              <p className="text-[18px] font-mono font-semibold text-white">
                {best > 0 ? `${best.toFixed(1)}%` : "--"}
              </p>
            </div>
            {baseline > 0 && delta !== 0 && (
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">Delta</p>
                <p
                  className={`text-[18px] font-mono font-semibold ${
                    delta > 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">Rounds</p>
            <p className="text-[14px] font-mono text-white/60">
              {c.iteration_count}{c.max_rounds != null ? `/${c.max_rounds}` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* NEW campaign — prominent play button */}
          {isNew && onStart && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStart(c.id);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
            >
              <Play size={12} strokeWidth={1.5} className="text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-400">Iniciar</span>
            </button>
          )}
          {/* Paused (not new) — small play button */}
          {c.status === "paused" && !isNew && onStart && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStart(c.id);
              }}
              className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors"
            >
              <Play size={12} strokeWidth={1.5} className="text-emerald-400" />
            </button>
          )}
          {/* Active — stop button */}
          {isActive && onPause && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPause(c.id);
              }}
              className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 transition-colors"
            >
              <Square size={12} strokeWidth={1.5} className="text-amber-400" />
            </button>
          )}
          {/* Status text for non-new paused */}
          {c.status === "paused" && !isNew && (
            <p className="text-[11px] text-white/25">Pausada</p>
          )}
          {isNew && (
            <p className="text-[11px] text-emerald-400/60">Pronta para iniciar</p>
          )}
        </div>
        <ArrowUpRight size={14} strokeWidth={1.5} className="text-white/15 group-hover:text-nova transition-colors" />
      </div>
    </Link>
  );
}
