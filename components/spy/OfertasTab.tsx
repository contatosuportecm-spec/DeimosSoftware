"use client";

import { useMemo, useState, useCallback } from "react";
import OfferCard from "./OfferCard";
import SpyHeroCard from "./SpyHeroCard";
import OffersFilterBar, { StatusFilterKey, ActiveSort } from "./OffersFilterBar";
import EmptyState from "@/components/ui/EmptyState";
import { OfferWithSnapshots, Niche } from "@/types";

function lastAdsCount(o: OfferWithSnapshots): number {
  return o.snapshots.length > 0 ? o.snapshots[o.snapshots.length - 1].active_ads_count : 0;
}

function deltaPct(o: OfferWithSnapshots): number {
  const s = o.snapshots;
  if (s.length < 2) return 0;
  const prev = s[s.length - 2].active_ads_count;
  const last = s[s.length - 1].active_ads_count;
  if (prev === 0) return last > 0 ? Infinity : 0;
  return ((last - prev) / prev) * 100;
}

function matchesStatus(o: OfferWithSnapshots, key: StatusFilterKey): boolean {
  if (key === "all") return true;
  if (key === "lateral") return o.status === "stable" || o.status === "monitoring";
  return o.status === key;
}

interface OfertasTabProps {
  offers: OfferWithSnapshots[];
  niches: Niche[];
  loading: boolean;
  error: string | null;
  scrapingId: string | null;
  onScrapeNow: (id: string) => void;
  onArchive: (id: string) => void;
  onManualValue: (id: string, value: number) => void;
  onAddOffer: () => void;
}

export default function OfertasTab({
  offers,
  niches,
  loading,
  error,
  scrapingId,
  onScrapeNow,
  onArchive,
  onManualValue,
  onAddOffer,
}: OfertasTabProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [sort, setSort] = useState<ActiveSort>({ type: "default" });
  const [showArchived, setShowArchived] = useState(false);

  const nicheById = useMemo(() => {
    const m = new Map<string, Niche>();
    niches.forEach((n) => m.set(n.name, n));
    return m;
  }, [niches]);

  const nonArchived = useMemo(() => offers.filter((o) => o.status !== "archived"), [offers]);
  const archived = useMemo(() => offers.filter((o) => o.status === "archived"), [offers]);

  const statusCount = useCallback((key: StatusFilterKey): number => {
    if (key === "all") return nonArchived.length;
    return nonArchived.filter((o) => matchesStatus(o, key)).length;
  }, [nonArchived]);

  const visible = useMemo(() => {
    let list = showArchived ? [...nonArchived, ...archived] : [...nonArchived];

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((o) => matchesStatus(o, statusFilter));
    }

    // Niche filter
    if (sort.type === "niche") {
      list = list.filter((o) => o.niche === sort.niche);
    }

    // Sort
    if (sort.type === "ads_desc") {
      list.sort((a, b) => lastAdsCount(b) - lastAdsCount(a));
    } else if (sort.type === "time_desc") {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort.type === "delta_desc") {
      list.sort((a, b) => deltaPct(b) - deltaPct(a));
    } else {
      list.sort((a, b) => lastAdsCount(b) - lastAdsCount(a));
    }

    return list;
  }, [offers, nonArchived, archived, statusFilter, sort, showArchived]);

  const topOffer = visible[0] ?? null;
  const gridOffers = topOffer ? visible.slice(1) : [];

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      <OffersFilterBar
        status={statusFilter}
        onStatusChange={setStatusFilter}
        statusCount={statusCount}
        sort={sort}
        onSortChange={setSort}
        niches={niches}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived((v) => !v)}
      />

      <div className="flex-1 overflow-auto px-6 py-5">
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
            <p className="text-xs text-danger">{error}</p>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title="Nenhuma oferta monitorada"
            description="Adicione o link da Meta Ads Library de uma oferta para comecar a rastrear os anuncios ativos diariamente."
            action={{ label: "Adicionar primeira oferta", onClick: onAddOffer }}
          />
        ) : (
          <div className="space-y-5">
            {topOffer && (
              <SpyHeroCard
                offer={topOffer}
                niche={nicheById.get(topOffer.niche)}
                onManualValue={onManualValue}
              />
            )}

            {gridOffers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {gridOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    niche={nicheById.get(offer.niche)}
                    onScrapeNow={onScrapeNow}
                    onArchive={onArchive}
                    onManualValue={onManualValue}
                    scraping={scrapingId === offer.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-5">
      <div className="h-36 rounded-lg bg-bg-3 border border-border animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-44 rounded-lg bg-bg-3 border border-border animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
