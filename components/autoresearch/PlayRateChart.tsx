"use client";

import type { AutoresearchIteration } from "@/types/autoresearch";

interface PlayRateChartProps {
  iterations: AutoresearchIteration[];
  baseline?: number | null;
}

export default function PlayRateChart({ iterations, baseline }: PlayRateChartProps) {
  const decided = iterations.filter((i) => i.status === "decided" && i.play_rate != null);
  if (decided.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-[11px] text-text-muted">
        Dados insuficientes para grafico
      </div>
    );
  }

  const rates = decided.map((i) => Number(i.play_rate));
  const minRate = Math.min(...rates, Number(baseline ?? Infinity)) * 0.95;
  const maxRate = Math.max(...rates, Number(baseline ?? 0)) * 1.05;
  const range = maxRate - minRate || 1;

  const W = 400;
  const H = 140;
  const padX = 40;
  const padY = 16;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const points = decided.map((iter, i) => {
    const x = padX + (i / (decided.length - 1)) * chartW;
    const y = padY + chartH - ((Number(iter.play_rate) - minRate) / range) * chartH;
    return { x, y, rate: Number(iter.play_rate), decision: iter.decision, num: iter.iteration_number };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const baselineY = baseline
    ? padY + chartH - ((Number(baseline) - minRate) / range) * chartH
    : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = padY + chartH * (1 - pct);
        const val = minRate + range * pct;
        return (
          <g key={pct}>
            <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
            <text x={padX - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={8} fontFamily="monospace">
              {val.toFixed(1)}%
            </text>
          </g>
        );
      })}

      {/* Baseline */}
      {baselineY != null && (
        <line
          x1={padX} y1={baselineY} x2={W - padX} y2={baselineY}
          stroke="rgba(244,196,48,0.4)" strokeWidth={1} strokeDasharray="4 3"
        />
      )}

      {/* Line */}
      <path d={linePath} fill="none" stroke="#FF8A1F" strokeWidth={1.5} strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p) => (
        <g key={p.num}>
          <circle
            cx={p.x} cy={p.y} r={3.5}
            fill={p.decision === "keep" ? "#22c55e" : p.decision === "revert" ? "#ef4444" : "#FF8A1F"}
            stroke="rgba(0,0,0,0.5)" strokeWidth={1}
          />
          <text x={p.x} y={H - 2} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={7} fontFamily="monospace">
            #{p.num}
          </text>
        </g>
      ))}
    </svg>
  );
}
