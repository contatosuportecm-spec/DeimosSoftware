"use client";

import { useRef, useState, useEffect } from "react";
import { TrendingDown, TrendingUp, Clock, ChevronDown, ArrowUpDown, X, Flame } from "lucide-react";
import { Niche, OfferTag } from "@/types";
import { cn } from "@/lib/utils";
import { TAG_META, TAG_ORDER } from "./tagMeta";

export type TagFilterKey = "all" | OfferTag;

export type ActiveSort =
  | { type: "default" }
  | { type: "niche"; niche: string }
  | { type: "ads_desc" }
  | { type: "time_desc" }
  | { type: "delta_desc" };

const TAG_CHIPS: { key: TagFilterKey; label: string; dot?: string }[] = [
  { key: "all", label: "Todas" },
  ...TAG_ORDER.map((t) => ({ key: t, label: TAG_META[t].label, dot: TAG_META[t].color })),
];

interface OffersFilterBarProps {
  tag: TagFilterKey;
  onTagChange: (k: TagFilterKey) => void;
  tagCount: (k: TagFilterKey) => number;

  sort: ActiveSort;
  onSortChange: (s: ActiveSort) => void;
  niches: Niche[];

  showArchived: boolean;
  onToggleArchived: () => void;
}

export default function OffersFilterBar({
  tag, onTagChange, tagCount,
  sort, onSortChange, niches,
  showArchived, onToggleArchived,
}: OffersFilterBarProps) {
  const [nicheOpen, setNicheOpen] = useState(false);
  const nicheRef = useRef<HTMLDivElement>(null);

  const activeNiche  = sort.type === "niche" ? sort.niche : null;
  const adsActive    = sort.type === "ads_desc";
  const timeActive   = sort.type === "time_desc";
  const deltaActive  = sort.type === "delta_desc";

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (nicheRef.current && !nicheRef.current.contains(e.target as Node)) {
        setNicheOpen(false);
      }
    }
    if (nicheOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [nicheOpen]);

  function handleNicheSelect(slug: string) {
    onSortChange(activeNiche === slug ? { type: "default" } : { type: "niche", niche: slug });
    setNicheOpen(false);
  }

  function handleSort(t: "ads_desc" | "time_desc" | "delta_desc") {
    onSortChange(sort.type === t ? { type: "default" } : { type: t });
  }

  const activeNicheObj = niches.find((n) => n.name === activeNiche);

  return (
    <div className="border-b border-border flex-shrink-0">

      {/* ── Linha 1: Tags ── */}
      <div className="flex items-center gap-1 px-6 py-3">
        {TAG_CHIPS.map((s) => {
          const count    = tagCount(s.key);
          const isActive = tag === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onTagChange(s.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 border",
                isActive
                  ? "bg-bg-3 text-text-primary border-border-strong"
                  : "border-transparent text-text-muted hover:text-text-secondary hover:bg-bg-3/40"
              )}
            >
              {s.dot && (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.dot, opacity: isActive ? 1 : 0.5 }}
                />
              )}
              {s.label}
              {count > 0 && (
                <span className="font-mono text-[10px] text-text-muted">{count}</span>
              )}
            </button>
          );
        })}

        <div className="ml-auto">
          <button
            onClick={onToggleArchived}
            className={cn(
              "text-[10px] uppercase tracking-[0.14em] transition-colors font-medium",
              showArchived
                ? "text-amber hover:text-amber-hover"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {showArchived ? "Ocultar arquivadas" : "Ver arquivadas"}
          </button>
        </div>
      </div>

      {/* ── Linha 2: Filtros únicos ── */}
      <div className="flex items-center gap-2 px-6 pb-3">

        {/* NICHO button com dropdown */}
        <div ref={nicheRef} className="relative">
          <button
            onClick={() => setNicheOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-[0.14em] transition-all border",
              activeNiche
                ? "text-text-primary"
                : nicheOpen
                ? "border-border-strong bg-bg-3 text-text-primary"
                : "border-border bg-bg-3 text-text-secondary hover:border-border-strong hover:text-text-primary"
            )}
            style={activeNiche && activeNicheObj ? {
              backgroundColor: `${activeNicheObj.color}1C`,
              borderColor: `${activeNicheObj.color}55`,
              color: activeNicheObj.color,
            } : undefined}
          >
            {activeNicheObj ? (
              <>
                <span className="text-base leading-none">{activeNicheObj.emoji}</span>
                <span className="capitalize">{activeNicheObj.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onSortChange({ type: "default" }); }}
                  className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X size={11} strokeWidth={2} />
                </button>
              </>
            ) : (
              <>
                Nicho
                <ChevronDown
                  size={12}
                  strokeWidth={2}
                  className={cn("transition-transform duration-150", nicheOpen && "rotate-180")}
                />
              </>
            )}
          </button>

          {/* Dropdown */}
          {nicheOpen && niches.length > 0 && (() => {
            const n = niches.length;
            const maxCols = n <= 4 ? n : n <= 6 ? 3 : 4;
            const CARD_W = 108;
            const GAP = 10;
            const PAD = 16;
            const dropdownWidth = maxCols * CARD_W + (maxCols - 1) * GAP + PAD * 2;
            return (
              <div
                className="absolute top-full left-0 mt-2 z-50 glass rounded-2xl border border-border-strong p-4 shadow-[0_24px_60px_rgba(0,0,0,0.7)]"
                style={{ width: `${dropdownWidth}px` }}
              >
                <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted mb-3 px-1 font-semibold">
                  Filtrar por nicho
                </p>
                <div
                  className="flex flex-wrap justify-center"
                  style={{ gap: `${GAP}px` }}
                >
                  {niches.map((nObj) => {
                    const isSelected = activeNiche === nObj.name;
                    return (
                      <button
                        key={nObj.id}
                        onClick={() => handleNicheSelect(nObj.name)}
                        className={cn(
                          "group relative flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-xl border transition-all duration-150 min-h-[104px] overflow-hidden",
                          isSelected ? "scale-[1.03]" : "border-border/40 bg-bg-4/40 hover:scale-[1.02]",
                        )}
                        style={{
                          width: `${CARD_W}px`,
                          ...(isSelected ? {
                            borderColor: `${nObj.color}66`,
                            backgroundColor: `${nObj.color}14`,
                            boxShadow: `0 0 20px ${nObj.color}24, inset 0 0 0 1px ${nObj.color}33`,
                          } : {}),
                        }}
                        onMouseEnter={(e) => {
                          if (isSelected) return;
                          e.currentTarget.style.borderColor = `${nObj.color}55`;
                          e.currentTarget.style.backgroundColor = `${nObj.color}0D`;
                          e.currentTarget.style.boxShadow = `0 0 14px ${nObj.color}1A`;
                        }}
                        onMouseLeave={(e) => {
                          if (isSelected) return;
                          e.currentTarget.style.borderColor = "";
                          e.currentTarget.style.backgroundColor = "";
                          e.currentTarget.style.boxShadow = "";
                        }}
                      >
                        <span
                          className="text-[28px] leading-none transition-transform duration-150 group-hover:scale-110"
                          style={isSelected ? { filter: `drop-shadow(0 0 8px ${nObj.color}99)` } : undefined}
                        >
                          {nObj.emoji}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-[0.12em] capitalize leading-[1.15] text-center line-clamp-2 px-0.5",
                            isSelected ? "" : "text-text-secondary group-hover:text-text-primary",
                          )}
                          style={isSelected ? { color: nObj.color } : undefined}
                        >
                          {nObj.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Divisor */}
        <span className="w-px h-5 bg-border" />

        {/* Ads Ativos ↓ */}
        <button
          onClick={() => handleSort("ads_desc")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
            adsActive
              ? "border-nova/50 bg-nova/10 text-nova"
              : "border-border bg-bg-3 text-text-secondary hover:border-border-strong hover:text-text-primary"
          )}
        >
          <TrendingUp size={12} strokeWidth={1.5} />
          Ads Ativos
          <ArrowUpDown size={10} strokeWidth={1.5} className="opacity-50" />
        </button>

        {/* Tempo ↓ */}
        <button
          onClick={() => handleSort("time_desc")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
            timeActive
              ? "border-amber/50 bg-amber/10 text-amber"
              : "border-border bg-bg-3 text-text-secondary hover:border-border-strong hover:text-text-primary"
          )}
        >
          <Clock size={12} strokeWidth={1.5} />
          Tempo
          <TrendingDown size={10} strokeWidth={1.5} className="opacity-50" />
        </button>

        {/* Variação ↑ */}
        <button
          onClick={() => handleSort("delta_desc")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
            deltaActive
              ? "border-[#34D399]/50 bg-[#34D399]/10 text-[#34D399]"
              : "border-border bg-bg-3 text-text-secondary hover:border-border-strong hover:text-text-primary"
          )}
        >
          <Flame size={12} strokeWidth={1.5} />
          Variação
          <TrendingUp size={10} strokeWidth={1.5} className="opacity-50" />
        </button>

      </div>
    </div>
  );
}
