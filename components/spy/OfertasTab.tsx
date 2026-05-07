"use client";

import { useMemo, useState } from "react";
import OfferCard from "./OfferCard";
import EmptyState from "@/components/ui/EmptyState";
import OffersFilterBar, { StatusFilterKey, ActiveSort } from "./OffersFilterBar";
import { OfferWithSnapshots, Niche } from "@/types";
import { calcDeltaPct } from "@/lib/spy-utils";

interface OfertasTabProps {
  offers: OfferWithSnapshots[];
  niches: Niche[];
  loading: boolean;
  error: string | null;
  scrapingId: string | null;
  onScrapeNow: (id: string) => void;
  onArchive: (id: string) => void;
  onAddOffer: () => void;
}

const STATUS_ORDER: Record<string, number> = {
  scaling: 0, monitoring: 1, stable: 2, new: 3, dying: 4, archived: 5,
};

function defaultSort(a: OfferWithSnapshots, b: OfferWithSnapshots): number {
  const sd = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
  if (sd !== 0) return sd;
  return (b.market_strength ?? 0) - (a.market_strength ?? 0);
}

function lastAds(o: OfferWithSnapshots): number {
  return o.snapshots[o.snapshots.length - 1]?.active_ads_count ?? 0;
}

function parseDelta(o: OfferWithSnapshots): number {
  const d = calcDeltaPct(o.snapshots);
  if (d === "—" || d === "+∞%") return d === "+∞%" ? Infinity : 0;
  return parseFloat(d.replace("%", "").replace("+", ""));
}

export default function OfertasTab({
  offers, niches, loading, error, scrapingId,
  onScrapeNow, onArchive, onAddOffer,
}: OfertasTabProps) {
  const [status,       setStatus]       = useState<StatusFilterKey>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [sort,         setSort]         = useState<ActiveSort>({ type: "default" });

  const nicheById = useMemo(() => {
    const m = new Map<string, Niche>();
    niches.forEach((n) => m.set(n.name, n));
    return m;
  }, [niches]);

  const pool = showArchived ? offers : offers.filter((o) => o.status !== "archived");

  const visible = useMemo(() => {
    // 1. Filtro de status
    let list = pool.filter((o) => {
      switch (status) {
        case "scaling": return o.status === "scaling";
        case "lateral": return o.status === "stable" || o.status === "monitoring";
        case "dying":   return o.status === "dying";
        case "new":     return o.status === "new";
        default:        return true;
      }
    });

    // 2. Filtro / ordenação única
    if (sort.type === "niche") {
      list = list.filter((o) => o.niche === sort.niche);
      list = [...list].sort(defaultSort);
    } else if (sort.type === "ads_desc") {
      list = [...list].sort((a, b) => lastAds(b) - lastAds(a));
    } else if (sort.type === "time_desc") {
      list = [...list].sort((a, b) => (b.observation_days ?? 0) - (a.observation_days ?? 0));
    } else if (sort.type === "delta_desc") {
      list = [...list].sort((a, b) => parseDelta(b) - parseDelta(a));
    } else {
      list = [...list].sort(defaultSort);
    }

    return list;
  }, [pool, status, sort]);

  function statusCount(k: StatusFilterKey) {
    if (k === "all") return pool.length;
    return pool.filter((o) => {
      switch (k) {
        case "scaling": return o.status === "scaling";
        case "lateral": return o.status === "stable" || o.status === "monitoring";
        case "dying":   return o.status === "dying";
        case "new":     return o.status === "new";
        default:        return true;
      }
    }).length;
  }

  const isFiltered = sort.type !== "default" || status !== "all";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <OffersFilterBar
        status={status} onStatusChange={setStatus} statusCount={statusCount}
        sort={sort}     onSortChange={setSort}      niches={niches}
        showArchived={showArchived} onToggleArchived={() => setShowArchived((v) => !v)}
      />

      <div className="flex-1 overflow-auto px-6 py-5">
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
            <p className="text-xs text-danger">{error}</p>
          </div>
        ) : visible.length === 0 && isFiltered ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-sm text-text-muted">Nenhuma oferta com esses filtros.</p>
            <button
              onClick={() => { setStatus("all"); setSort({ type: "default" }); }}
              className="text-xs text-amber hover:text-amber-hover transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title="Nenhuma oferta monitorada"
            description="Adicione o link da Meta Ads Library de uma oferta para começar a rastrear os anúncios ativos diariamente."
            action={{ label: "Adicionar primeira oferta", onClick: onAddOffer }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                niche={nicheById.get(offer.niche)}
                onScrapeNow={onScrapeNow}
                onArchive={onArchive}
                scraping={scrapingId === offer.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-56 rounded-lg bg-bg-3 border border-border animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}
