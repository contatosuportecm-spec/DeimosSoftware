"use client";

import { Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import type { CampaignStatus, IterationStatus } from "@/types/autoresearch";

interface CampaignActionsProps {
  campaignId: string;
  campaignStatus: CampaignStatus;
  latestIterationStatus?: IterationStatus | null;
  onStart: (id: string) => Promise<void>;
  onPause: (id: string) => Promise<void>;
  onRevert: (id: string) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
}

export default function CampaignActions({
  campaignId,
  campaignStatus,
  latestIterationStatus,
  onStart,
  onPause,
  onRevert,
  onApprove,
}: CampaignActionsProps) {
  const btnClass =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-wrap gap-2">
      {campaignStatus !== "active" && (
        <button
          onClick={() => onStart(campaignId)}
          className={`${btnClass} border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
        >
          <Play size={12} strokeWidth={1.5} />
          Iniciar
        </button>
      )}

      {campaignStatus === "active" && (
        <button
          onClick={() => onPause(campaignId)}
          className={`${btnClass} border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20`}
        >
          <Pause size={12} strokeWidth={1.5} />
          Pausar
        </button>
      )}

      <button
        onClick={() => onRevert(campaignId)}
        className={`${btnClass} border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20`}
      >
        <RotateCcw size={12} strokeWidth={1.5} />
        Revert
      </button>

      {latestIterationStatus === "pending_approval" && (
        <button
          onClick={() => onApprove(campaignId)}
          className={`${btnClass} border-nova/30 bg-nova/10 text-nova hover:bg-nova/20`}
        >
          <CheckCircle size={12} strokeWidth={1.5} />
          Aprovar
        </button>
      )}
    </div>
  );
}
