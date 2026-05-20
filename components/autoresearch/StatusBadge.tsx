"use client";

import { cn } from "@/lib/utils";
import type { CampaignStatus, RoundStatus, RoundDecision } from "@/types/autoresearch";

const CAMPAIGN_COLORS: Record<CampaignStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
};

const ROUND_COLORS: Record<RoundStatus, string> = {
  generating: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  pending_approval: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  deploying: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  measuring: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  decided: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
};

const DECISION_COLORS: Record<RoundDecision, string> = {
  promoted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  kept: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
};

const badgeClass =
  "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-[0.1em] font-semibold border";

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={cn(badgeClass, CAMPAIGN_COLORS[status])}>{status}</span>
  );
}

export function RoundStatusBadge({ status }: { status: RoundStatus }) {
  return (
    <span className={cn(badgeClass, ROUND_COLORS[status])}>
      {status.replace("_", " ")}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: RoundDecision }) {
  return (
    <span className={cn(badgeClass, DECISION_COLORS[decision])}>{decision}</span>
  );
}
