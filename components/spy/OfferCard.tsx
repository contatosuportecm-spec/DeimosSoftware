"use client";

import { useState, useRef, useEffect } from "react";
import { ExternalLink, RefreshCw, Archive, Pencil, Library } from "lucide-react";
import Link from "next/link";
import MiniChart from "./MiniChart";
import { OfferWithSnapshots, Niche } from "@/types";
import { formatNumber, cn } from "@/lib/utils";
import { tierColor } from "@/lib/spy-utils";

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  scaling:    { color: "#34D399", label: "Ativo" },
  stable:     { color: "#F4C430", label: "Ativo" },
  monitoring: { color: "#34D399", label: "Ativo" },
  new:        { color: "#6B6B73", label: "Nova" },
  dying:      { color: "#F87171", label: "Morrendo" },
  archived:   { color: "#52525B", label: "Arquivada" },
};

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round(
    (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "HOJE";
  const day = d.getDate();
  const months = [
    "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
    "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
  ];
  return `${day} ${months[d.getMonth()]}`;
}

interface OfferCardProps {
  offer: OfferWithSnapshots;
  niche?: Niche;
  onScrapeNow: (id: string) => void;
  onArchive: (id: string) => void;
  onManualValue: (id: string, value: number) => void;
  scraping?: boolean;
}

export default function OfferCard({
  offer,
  niche,
  onScrapeNow,
  onArchive,
  onManualValue,
  scraping,
}: OfferCardProps) {
  const status = STATUS_DOT[offer.status] ?? STATUS_DOT.new;
  const isArchived = offer.status === "archived";
  const snaps = offer.snapshots;
  const todayCount = snaps.length > 0 ? snaps[snaps.length - 1].active_ads_count : 0;
  const yesterdayCount = snaps.length > 1 ? snaps[snaps.length - 2].active_ads_count : null;
  const deltaPct = yesterdayCount !== null && yesterdayCount > 0
    ? ((todayCount - yesterdayCount) / yesterdayCount) * 100
    : null;
  const color = tierColor(todayCount);

  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function startEdit() {
    if (isArchived) return;
    setInputVal(String(todayCount));
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    const num = parseInt(inputVal, 10);
    if (!isNaN(num) && num >= 0 && num !== todayCount) {
      onManualValue(offer.id, num);
    }
  }

  const chartData = snaps.map((s) => ({
    label: formatChartDate(s.date),
    value: s.active_ads_count,
  }));

  return (
    <div
      className={cn(
        "group rounded-2xl p-4 bg-bg-3 border border-transparent hover:border-[rgba(255,180,100,0.10)] transition-all",
        isArchived && "opacity-40"
      )}
    >
      {/* Header: icon + name + status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: niche ? `${niche.color}15` : `${color}12`,
              border: `1px solid ${niche ? `${niche.color}28` : `${color}20`}`,
            }}
          >
            <span className="text-sm leading-none">{niche?.emoji ?? "\uD83D\uDCE6"}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-text-primary truncate leading-snug">
              {offer.name}
            </p>
            <p className="text-[11px] text-[#9B9BA5] capitalize leading-none mt-0.5">
              {niche?.name ?? offer.niche}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className="w-[6px] h-[6px] rounded-full"
            style={{ backgroundColor: status.color }}
          />
          <span className="text-[10px] text-[#9B9BA5]">{status.label}</span>
        </div>
      </div>

      {/* Body: count + chart */}
      <div className="flex items-end gap-3">
        <div className="flex-shrink-0 min-w-[72px]">
          <p className="text-[9px] uppercase tracking-[0.15em] text-[#9B9BA5] mb-1.5">
            Anuncios hoje
          </p>
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              min={0}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-20 text-[28px] font-bold font-mono leading-none bg-transparent border-b-2 outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ color, borderColor: color }}
            />
          ) : (
            <button
              onClick={startEdit}
              className="group/edit flex items-center gap-1.5 cursor-text"
              title="Clique para editar"
            >
              <p
                className="text-[28px] font-bold font-mono leading-none"
                style={{ color }}
              >
                {todayCount > 0 ? formatNumber(todayCount) : "\u2014"}
              </p>
              <Pencil
                size={10}
                strokeWidth={1.5}
                className="text-[#9B9BA5] opacity-0 group-hover/edit:opacity-60 transition-opacity -mt-3"
              />
            </button>
          )}
          {yesterdayCount !== null && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-mono text-[#9B9BA5]">
                ontem {formatNumber(yesterdayCount)}
              </span>
              {deltaPct !== null && (
                <span
                  className="text-[10px] font-mono font-semibold"
                  style={{
                    color: deltaPct > 0 ? "#34D399" : deltaPct < 0 ? "#F87171" : "#6B6B73",
                  }}
                >
                  {deltaPct > 0 ? "+" : ""}{deltaPct.toFixed(0)}%
                </span>
              )}
              {deltaPct === null && yesterdayCount === 0 && todayCount > 0 && (
                <span className="text-[10px] font-mono font-semibold text-[#34D399]">NOVO</span>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-end justify-end">
          {chartData.length >= 2 ? (
            <MiniChart data={chartData} color={color} />
          ) : (
            <div className="h-[80px] w-full flex items-center justify-center border border-dashed border-bg-4 rounded text-[10px] text-[#9B9BA5]">
              Aguardando dados...
            </div>
          )}
        </div>
      </div>

      {/* Footer: library button + actions on hover */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.03]">
        <div className="flex items-center gap-2">
          <Link
            href="/biblioteca"
            className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-lg text-gold/70 hover:text-gold bg-gold/5 hover:bg-gold/10 border border-gold/10 hover:border-gold/20 transition-all"
          >
            <Library size={10} strokeWidth={1.5} />
            Biblioteca
          </Link>
          {offer.library_url && (
            <a
              href={offer.library_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
            >
              <ExternalLink size={10} strokeWidth={1.5} />
            </a>
          )}
        </div>

        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onScrapeNow(offer.id)}
            disabled={scraping || isArchived}
            className="text-[#9B9BA5] hover:text-amber transition-colors disabled:opacity-30"
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
            className="text-[#9B9BA5] hover:text-danger transition-colors disabled:opacity-30"
            title="Arquivar"
          >
            <Archive size={12} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
