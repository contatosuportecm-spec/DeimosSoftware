"use client";

import { cn } from "@/lib/utils";
import { IterationStatusBadge, DecisionBadge } from "./StatusBadge";
import type { AutoresearchIteration } from "@/types/autoresearch";

export default function IterationTimeline({ iterations }: { iterations: AutoresearchIteration[] }) {
  if (!iterations.length) {
    return (
      <div className="flex items-center justify-center py-8 text-[11px] text-text-muted">
        Nenhuma iteracao ainda
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/[0.07]" />

      {[...iterations].reverse().map((iter) => (
        <div key={iter.id} className="relative pl-8 py-3">
          {/* Dot */}
          <div className={cn(
            "absolute left-[7px] top-[18px] w-[9px] h-[9px] rounded-full border-2",
            iter.decision === "keep"
              ? "bg-emerald-500 border-emerald-500/30"
              : iter.decision === "revert"
              ? "bg-red-500 border-red-500/30"
              : "bg-white/20 border-white/10"
          )} />

          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-muted">#{iter.iteration_number}</span>
              <IterationStatusBadge status={iter.status} />
              {iter.decision && <DecisionBadge decision={iter.decision} />}
            </div>
            {iter.play_rate != null && (
              <span className="text-[12px] font-mono text-text-primary">
                {Number(iter.play_rate).toFixed(2)}%
              </span>
            )}
          </div>

          {iter.variant_value && (
            <p className="text-[11px] text-text-secondary leading-relaxed mb-1">
              &ldquo;{iter.variant_value}&rdquo;
            </p>
          )}

          {iter.hypothesis && (
            <p className="text-[10px] text-text-muted italic leading-relaxed mb-1">
              {iter.hypothesis}
            </p>
          )}

          {iter.decision_reason && (
            <p className={cn(
              "text-[10px] leading-relaxed",
              iter.decision === "keep" ? "text-emerald-400/70" : "text-red-400/70"
            )}>
              {iter.decision_reason}
            </p>
          )}

          {iter.status === "measuring" && (
            <p className="text-[10px] text-cyan-400/70">
              {iter.sessions_collected} sessoes coletadas
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
