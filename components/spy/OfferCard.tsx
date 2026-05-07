"use client";

import { ExternalLink, RefreshCw, Archive, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import Sparkline from "./Sparkline";
import { OfferWithSnapshots, Niche } from "@/types";
import { calcDeltaPct } from "@/lib/spy-utils";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SCALING_PATTERN_LABELS } from "@/lib/constants";

// ═══ Status config ═══

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; borderLeft: string }
> = {
  scaling: {
    label: "Em Alta",
    color: "#34D399",
    bg: "rgba(52,211,153,0.06)",
    borderLeft: "#34D399",
  },
  dying: {
    label: "Morrendo",
    color: "#F87171",
    bg: "rgba(248,113,113,0.06)",
    borderLeft: "#F87171",
  },
  stable: {
    label: "Lateral",
    color: "#F4C430",
    bg: "rgba(244,196,48,0.06)",
    borderLeft: "#F4C430",
  },
  monitoring: {
    label: "Observando",
    color: "#5B8CFF",
    bg: "rgba(91,140,255,0.05)",
    borderLeft: "#5B8CFF",
  },
  new: {
    label: "Nova",
    color: "#6B6B73",
    bg: "transparent",
    borderLeft: "#35353A",
  },
  archived: {
    label: "Arquivada",
    color: "#6B6B73",
    bg: "transparent",
    borderLeft: "#2A2A2E",
  },
};

const COUNTRY_FLAGS: Record<string, string> = {
  BR: "\u{1F1E7}\u{1F1F7}",
  USA: "\u{1F1FA}\u{1F1F8}",
  Latam: "\u{1F30E}",
};

const DAY_LABELS = ["D-4", "D-3", "D-2", "D-1", "Hoje"];

// ═══ Helpers ═══

function strengthColor(score: number): string {
  if (score >= 70) return "#34D399";
  if (score >= 45) return "#F4C430";
  if (score >= 20) return "#A1A1AA";
  return "#6B6B73";
}

function strengthLabel(score: number): string {
  if (score >= 70) return "Forte";
  if (score >= 45) return "Moderado";
  if (score >= 20) return "Fraco";
  return "Sem sinal";
}

// ═══ Component ═══

interface OfferCardProps {
  offer: OfferWithSnapshots;
  niche?: Niche;
  onScrapeNow: (id: string) => void;
  onArchive: (id: string) => void;
  scraping?: boolean;
}

