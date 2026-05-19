"use client";

import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { CampaignStatusBadge } from "./StatusBadge";
import type { AutoresearchCampaign, AutoresearchIteration } from "@/types/autoresearch";

type CampaignWithLatest = AutoresearchCampaign & {
  latest_iteration: AutoresearchIteration | null;
};

export default function CampaignCard({ campaign }: { campaign: CampaignWithLatest }) {
  const c = campaign;
  const baseline = Number(c.baseline_play_rate ?? 0);
  const best = Number(c.best_play_rate ?? 0);
  const delta = baseline > 0 ? ((best - baseline) / baseline) * 100 : 0;
  const deltaStr = delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`;

  return (
    <Link
      href={`/autoresearch/${c.id}`}
      className="group block rounded-xl border border-white/[0.07] bg-bg-3 p-4 hover:border-white/[0.14] hover:bg-bg-3/80 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FlaskConical size={14} strokeWidth={1.5} className="text-nova" />
          <h3 className="text-[13px] font-semibold text-text-primary truncate max-w-[200px]">
            {c.name}
          </h3>
        </div>
        <CampaignStatusBadge status={c.status} />
      </div>

      {c.current_value && (
        <p className="text-[11px] text-text-secondary mb-3 line-clamp-2 leading-relaxed">
          &ldquo;{c.current_value}&rdquo;
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted mb-0.5">Play Rate</p>
            <p className="text-[13px] font-mono text-text-primary">
              {best > 0 ? `${best.toFixed(1)}%` : "—"}
            </p>
          </div>
          {baseline > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted mb-0.5">Delta</p>
              <p className={cn(
                "text-[13px] font-mono",
                delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-text-muted"
              )}>
                {deltaStr}
              </p>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted mb-0.5">Iteracao</p>
          <p className="text-[13px] font-mono text-text-primary">
            #{c.iteration_count}
          </p>
        </div>
      </div>

      {c.latest_iteration && (
        <div className="mt-3 pt-3 border-t border-white/[0.05]">
          <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted">
            {c.latest_iteration.status === "measuring"
              ? `Medindo · ${c.latest_iteration.sessions_collected} sessoes`
              : c.latest_iteration.status === "pending_approval"
              ? "Aguardando aprovacao"
              : c.latest_iteration.status}
          </p>
        </div>
      )}
    </Link>
  );
}
