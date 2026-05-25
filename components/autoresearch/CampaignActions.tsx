"use client";

import { Play, Pause, CheckCircle } from "lucide-react";
import type { CampaignStatus, RoundStatus } from "@/types/autoresearch";

interface CampaignActionsProps {
  campaignId: string;
  campaignStatus: CampaignStatus;
  latestRoundStatus?: RoundStatus | null;
  onStart: (id: string) => Promise<void>;
  onPause: (id: string) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
}

export default function CampaignActions({
  campaignId,
  campaignStatus,
  latestRoundStatus,
  onStart,
  onPause,
  onApprove,
}: CampaignActionsProps) {
  const btnClass =
    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-wrap gap-2.5">
      {campaignStatus !== "active" && (
        <button
          onClick={() => onStart(campaignId)}
          className={`${btnClass} border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
        >
          <Play size={13} strokeWidth={1.5} />
          Iniciar
        </button>
      )}

      {campaignStatus === "active" && (
        <button
          onClick={() => onPause(campaignId)}
          className={`${btnClass} border-amber-500/25 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20`}
        >
          <Pause size={13} strokeWidth={1.5} />
          Pausar
        </button>
      )}

      {latestRoundStatus === "pending_approval" && (
        <button
          onClick={() => onApprove(campaignId)}
          className={`${btnClass} border-nova/25 bg-nova/10 text-nova hover:bg-nova/20`}
        >
          <CheckCircle size={13} strokeWidth={1.5} />
          Aprovar
        </button>
      )}
    </div>
  );
}
