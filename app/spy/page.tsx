"use client";

import { useState } from "react";
import { Plus, RefreshCw, Eye } from "lucide-react";
import LayoutApp from "@/app/layout-app";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import AddOfferModal from "@/components/spy/AddOfferModal";
import OfferCard from "@/components/spy/OfferCard";
import KeywordsPanel from "@/components/spy/KeywordsPanel";
import { useSpy } from "@/hooks/useSpy";
import { OfferWithSnapshots } from "@/types";
import { cn } from "@/lib/utils";

// ═══ Filtros ═══

type FilterKey = "all" | "scaling" | "lateral" | "dying" | "new";

const FILTERS: { key: FilterKey; label: string; color?: string }[] = [
  { key: "all",     label: "Todas"    },
  { key: "scaling", label: "Em Alta",  color: "#34D399" },
  { key: "lateral", label: "Lateral",  color: "#D6C2A1" },
  { key: "dying",   label: "Morrendo", color: "#F87171" },
  { key: "new",     label: "Nova",     color: "#6B6B73" },
];

function applyFilter(offers: OfferWithSnapshots[], key: FilterKey): OfferWithSnapshots[] {
  switch (key) {
    case "scaling": return offers.filter((o) => o.status === "scaling");
    case "lateral": return offers.filter((o) => o.status === "stable" || o.status === "monitoring");
    case "dying":   return offers.filter((o) => o.status === "dying");
    case "new":     return offers.filter((o) => o.status === "new");
    default:        return offers;
  }
}

const STATUS_ORDER: Record<string, number> = {
  scaling: 0, monitoring: 1, stable: 2, new: 3, dying: 4, archived: 5,
};

function sortByStrength(a: OfferWithSnapshots, b: OfferWithSnapshots): number {
  // Primeiro por status group, depois por market_strength DESC dentro do grupo
  const statusDiff = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
  if (statusDiff !== 0) return statusDiff;
  return (b.market_strength ?? 0) - (a.market_strength ?? 0);
}

// ═══ Page ═══

export default function SpyPage() {
  const {
    offers,
    loading,
    error,
    scrapingId,
    addOffer,
    scrapeNow,
    archiveOffer,
    refetch,
  } = useSpy();

  const [modalOpen,    setModalOpen]    = useState(false);
  const [filter,       setFilter]       = useState<FilterKey>("all");
  const [showArchived, setShowArchived] = useState(false);

  const pool    = showArchived ? offers : offers.filter((o) => o.status !== "archived");
  const visible = [...applyFilter(pool, filter)].sort(sortByStrength);

  const countFor = (k: FilterKey) =>
    k === "all" ? pool.length : applyFilter(pool, k).length;

  return (
    <LayoutApp>
      <div className="flex flex-col h-full">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bg-3 border border-border flex items-center justify-center">
              <Eye size={14} strokeWidth={1.5} className="text-gold" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted leading-none mb-1">
                Monitoramento
              </p>
              <h1 className="text-sm font-semibold text-text-primary leading-none">
                Spy
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              className="p-2 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-3 transition-colors"
              title="Atualizar"
            >
              <RefreshCw size={13} strokeWidth={1.5} />
            </button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={13} strokeWidth={2} />
              Adicionar oferta
            </Button>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-border flex-shrink-0">
          {FILTERS.map((f) => {
            const count    = countFor(f.key);
            const isActive = filter === f.key;

            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                  isActive
                    ? "bg-bg-3 text-text-primary"
                    : "text-text-muted hover:text-text-secondary hover:bg-bg-3/40"
                )}
              >
                {f.color && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: f.color, opacity: isActive ? 1 : 0.5 }}
                  />
                )}
                {f.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "font-mono text-[10px] px-1.5 py-px rounded",
                      isActive
                        ? "bg-bg-4 text-text-secondary"
                        : "text-text-muted"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            {!showArchived ? (
              <button
                onClick={() => setShowArchived(true)}
                className="text-[10px] uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
              >
                Ver arquivadas
              </button>
            ) : (
              <button
                onClick={() => setShowArchived(false)}
                className="text-[10px] uppercase tracking-wider text-gold/70 hover:text-gold transition-colors"
              >
                Ocultar arquivadas
              </button>
            )}
          </div>
        </div>

        {/* ── Discovery Engine ── */}
        <div className="px-6 pt-4">
          <KeywordsPanel />
        </div>

        {/* ── Conteúdo ── */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
              <p className="text-xs text-danger">{error}</p>
            </div>
          ) : visible.length === 0 && filter !== "all" ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2">
              <p className="text-sm text-text-muted">Nenhuma oferta nessa categoria.</p>
              <button
                onClick={() => setFilter("all")}
                className="text-xs text-gold hover:text-gold-hover transition-colors"
              >
                Ver todas
              </button>
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title="Nenhuma oferta monitorada"
              description="Adicione o link da Meta Ads Library de uma oferta para começar a rastrear os anúncios ativos diariamente."
              action={{ label: "Adicionar primeira oferta", onClick: () => setModalOpen(true) }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onScrapeNow={scrapeNow}
                  onArchive={archiveOffer}
                  scraping={scrapingId === offer.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddOfferModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addOffer}
      />
    </LayoutApp>
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
