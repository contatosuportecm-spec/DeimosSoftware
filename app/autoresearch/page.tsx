"use client";

import { useState } from "react";
import { FlaskConical, Plus, TrendingUp, Zap, BarChart3 } from "lucide-react";
import LayoutApp from "@/app/layout-app";
import { useAutoresearch } from "@/hooks/useAutoresearch";
import { useOfferBriefings } from "@/hooks/useOfferBriefings";
import CampaignCard from "@/components/autoresearch/CampaignCard";
import CreateCampaignModal from "@/components/autoresearch/CreateCampaignModal";

export default function AutoresearchPage() {
  const { campaigns, loading, stats, createCampaign } = useAutoresearch();
  const { briefings } = useOfferBriefings();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <LayoutApp>
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical size={20} strokeWidth={1.5} className="text-nova" />
          <h1 className="text-[18px] font-semibold text-text-primary">AutoResearch</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-nova text-black hover:bg-nova/90 transition-colors"
        >
          <Plus size={12} strokeWidth={1.5} />
          Nova Campanha
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.07] bg-bg-3 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} strokeWidth={1.5} className="text-emerald-400" />
            <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Campanhas Ativas</p>
          </div>
          <p className="text-[22px] font-mono text-text-primary">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-bg-3 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={13} strokeWidth={1.5} className="text-amber-400" />
            <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Iteracoes Totais</p>
          </div>
          <p className="text-[22px] font-mono text-text-primary">{stats.totalIterations}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-bg-3 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={13} strokeWidth={1.5} className="text-nova" />
            <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Melhor Melhoria</p>
          </div>
          <p className="text-[22px] font-mono text-text-primary">
            {stats.bestImprovement > 0 ? `+${stats.bestImprovement.toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-nova/30 border-t-nova rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FlaskConical size={32} strokeWidth={1} className="text-text-muted/30 mb-3" />
          <p className="text-[13px] text-text-muted mb-1">Nenhuma campanha criada</p>
          <p className="text-[11px] text-text-muted/60">Crie sua primeira campanha para otimizar headlines automaticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showCreate && (
        <CreateCampaignModal
          briefings={briefings}
          onClose={() => setShowCreate(false)}
          onCreate={async (input) => {
            await createCampaign(input);
          }}
        />
      )}
    </div>
    </LayoutApp>
  );
}
