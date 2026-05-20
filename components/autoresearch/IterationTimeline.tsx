"use client";

import { cn } from "@/lib/utils";
import { RoundStatusBadge, DecisionBadge } from "./StatusBadge";
import type { AutoresearchRound } from "@/types/autoresearch";

export default function IterationTimeline({ rounds }: { rounds: AutoresearchRound[] }) {
  if (!rounds.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-1">
        <p className="text-[13px] text-white/30">Nenhum round ainda</p>
        <p className="text-[11px] text-white/15">Inicie a campanha para comecar</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-[13px] top-4 bottom-4 w-px bg-white/[0.06]" />

      {[...rounds].reverse().map((round) => (
        <div key={round.id} className="relative pl-10 py-3.5">
          {/* Dot */}
          <div
            className={cn(
              "absolute left-[8px] top-[20px] w-[11px] h-[11px] rounded-full border-2",
              round.decision === "promoted"
                ? "bg-emerald-500 border-emerald-500/30"
                : round.decision === "kept"
                  ? "bg-amber-500 border-amber-500/30"
                  : "bg-white/15 border-white/[0.08]"
            )}
          />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[12px] font-mono font-semibold text-white/60">
                R{round.iteration_number}
              </span>
              <RoundStatusBadge status={round.status} />
              {round.decision && <DecisionBadge decision={round.decision} />}
            </div>
            {round.play_rate != null && (
              <span className="text-[14px] font-mono font-semibold text-white">
                {Number(round.play_rate).toFixed(2)}%
              </span>
            )}
          </div>

          {/* Decision reason */}
          {round.decision_reason && (
            <p
              className={cn(
                "text-[12px] leading-relaxed",
                round.decision === "promoted" ? "text-emerald-400/60" : "text-amber-400/60"
              )}
            >
              {round.decision_reason.split("|")[0].trim()}
            </p>
          )}

          {/* Measuring status */}
          {round.status === "measuring" && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-[11px] text-cyan-400/60">
                {round.sessions_collected} sessoes coletadas
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
