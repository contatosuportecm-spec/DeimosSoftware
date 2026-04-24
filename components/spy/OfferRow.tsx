"use client";

import { ExternalLink, RefreshCw, Archive, Activity } from "lucide-react";
import { Tr, Td } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Sparkline from "./Sparkline";
import { OfferWithSnapshots } from "@/types";
import { COUNTRY_LABELS } from "@/types";
import { calcDeltaPct } from "@/lib/meta";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

function strengthColor(score: number): string {
  if (score >= 70) return "#34D399";
  if (score >= 45) return "#D6C2A1";
  if (score >= 20) return "#A1A1AA";
  return "#6B6B73";
}

interface OfferRowProps {
  offer: OfferWithSnapshots;
  onScrapeNow: (id: string) => void;
  onArchive: (id: string) => void;
  scraping?: boolean;
}

export default function OfferRow({ offer, onScrapeNow, onArchive, scraping }: OfferRowProps) {
  const snaps = offer.snapshots;
  const counts = snaps.map((s) => s.active_ads_count);
  const ms = offer.market_strength ?? 0;
  const msColor = strengthColor(ms);

  // Preenche slots de D-4 a Hoje (sempre 5 colunas)
  const slots: (number | null)[] = [null, null, null, null, null];
  for (let i = 0; i < snaps.length; i++) {
    slots[5 - snaps.length + i] = snaps[i].active_ads_count;
  }

  const delta = calcDeltaPct(snaps);
  const deltaColor =
    delta.startsWith("+") && delta !== "+\u221E%"
      ? "text-success"
      : delta.startsWith("-")
      ? "text-danger"
      : "text-text-muted";

  return (
    <Tr className={offer.status === "archived" ? "opacity-40" : ""}>
      {/* Nome */}
      <Td className="font-medium text-text-primary">
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[160px]">{offer.name}</span>
          {offer.library_url && (
            <a
              href={offer.library_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-gold transition-colors flex-shrink-0"
            >
              <ExternalLink size={12} strokeWidth={1.5} />
            </a>
          )}
        </div>
      </Td>

      {/* Strength */}
      <Td>
        <div className="flex items-center gap-1.5">
          <Activity size={10} strokeWidth={1.5} style={{ color: msColor }} />
          <span className="font-mono text-xs font-semibold" style={{ color: msColor }}>
            {ms.toFixed(1)}
          </span>
        </div>
      </Td>

      {/* País */}
      <Td>
        <span className="text-[10px] font-mono text-text-muted">
          {COUNTRY_LABELS[offer.country as keyof typeof COUNTRY_LABELS] ?? offer.country}
        </span>
      </Td>

      {/* D-4 a Hoje (5 colunas) */}
      {slots.map((val, i) => (
        <Td key={i} className="font-mono text-xs text-center">
          {val !== null ? (
            <span className={i === 4 ? "text-text-primary font-medium" : "text-text-secondary"}>
              {formatNumber(val)}
            </span>
          ) : (
            <span className="text-text-muted opacity-30">{"\u2014"}</span>
          )}
        </Td>
      ))}

      {/* Delta */}
      <Td className={cn("font-mono text-xs text-center", deltaColor)}>
        {delta}
      </Td>

      {/* Sparkline */}
      <Td>
        {counts.length > 0 ? (
          <Sparkline data={counts} />
        ) : (
          <span className="text-text-muted text-xs">{"\u2014"}</span>
        )}
      </Td>

      {/* Status */}
      <Td>
        <Badge status={offer.status} />
      </Td>

      {/* Ações */}
      <Td>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onScrapeNow(offer.id)}
            disabled={scraping || offer.status === "archived"}
            className="text-text-muted hover:text-gold transition-colors disabled:opacity-30"
            title="Atualizar agora"
          >
            <RefreshCw size={13} strokeWidth={1.5} className={scraping ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => onArchive(offer.id)}
            disabled={offer.status === "archived"}
            className="text-text-muted hover:text-danger transition-colors disabled:opacity-30"
            title="Arquivar"
          >
            <Archive size={13} strokeWidth={1.5} />
          </button>
        </div>
      </Td>
    </Tr>
  );
}
