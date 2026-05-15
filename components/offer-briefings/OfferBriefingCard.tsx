"use client";

import { ArrowRight, TrendingUp, Circle, DollarSign } from "lucide-react";
import { OfferBriefing } from "@/types";
import { formatDate } from "@/lib/utils";

interface OfferBriefingCardProps {
  briefing: OfferBriefing;
  onView: (briefing: OfferBriefing) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; glow?: string }> = {
  draft:    { label: "Rascunho",  color: "#8B8B95", bg: "rgba(139,139,149,0.06)", border: "rgba(139,139,149,0.15)" },
  active:   { label: "Ativa",     color: "#4ADE80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.25)", glow: "0 0 8px rgba(74,222,128,0.15)" },
  paused:   { label: "Pausada",   color: "#FBBF24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)", glow: "0 0 8px rgba(251,191,36,0.12)" },
  archived: { label: "Arquivada", color: "#6B6B73", bg: "rgba(107,107,115,0.06)", border: "rgba(107,107,115,0.15)" },
};

const NICHE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; glow: string }> = {
  emagrecimento:              { icon: Circle, color: "#FF8A1F", bg: "rgba(255,138,31,0.12)", glow: "none" },
  "Emagrecimento":            { icon: Circle, color: "#FF8A1F", bg: "rgba(255,138,31,0.12)", glow: "none" },
  "saude-masculina":          { icon: Circle, color: "#34D399", bg: "rgba(52,211,153,0.12)", glow: "none" },
  "Saúde & Bem-estar":        { icon: Circle, color: "#34D399", bg: "rgba(52,211,153,0.12)", glow: "none" },
  "renda-extra":              { icon: Circle, color: "#F4C430", bg: "rgba(244,196,48,0.12)", glow: "none" },
  "Renda Extra":              { icon: Circle, color: "#F4C430", bg: "rgba(244,196,48,0.12)", glow: "none" },
  beleza:                     { icon: Circle, color: "#FF8A1F", bg: "rgba(255,138,31,0.12)", glow: "none" },
  "Beleza & Estética":        { icon: Circle, color: "#FF8A1F", bg: "rgba(255,138,31,0.12)", glow: "none" },
  relacionamento:             { icon: Circle, color: "#F4C430", bg: "rgba(244,196,48,0.12)", glow: "none" },
  "Desenvolvimento Pessoal":  { icon: Circle, color: "#34D399", bg: "rgba(52,211,153,0.12)", glow: "none" },
};

const DEFAULT_NICHE = { icon: Circle, color: "#FF8A1F", bg: "rgba(255,138,31,0.12)", glow: "none" };

export default function OfferBriefingCard({ briefing, onView }: OfferBriefingCardProps) {
  const status = STATUS_CONFIG[briefing.status] ?? STATUS_CONFIG.draft;
  const niche = NICHE_CONFIG[briefing.niche] ?? DEFAULT_NICHE;
  const NicheIcon = niche.icon;

  const sales = briefing.sales_count ?? 0;
  const ticket = Number(briefing.ticket || 0);

  return (
    <div
      className="group rounded-xl bg-[#0F0F11] cursor-pointer"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "border-color 0.25s ease, background 0.25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        e.currentTarget.style.background = "#121214";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        e.currentTarget.style.background = "#0F0F11";
      }}
      onClick={() => onView(briefing)}
    >
      <div className="p-5">
        {/* Row 1: Icon + Name/Niche + Status + Ticket */}
        <div className="flex items-start gap-3.5">
          {/* Niche icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border"
            style={{
              backgroundColor: niche.bg,
              borderColor: `${niche.color}22`,
              boxShadow: niche.glow,
            }}
          >
            <NicheIcon size={20} strokeWidth={1.8} style={{ color: niche.color, filter: `drop-shadow(0 0 4px ${niche.color}60)` }} />
          </div>

          {/* Name + niche */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h3 className="text-[16px] font-bold text-white leading-snug truncate">
                {briefing.offer_name}
              </h3>
              <span
                className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-[3px] rounded-full flex-shrink-0 border"
                style={{
                  color: status.color,
                  backgroundColor: status.bg,
                  borderColor: status.border,
                  boxShadow: status.glow,
                }}
              >
                <span
                  className="w-[5px] h-[5px] rounded-full"
                  style={{ backgroundColor: status.color, boxShadow: `0 0 6px ${status.color}` }}
                />
                {status.label}
              </span>
            </div>
            <p className="text-[13px] text-[#B0B0BA] mt-1">{briefing.niche}</p>
          </div>

          {/* Ticket */}
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98] font-semibold">Ticket</p>
            <p className="text-[20px] font-mono font-bold leading-tight mt-0.5"
              style={{ color: "#4ADE80", textShadow: "0 0 16px rgba(74,222,128,0.25)" }}
            >
              R$ {ticket.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>

        {/* Row 2: Promise */}
        {briefing.promise && (
          <p className="text-[13px] text-[#C0C0C8] leading-relaxed mt-3.5 line-clamp-2 pl-[56px]">
            {briefing.promise}
          </p>
        )}

        {/* Row 3: Metrics */}
        <div className="flex items-end justify-between mt-5 pl-[56px]">
          <div className="flex items-center gap-8">
            {/* Vendas */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98] font-semibold">Vendas</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[22px] font-mono font-bold text-white leading-none">
                  {sales.toLocaleString("pt-BR")}
                </span>
                {sales > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] font-mono font-semibold"
                    style={{ color: "#4ADE80", textShadow: "0 0 8px rgba(74,222,128,0.3)" }}
                  >
                    <TrendingUp size={10} strokeWidth={2.5} />
                    12%
                  </span>
                )}
              </div>
            </div>

            {/* Mini spark bars */}
            {sales > 0 && (
              <div className="flex items-end gap-[2px] h-6">
                {[3, 5, 4, 7, 5, 8, 6, 9, 7, 11, 8, 10].map((h, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full"
                    style={{
                      height: `${h * 2}px`,
                      background: "linear-gradient(to top, rgba(74,222,128,0.3), rgba(74,222,128,0.7))",
                      boxShadow: i >= 9 ? "0 0 4px rgba(74,222,128,0.4)" : undefined,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Conversao */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98] font-semibold">Conversao</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[15px] font-mono font-bold text-white leading-none">
                  {sales > 0 ? "2,45" : "—"}%
                </span>
                {sales > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] font-mono font-semibold"
                    style={{ color: "#4ADE80", textShadow: "0 0 8px rgba(74,222,128,0.3)" }}
                  >
                    <TrendingUp size={9} strokeWidth={2.5} />
                    4%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Footer */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/[0.05] pl-[56px]">
          <p className="text-[11px] text-[#8E8E98]">
            <span className="uppercase tracking-[0.1em] font-semibold">Criada em</span>
            <span className="ml-1.5 font-mono">{formatDate(briefing.created_at)}</span>
          </p>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#8E8E98] group-hover:text-[#FF6B00] transition-colors duration-200">
            Ver detalhes
            <ArrowRight size={13} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </span>
        </div>
      </div>
    </div>
  );
}
