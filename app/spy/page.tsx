"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw, Eye } from "lucide-react";
import LayoutApp from "@/app/layout-app";
import Button from "@/components/ui/Button";
import AddOfferModal from "@/components/spy/AddOfferModal";
import SpyTabs, { SpyTab } from "@/components/spy/SpyTabs";
import OfertasTab from "@/components/spy/OfertasTab";
import EspionagemTab from "@/components/spy/EspionagemTab";
import { useSpy } from "@/hooks/useSpy";
import { useNiches } from "@/hooks/useNiches";

function isValidTab(v: string | null): v is SpyTab {
  return v === "ofertas" || v === "espionagem";
}

export default function SpyPage() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const tabParam      = searchParams.get("tab");
  const activeTab: SpyTab = isValidTab(tabParam) ? tabParam : "ofertas";

  const {
    offers, loading, error, scrapingId,
    addOffer, scrapeNow, archiveOffer, refetch,
  } = useSpy();
  const { niches } = useNiches();

  const [modalOpen, setModalOpen] = useState(false);

  const handleTabChange = useCallback((next: SpyTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/spy?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const visibleOffersCount = offers.filter((o) => o.status !== "archived").length;

  return (
    <LayoutApp>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bg-3 border border-border flex items-center justify-center">
              <Eye size={14} strokeWidth={1.5} className="text-amber" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted leading-none mb-1">
                Inteligência
              </p>
              <h1 className="text-sm font-semibold text-text-primary leading-none">
                Spy
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "ofertas" && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <SpyTabs
          active={activeTab}
          onChange={handleTabChange}
          ofertasCount={visibleOffersCount}
        />

        {/* Conteúdo da aba */}
        {activeTab === "ofertas" ? (
          <OfertasTab
            offers={offers}
            niches={niches}
            loading={loading}
            error={error}
            scrapingId={scrapingId}
            onScrapeNow={scrapeNow}
            onArchive={archiveOffer}
            onAddOffer={() => setModalOpen(true)}
          />
        ) : (
          <EspionagemTab />
        )}
      </div>

      <AddOfferModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addOffer}
      />
    </LayoutApp>
  );
}
