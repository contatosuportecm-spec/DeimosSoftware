"use client";

import { useState, useRef, useEffect } from "react";
import MiniChart from "./MiniChart";
import { OfferWithSnapshots, Niche } from "@/types";
import { formatNumber } from "@/lib/utils";
import { tierColor } from "@/lib/spy-utils";
import { Crown, ExternalLink, Pencil } from "lucide-react";

interface SpyHeroCardProps {
  offer: OfferWithSnapshots;
  niche?: Niche;
  onManualValue: (id: string, value: number) => void;
}

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

export default function SpyHeroCard({ offer, niche, onManualValue }: SpyHeroCardProps) {
  const snaps = offer.snapshots;
  const todayCount = snaps.length > 0 ? snaps[snaps.length - 1].active_ads_count : 0;
  const yesterdayCount = snaps.length > 1 ? snaps[snaps.length - 2].active_ads_count : 0;
  const color = tierColor(todayCount);

  const deltaNum =
    yesterdayCount > 0
      ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
      : null;
  const isPositive = todayCount >= yesterdayCount;

  const chartData = snaps.map((s) => ({
    label: formatChartDate(s.date),
    value: s.active_ads_count,
  }));

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

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: `linear-gradient(135deg, ${color}06 0%, #0F0F11 60%)`,
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "border-color 0.25s ease, background 0.25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Left: Top offer info */}
        <div className="flex-shrink-0 lg:min-w-[200px]">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={12} strokeWidth={1.5} style={{ color }} />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#9B9BA5] font-medium">
              Maior volume hoje
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: niche ? `${niche.color}18` : `${color}15`,
                border: `1px solid ${niche ? `${niche.color}30` : `${color}25`}`,
              }}
            >
              <span className="text-base leading-none">{niche?.emoji ?? "\uD83D\uDCE6"}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-text-primary truncate leading-snug">
                {offer.name}
              </p>
              <p className="text-[11px] text-[#9B9BA5] capitalize leading-none mt-0.5">
                {niche?.name ?? offer.niche}
              </p>
            </div>
          </div>

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
              className="w-28 text-5xl font-bold font-mono leading-none bg-transparent border-b-2 outline-none mb-2 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ color, borderColor: color }}
            />
          ) : (
            <button
              onClick={startEdit}
              className="group/edit flex items-center gap-2 cursor-text mb-2"
              title="Clique para editar"
            >
              <p
                className="text-5xl font-bold font-mono leading-none"
                style={{ color }}
              >
                {formatNumber(todayCount)}
              </p>
              <Pencil
                size={12}
                strokeWidth={1.5}
                className="text-[#9B9BA5] opacity-0 group-hover/edit:opacity-60 transition-opacity -mt-4"
              />
            </button>
          )}

          <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B9BA5] mb-1">
            anuncios ativos
          </p>

          {deltaNum !== null && (
            <p
              className="text-xs font-medium flex items-center gap-1 mt-2"
              style={{ color: isPositive ? "#34D399" : "#F87171" }}
            >
              {isPositive ? "\u2191" : "\u2193"} {Math.abs(deltaNum)}% vs ontem
            </p>
          )}

          {offer.library_url && (
            <a
              href={offer.library_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] px-3 py-1.5 rounded-md mt-4 transition-colors"
              style={{
                color,
                backgroundColor: `${color}14`,
                border: `1px solid ${color}25`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${color}25`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${color}14`;
              }}
            >
              <ExternalLink size={11} strokeWidth={1.5} />
              Ver Biblioteca
            </a>
          )}
        </div>

        {/* Right: Chart */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B9BA5] font-medium mb-3">
            Variacao \u2014 Ultimos 5 Dias
          </p>
          {chartData.length >= 2 ? (
            <MiniChart
              data={chartData}
              color={color}
              valueFontSize={10}
              labelFontSize={7.5}
              dotRadius={4.5}
            />
          ) : (
            <div className="h-20 flex items-center justify-center border border-dashed border-bg-4 rounded">
              <span className="text-xs text-[#9B9BA5]">
                Aguardando dados...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
