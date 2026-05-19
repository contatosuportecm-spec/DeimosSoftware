"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FlaskConical, Settings } from "lucide-react";
import Link from "next/link";
import LayoutApp from "@/app/layout-app";
import { useCampaignDetail } from "@/hooks/useAutoresearch";
import { CampaignStatusBadge } from "@/components/autoresearch/StatusBadge";
import CampaignActions from "@/components/autoresearch/CampaignActions";
import IterationTimeline from "@/components/autoresearch/IterationTimeline";
import PlayRateChart from "@/components/autoresearch/PlayRateChart";
import { COPYWRITERS } from "@/lib/copywriters";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { campaign, loading, refetch } = useCampaignDetail(id);

  const action = async (path: string) => {
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
        <p className="text-[13px] text-text-muted">Campanha nao encontrada</p>
        <Link href="/autoresearch" className="text-[11px] text-nova mt-2 hover:underline">
          Voltar
        </Link>
      </div>
      </LayoutApp>
    );
  }

  const c = campaign;
  const copywriter = COPYWRITERS.find((cw) => cw.id === c.copywriter_id);
  const latestIter = c.iterations[c.iterations.length - 1] ?? null;
  const baseline = Number(c.baseline_play_rate ?? 0);
  const best = Number(c.best_play_rate ?? 0);
  const delta = baseline > 0 ? ((best - baseline) / baseline) * 100 : 0;

  return (
    <LayoutApp>
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/autoresearch")} className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
            <ArrowLeft size={16} strokeWidth={1.5} className="text-text-muted" />
          </button>
          <FlaskConical size={18} strokeWidth={1.5} className="text-nova" />
          <h1 className="text-[16px] font-semibold text-text-primary">{c.name}</h1>
          <CampaignStatusBadge status={c.status} />
        </div>
      </div>

      {/* Actions */}
      <CampaignActions
        campaignId={c.id}
        campaignStatus={c.status}
        latestIterationStatus={latestIter?.status}
        onStart={() => action("start")}
        onPause={() => action("pause")}
        onRevert={() => action("revert")}
        onApprove={() => action("approve")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Config */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="rounded-xl border border-white/[0.07] bg-bg-3 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Settings size={13} strokeWidth={1.5} className="text-text-muted" />
              <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Metricas</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted mb-0.5">Baseline</p>
                <p className="text-[14px] font-mono text-text-primary">{baseline > 0 ? `${baseline.toFixed(2)}%` : "—"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted mb-0.5">Melhor</p>
                <p className="text-[14px] font-mono text-emerald-400">{best > 0 ? `${best.toFixed(2)}%` : "—"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted mb-0.5">Delta</p>
                <p className={`text-[14px] font-mono ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-text-muted"}`}>
                  {baseline > 0 ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted mb-0.5">Iteracoes</p>
                <p className="text-[14px] font-mono text-text-primary">{c.iteration_count}/{c.max_iterations}</p>
              </div>
            </div>
          </div>

          {/* Config */}
          <div className="rounded-xl border border-white/[0.07] bg-bg-3 p-4 space-y-2.5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted mb-2">Configuracao</p>

            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted/60">Elemento</p>
              <p className="text-[11px] text-text-secondary">{c.element_type}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted/60">Copywriter</p>
              <p className="text-[11px] text-text-secondary">{copywriter?.name ?? c.copywriter_id}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted/60">VTurb Video</p>
              <p className="text-[11px] text-text-secondary font-mono">{c.vturb_video_id}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted/60">Deploy</p>
              <p className="text-[11px] text-text-secondary font-mono">{c.deploy_repo}/{c.deploy_file_path}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted/60">Thresholds</p>
              <p className="text-[11px] text-text-secondary font-mono">
                {c.min_sessions} sessoes · {c.min_improvement_pct}% min · {c.iteration_hours}h
              </p>
            </div>
            {c.require_approval && (
              <p className="text-[10px] text-amber-400">Aprovacao manual ativada</p>
            )}
          </div>

          {/* Current Value */}
          {c.current_value && (
            <div className="rounded-xl border border-white/[0.07] bg-bg-3 p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted mb-2">Headline Atual</p>
              <p className="text-[13px] text-text-primary leading-relaxed">&ldquo;{c.current_value}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Right: Timeline + Chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Chart */}
          <div className="rounded-xl border border-white/[0.07] bg-bg-3 p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted mb-3">Play Rate Evolution</p>
            <PlayRateChart iterations={c.iterations} baseline={c.baseline_play_rate} />
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-white/[0.07] bg-bg-3 p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted mb-3">Timeline de Iteracoes</p>
            <IterationTimeline iterations={c.iterations} />
          </div>
        </div>
      </div>
    </div>
    </LayoutApp>
  );
}
