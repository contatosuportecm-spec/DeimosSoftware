"use client";

import { cn } from "@/lib/utils";
import type { CampaignStatus, IterationStatus, IterationDecision } from "@/types/autoresearch";

const CAMPAIGN_COLORS: Record<CampaignStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  paused: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
};

const ITERATION_COLORS: Record<IterationStatus, string> = {
  generating: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  pending_approval: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  deploying: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  measuring: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  decided: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
};

const DECISION_COLORS: Record<IterationDecision, string> = {
  keep: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  revert: "bg-red-500/15 text-red-400 border-red-500/30",
  skipped: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.12em] font-medium border", CAMPAIGN_COLORS[status])}>
      {status}
    </span>
  );
}

export function IterationStatusBadge({ status }: { status: IterationStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.12em] font-medium border", ITERATION_COLORS[status])}>
      {status.replace("_", " ")}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: IterationDecision }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.12em] font-medium border", DECISION_COLORS[decision])}>
      {decision}
    </span>
  );
}
