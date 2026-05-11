"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import LayoutApp from "@/app/layout-app";
import Button from "@/components/ui/Button";
import AddOfferModal from "@/components/spy/AddOfferModal";
import SpyTabs, { SpyTab } from "@/components/spy/SpyTabs";
import OfertasTab from "@/components/spy/OfertasTab";
import EspionagemTab from "@/components/spy/EspionagemTab";
import ScrapeAllButton from "@/components/spy/ScrapeAllButton";
import { useSpy } from "@/hooks/useSpy";
import { useNiches } from "@/hooks/useNiches";

function isValidTab(v: string | null): v is SpyTab {
  return v === "ofertas" || v === "espionagem";
}

export default function SpyPage() {
  return (
    <Suspense fallback={null}>
      <SpyPageContent />
    </Suspense>
  );
}

function SpyPageContent() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const tabParam      = searchParams.get("tab");
  const activeTab: SpyTab = isValidTab(tabParam) ? tabParam : "ofertas";

  const {
    offers, loading, error, scrapingId,
    addOffer, scrapeNow, scrapeAll, scrapingAll,
    addManualSnapshot, archiveOffer, refetch,
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
          <div>
            <h1 className="text-lg font-semibold text-text-primary leading-snug">
              Ofertas Espionadas
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Monitore anúncios e descubra novas oportunidades todos os dias.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "ofertas" && (
              <>
                <ScrapeAllButton onDone={refetch} />
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Atualizado agora
                </span>
                <button
                  onClick={scrapeAll}
                  disabled={scrapingAll}
                  className="p-2 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-3 transition-colors disabled:opacity-50"
                  title="Atualizar todas as ofertas"
                >
                  <RefreshCw size={14} strokeWidth={1.5} className={scrapingAll ? "animate-spin" : ""} />
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
            onManualValue={addManualSnapshot}
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
