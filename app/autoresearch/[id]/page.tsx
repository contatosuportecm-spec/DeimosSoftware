"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FlaskConical, Layers, Trophy, Clock, BarChart3, Loader2, Play, CheckCircle2 } from "lucide-react";
import { formatCountdown, getRemainingMs } from "@/components/autoresearch/countdown";
import Link from "next/link";
import LayoutApp from "@/app/layout-app";
import { useCampaignDetail } from "@/hooks/useAutoresearch";
import { CampaignStatusBadge } from "@/components/autoresearch/StatusBadge";
import CampaignActions from "@/components/autoresearch/CampaignActions";
import PlayRateChart from "@/components/autoresearch/PlayRateChart";
import OptimizationBoard from "@/components/autoresearch/OptimizationBoard";
import { COPYWRITERS } from "@/lib/copywriters";
import type { RoundStatus } from "@/types/autoresearch";

const ROUND_LABELS: Record<RoundStatus, string> = {
  generating: "Gerando headlines",
  pending_approval: "Aguardando aprovacao",
  deploying: "Fazendo deploy",
  measuring: "Medindo resultados",
  decided: "Round decidido",
  error: "Erro no round",
};

function formatTime(minutes: number): string {
  if (minutes >= 1440) return `${minutes / 1440} dias`;
  if (minutes >= 60) return `${minutes / 60} horas`;
  return `${minutes} min`;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { campaign, loading, refetch, advance } = useCampaignDetail(id);
  const [showSlots, setShowSlots] = useState(false);
  const [countdown, setCountdown] = useState("");

  const latestRound = campaign?.rounds[campaign.rounds.length - 1] ?? null;
  const isMeasuring = latestRound?.status === "measuring" && !campaign?.simulate_mode;

  useEffect(() => {
    if (!isMeasuring || !latestRound?.deploy_started_at || !campaign) {
      setCountdown("");
      return;
    }
    const tick = () => {
      const ms = getRemainingMs(latestRound.deploy_started_at, campaign.iteration_minutes);
      setCountdown(formatCountdown(ms));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isMeasuring, latestRound?.deploy_started_at, campaign?.iteration_minutes]);

  const [starting, setStarting] = useState(false);

  const action = async (path: string) => {
    if (path === "start") setStarting(true);
    await fetch(`/api/autoresearch/campaigns/${id}/${path}`, { method: "POST" });
    await refetch();
  };

  if (loading) {
    return (
      <LayoutApp>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-5 h-5 border-2 border-nova/30 border-t-nova rounded-full animate-spin" />
        </div>
      </LayoutApp>
    );
  }

  if (!campaign) {
    return (
      <LayoutApp>
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <p className="text-[14px] text-white/40">Campanha nao encontrada</p>
          <Link href="/autoresearch" className="text-[12px] text-nova mt-3 hover:underline">
            Voltar para campanhas
          </Link>
        </div>
      </LayoutApp>
    );
  }

  const c = campaign;
  const copywriter = COPYWRITERS.find((cw) => cw.id === c.copywriter_id);
  const baseline = Number(c.baseline_play_rate ?? 0);
  const best = Number(c.best_play_rate ?? 0);
  const delta = baseline > 0 ? ((best - baseline) / baseline) * 100 : 0;

  return (
    <LayoutApp>
      <div className="min-h-screen p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/autoresearch")}
              className="p-2 rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              <ArrowLeft size={18} strokeWidth={1.5} className="text-white/40" />
            </button>
            <FlaskConical size={20} strokeWidth={1.5} className="text-nova" />
            <div>
              <h1 className="text-[18px] font-semibold text-white">{c.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <CampaignStatusBadge status={c.status} />
                {c.simulate_mode && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.12em] font-medium border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    simulacao
                  </span>
                )}
              </div>
            </div>
          </div>
          <CampaignActions
            campaignId={c.id}
            campaignStatus={c.status}
            latestRoundStatus={latestRound?.status}
            onStart={() => action("start")}
            onPause={() => action("pause")}
            onApprove={() => action("approve")}
          />
        </div>

        {/* Live Status Bar */}
        {c.status === "paused" && c.iteration_count === 0 && (
          <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Play size={16} strokeWidth={1.5} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-emerald-400">Campanha pronta</p>
                <p className="text-[11px] text-white/30">Clique em Iniciar para comecar os testes A/B</p>
              </div>
            </div>
            <button
              onClick={() => action("start")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
            >
              <Play size={14} strokeWidth={1.5} />
              Iniciar Campanha
            </button>
          </div>
        )}

        {c.status === "active" && !latestRound && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-nova/20 bg-nova/[0.04]">
            <Loader2 size={16} strokeWidth={2} className="text-nova animate-spin shrink-0" />
            <p className="text-[13px] text-white/70">
              <span className="font-semibold text-nova">Iniciando campanha</span>
              <span className="text-white/25 mx-2">·</span>
              <span className="text-white/40">Gerando primeiro round...</span>
            </p>
          </div>
        )}

        {c.status === "active" && latestRound && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-nova/20 bg-nova/[0.04]">
            {["generating", "deploying", "measuring"].includes(latestRound.status) && (
              <Loader2 size={16} strokeWidth={2} className="text-nova animate-spin shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white/70">
                <span className="font-semibold text-nova">
                  {ROUND_LABELS[latestRound.status as RoundStatus] ?? latestRound.status}
                </span>
                <span className="text-white/25 mx-2">·</span>
                <span className="font-mono text-white/40">Round {latestRound.iteration_number}</span>
                {isMeasuring && countdown && (
                  <>
                    <span className="text-white/25 mx-2">·</span>
                    <Clock size={12} strokeWidth={1.5} className="inline text-white/30 -mt-px" />
                    <span className="font-mono text-amber-400/80 ml-1">{countdown}</span>
                  </>
                )}
                {latestRound.status === "measuring" && !c.simulate_mode && latestRound.sessions_collected > 0 && (
                  <>
                    <span className="text-white/25 mx-2">·</span>
                    <span className="font-mono text-white/40">{latestRound.sessions_collected} sessoes</span>
                  </>
                )}
              </p>
            </div>
            {c.max_rounds != null && (
              <span className="text-[12px] font-mono text-white/30 shrink-0">
                {c.iteration_count}/{c.max_rounds} rounds
              </span>
            )}
          </div>
        )}

        {c.status === "completed" && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04]">
            <CheckCircle2 size={16} strokeWidth={1.5} className="text-emerald-400 shrink-0" />
            <p className="text-[13px] text-emerald-400/80">
              <span className="font-semibold">Campanha completa</span>
              <span className="text-white/25 mx-2">·</span>
              <span className="font-mono">{c.iteration_count} rounds</span>
              {best > 0 && baseline > 0 && delta > 0 && (
                <>
                  <span className="text-white/25 mx-2">·</span>
                  <span className="font-mono">+{delta.toFixed(1)}% melhoria</span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">Baseline</p>
            <p className="text-[24px] font-mono font-semibold text-white">
              {baseline > 0 ? `${baseline.toFixed(2)}%` : "--"}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
            <p className="text-[11px] text-emerald-400/50 uppercase tracking-widest mb-2">Melhor</p>
            <p className="text-[24px] font-mono font-semibold text-emerald-400">
              {best > 0 ? `${best.toFixed(2)}%` : "--"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">Delta</p>
            <p
              className={`text-[24px] font-mono font-semibold ${
                delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-white/30"
              }`}
            >
              {baseline > 0 ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%` : "--"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">Rounds</p>
            <p className="text-[24px] font-mono font-semibold text-white">
              {c.iteration_count}{c.max_rounds != null ? <span className="text-[14px] text-white/25">/{c.max_rounds}</span> : ""}
            </p>
          </div>
        </div>

        {/* Winner Headline */}
        {c.current_value && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Trophy size={16} strokeWidth={1.5} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-emerald-400">Headline Vencedora</p>
                <p className="text-[11px] text-white/30">Melhor performance ate agora</p>
              </div>
            </div>
            <p className="text-[16px] text-white leading-relaxed">
              &ldquo;{c.current_value}&rdquo;
            </p>
          </div>
        )}

        {/* Board */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} strokeWidth={1.5} className="text-white/30" />
            <p className="text-[14px] font-medium text-white">Optimization Board</p>
          </div>
          <OptimizationBoard
            rounds={c.rounds}
            baseline={c.baseline_play_rate}
            currentValue={c.current_value}
            slotCount={c.slot_count}
          />
        </div>

        {/* Chart + Config */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-[12px] text-white/40 uppercase tracking-widest mb-4">
              Play Rate por Round
            </p>
            <PlayRateChart iterations={c.rounds} baseline={c.baseline_play_rate} />
          </div>

          {/* Config */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
            <p className="text-[12px] text-white/40 uppercase tracking-widest">Configuracao</p>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Elemento</p>
                <p className="text-[13px] text-white/80 capitalize">{c.element_type}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Copywriter</p>
                <p className="text-[13px] text-white/80">{copywriter?.name ?? c.copywriter_id}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Slots</p>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] text-white/80 font-mono">{c.slot_count} videos</p>
                  <button
                    onClick={() => setShowSlots(!showSlots)}
                    className="text-[10px] text-nova hover:underline"
                  >
                    {showSlots ? "ocultar" : "ver IDs"}
                  </button>
                </div>
                {showSlots && c.slots && (
                  <div className="mt-2 space-y-1.5">
                    {c.slots.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Layers size={10} strokeWidth={1.5} className="text-white/20" />
                        <span className="text-[11px] font-mono text-white/50">
                          {s.label}: {s.video_id}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!c.simulate_mode && (
                <div>
                  <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Deploy</p>
                  <p className="text-[12px] text-white/60 font-mono break-all">
                    {c.deploy_repo}/{c.deploy_file_path}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">
                  Tempo por Round
                </p>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} strokeWidth={1.5} className="text-white/30" />
                  <p className="text-[13px] text-white/80">
                    {formatTime(c.iteration_minutes)}
                    {c.min_sessions != null ? ` · min ${c.min_sessions} sessoes/slot` : ""}
                  </p>
                </div>
              </div>
              {c.require_approval && (
                <p className="text-[11px] text-amber-400/80">Aprovacao manual ativada</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutApp>
  );
}