export default function OfferCard({
  offer,
  niche,
  onScrapeNow,
  onArchive,
  scraping,
}: OfferCardProps) {
  const cfg = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.new;
  // Status urgente domina (scaling/dying); status calmo deixa o nicho colorir a borda lateral.
  const showNicheBorder = niche && (offer.status === "new" || offer.status === "monitoring" || offer.status === "stable");
  const borderLeftColor = showNicheBorder ? niche!.color : cfg.borderLeft;
  const snaps = offer.snapshots;
  const counts = snaps.map((s) => s.active_ads_count);
  const isArchived = offer.status === "archived";
  const ms = offer.market_strength ?? 0;
  const msColor = strengthColor(ms);
  const pattern = SCALING_PATTERN_LABELS[offer.scaling_pattern ?? "unknown"];

  // Preenche 5 slots D-4 → Hoje
  const slots: (number | null)[] = [null, null, null, null, null];
  for (let i = 0; i < snaps.length; i++) {
    slots[5 - snaps.length + i] = snaps[i].active_ads_count;
  }

  const delta = calcDeltaPct(snaps);
  const deltaPos = delta.startsWith("+") && delta !== "+\u221E%";
  const deltaNeg = delta.startsWith("-");
  const todayCount = slots[4];

  return (
    <div
      className={cn(
        "relative rounded-lg border border-bg-4 flex flex-col",
        "transition-all duration-200",
        isArchived ? "opacity-40" : "hover:border-bg-5"
      )}
      style={{
        backgroundColor: cfg.bg,
        borderLeftColor: borderLeftColor,
        borderLeftWidth: "3px",
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-base leading-none mt-0.5">
            {COUNTRY_FLAGS[offer.country] ?? "\u{1F310}"}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary leading-snug truncate">
              {offer.name}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {niche && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded font-medium"
                  style={{
                    color: niche.color,
                    backgroundColor: `${niche.color}14`,
                    border: `1px solid ${niche.color}33`,
                  }}
                  title={`Nicho: ${niche.name}`}
                >
                  <span className="text-[10px] leading-none">{niche.emoji}</span>
                  <span className="capitalize">{niche.name}</span>
                </span>
              )}
              {offer.library_url && (
                <a
                  href={offer.library_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-gold transition-colors"
                >
                  Biblioteca
                  <ExternalLink size={9} strokeWidth={1.5} />
                </a>
              )}
              {offer.source === "auto_discovery" && offer.discovered_keyword && (
                <span className="text-[8px] uppercase tracking-[0.1em] px-1.5 py-px rounded bg-[#5B8CFF]/10 text-[#5B8CFF]">
                  via &quot;{offer.discovered_keyword}&quot;
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <span
          className="flex-shrink-0 text-[9px] uppercase tracking-[0.15em] font-medium px-2 py-0.5 rounded"
          style={{
            color: cfg.color,
            backgroundColor: `${cfg.color}18`,
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* ── Market Strength Bar ── */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Activity size={10} strokeWidth={1.5} style={{ color: msColor }} />
            <span className="text-[9px] uppercase tracking-[0.12em] text-text-muted">
              {strengthLabel(ms)}
            </span>
            {pattern && pattern.label && (
              <span
                className="text-[8px] uppercase tracking-[0.1em] px-1.5 py-px rounded"
                style={{ color: msColor, backgroundColor: `${msColor}15` }}
              >
                {pattern.label}
              </span>
            )}
          </div>
          <span className="font-mono text-xs font-semibold" style={{ color: msColor }}>
            {ms.toFixed(1)}
          </span>
        </div>
        <div className="w-full h-1 rounded-full bg-bg-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(ms, 100)}%`,
              backgroundColor: msColor,
            }}
          />
        </div>
        {/* Score components micro-bar */}
        <div className="flex items-center gap-2 mt-1.5">
          {[
            { label: "VOL", value: offer.volume_score ?? 0 },
            { label: "GRW", value: offer.growth_score ?? 0 },
            { label: "CST", value: offer.consistency_score ?? 0 },
            { label: "RCN", value: offer.recency_score ?? 0 },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-0.5 flex-1">
              <span className="text-[7px] uppercase tracking-wider text-text-muted w-5">
                {c.label}
              </span>
              <div className="flex-1 h-[2px] rounded-full bg-bg-4 overflow-hidden">
                <div
                  className="h-full rounded-full bg-text-muted/40"
                  style={{ width: `${Math.min(c.value, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sparkline ── */}
      <div className="px-4 pb-2">
        {counts.length >= 2 ? (
          <Sparkline
            data={counts}
            color={cfg.color}
            height={40}
            fullWidth
          />
        ) : (
          <div
            className="w-full flex items-center justify-center border border-dashed border-bg-4 rounded"
            style={{ height: 40 }}
          >
            <span className="text-[10px] text-text-muted">
              Aguardando dados...
            </span>
          </div>
        )}
      </div>

      {/* ── 5 dias ── */}
      <div className="grid grid-cols-5 px-4 pb-3 gap-1">
        {slots.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-[0.1em] text-text-muted">
              {DAY_LABELS[i]}
            </span>
            <span
              className={cn(
                "font-mono text-xs",
                i === 4
                  ? "text-text-primary font-semibold"
                  : val !== null
                  ? "text-text-secondary"
                  : "text-text-muted opacity-30"
              )}
            >
              {val !== null ? formatNumber(val) : "\u2014"}
            </span>
          </div>
        ))}
      </div>

      {/* ── Footer: delta + dias + ações ── */}
      <div
        className="flex items-center justify-between px-4 py-3 mt-auto"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        {/* Delta */}
        <div className="flex items-center gap-1.5">
          {deltaPos ? (
            <TrendingUp size={12} strokeWidth={1.5} style={{ color: "#34D399" }} />
          ) : deltaNeg ? (
            <TrendingDown size={12} strokeWidth={1.5} style={{ color: "#F87171" }} />
          ) : (
            <Minus size={12} strokeWidth={1.5} className="text-text-muted" />
          )}
          <span
            className="font-mono text-sm font-semibold"
            style={{
              color: deltaPos ? "#34D399" : deltaNeg ? "#F87171" : "#6B6B73",
            }}
          >
            {delta}
          </span>
          {todayCount !== null && (
            <span className="text-[10px] text-text-muted ml-0.5">
              · {formatNumber(todayCount)} ativos
            </span>
          )}
          {(offer.observation_days ?? 0) > 0 && (
            <span className="text-[10px] text-text-muted ml-1">
              · D{offer.observation_days}
            </span>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onScrapeNow(offer.id)}
            disabled={scraping || isArchived}
            className="text-text-muted hover:text-gold transition-colors disabled:opacity-30"
            title="Atualizar agora"
          >
            <RefreshCw
              size={12}
              strokeWidth={1.5}
              className={scraping ? "animate-spin" : ""}
            />
          </button>
          <button
            onClick={() => onArchive(offer.id)}
            disabled={isArchived}
            className="text-text-muted hover:text-danger transition-colors disabled:opacity-30"
            title="Arquivar"
          >
            <Archive size={12} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
