"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import LayoutApp from "@/app/layout-app";
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
        <div className="flex items-center justify-between px-8 pt-7 pb-6 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Ofertas Espionadas
            </h1>
            <p className="text-[13px] text-[#9B9BA5] mt-1">
              Monitore anuncios e descubra novas oportunidades todos os dias.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "ofertas" && (
              <>
                <ScrapeAllButton onDone={refetch} />
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#9B9BA5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Atualizado agora
                </span>
                <button
                  onClick={scrapeAll}
                  disabled={scrapingAll}
                  className="w-9 h-9 rounded-lg border border-white/[0.06] bg-[#111113] flex items-center justify-center text-[#6B6B76] hover:text-[#9B9BA5] hover:border-white/[0.12] transition-all disabled:opacity-50"
                  title="Atualizar todas as ofertas"
                >
                  <RefreshCw size={14} strokeWidth={1.5} className={scrapingAll ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold tracking-wide text-black bg-[#FF6B00] hover:bg-[#FF7A1A] active:scale-[0.96] transition-all duration-300 ease-out"
                  style={{ boxShadow: "0 0 18px rgba(255,107,0,0.35)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 32px rgba(255,107,0,0.55), 0 0 10px rgba(255,107,0,0.35)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 18px rgba(255,107,0,0.35)"; }}
                >
                  <Plus size={14} strokeWidth={2.5} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                  Adicionar oferta
                </button>
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

        {/* Conteudo da aba */}
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
