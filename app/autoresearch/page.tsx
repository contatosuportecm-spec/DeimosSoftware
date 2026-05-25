"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Plus, TrendingUp, Zap, BarChart3 } from "lucide-react";
import LayoutApp from "@/app/layout-app";
import { useAutoresearch } from "@/hooks/useAutoresearch";
import { useOfferBriefings } from "@/hooks/useOfferBriefings";
import CampaignCard from "@/components/autoresearch/CampaignCard";
import CreateCampaignModal from "@/components/autoresearch/CreateCampaignModal";

export default function AutoresearchPage() {
  const { campaigns, loading, stats, createCampaign, startCampaign, pauseCampaign, deleteCampaign } = useAutoresearch();
  const { briefings } = useOfferBriefings();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <LayoutApp>
      <div className="min-h-screen p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-nova/15 flex items-center justify-center">
              <FlaskConical size={20} strokeWidth={1.5} className="text-nova" />
            </div>
            <div>
              <h1 className="text-[20px] font-semibold text-white">AutoResearch</h1>
              <p className="text-[12px] text-white/30">Otimizacao de headlines por A/B test</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowCreate(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-nova text-black hover:bg-nova/90 transition-colors"
          >
            <Plus size={14} strokeWidth={2} />
            Nova Campanha
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Zap size={15} strokeWidth={1.5} className="text-emerald-400" />
              </div>
              <p className="text-[11px] text-white/35 uppercase tracking-widest">Campanhas Ativas</p>
            </div>
            <p className="text-[28px] font-mono font-semibold text-white">{stats.active}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <BarChart3 size={15} strokeWidth={1.5} className="text-amber-400" />
              </div>
              <p className="text-[11px] text-white/35 uppercase tracking-widest">Rounds Totais</p>
            </div>
            <p className="text-[28px] font-mono font-semibold text-white">{stats.totalRounds}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-nova/10 flex items-center justify-center">
                <TrendingUp size={15} strokeWidth={1.5} className="text-nova" />
              </div>
              <p className="text-[11px] text-white/35 uppercase tracking-widest">Melhor Melhoria</p>
            </div>
            <p className="text-[28px] font-mono font-semibold text-white">
              {stats.bestImprovement > 0 ? `+${stats.bestImprovement.toFixed(1)}%` : "--"}
            </p>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-nova/20 border-t-nova rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <FlaskConical size={28} strokeWidth={1} className="text-white/15" />
            </div>
            <p className="text-[15px] text-white/40 mb-1">Nenhuma campanha criada</p>
            <p className="text-[12px] text-white/20">
              Crie sua primeira campanha para otimizar headlines com A/B test
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} onStart={startCampaign} onPause={pauseCampaign} onDelete={deleteCampaign} />
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
