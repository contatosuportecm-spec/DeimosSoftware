"use client";

import type { AutoresearchRound } from "@/types/autoresearch";

interface PlayRateChartProps {
  iterations: AutoresearchRound[];
  baseline?: number | null;
}

export default function PlayRateChart({ iterations, baseline }: PlayRateChartProps) {
  const decided = iterations.filter((i) => i.status === "decided" && i.play_rate != null);
  if (decided.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-36 gap-1">
        <p className="text-[13px] text-white/30">Dados insuficientes</p>
        <p className="text-[11px] text-white/15">Precisa de 1+ round decidido</p>
      </div>
    );
  }

  const rates = decided.map((i) => Number(i.play_rate));
  const minRate = Math.min(...rates, Number(baseline ?? Infinity)) * 0.95;
  const maxRate = Math.max(...rates, Number(baseline ?? 0)) * 1.05;
  const range = maxRate - minRate || 1;

  const W = 480;
  const H = 160;
  const padX = 48;
  const padY = 20;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const points = decided.map((iter, i) => {
    const x = decided.length === 1 ? W / 2 : padX + (i / (decided.length - 1)) * chartW;
    const y = padY + chartH - ((Number(iter.play_rate) - minRate) / range) * chartH;
    return { x, y, rate: Number(iter.play_rate), decision: iter.decision, num: iter.iteration_number };
  });

  // Smooth curve
  const linePath = points.length === 1
    ? `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`
    : points.length === 2
    ? `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
    : points
        .map((p, i) => {
          if (i === 0) return `M ${p.x} ${p.y}`;
          const prev = points[i - 1];
          const cpx = (prev.x + p.x) / 2;
          return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
        })
        .join(" ");

  // Gradient area
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  const baselineY = baseline
    ? padY + chartH - ((Number(baseline) - minRate) / range) * chartH
    : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF8A1F" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FF8A1F" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = padY + chartH * (1 - pct);
        const val = minRate + range * pct;
        return (
          <g key={pct}>
            <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
            <text x={padX - 6} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize={9} fontFamily="monospace">
              {val.toFixed(1)}%
            </text>
          </g>
        );
      })}

      {/* Baseline */}
      {baselineY != null && (
        <>
          <line
            x1={padX} y1={baselineY} x2={W - padX} y2={baselineY}
            stroke="rgba(245,158,11,0.3)" strokeWidth={1} strokeDasharray="4 3"
          />
          <text x={W - padX + 4} y={baselineY + 3} fill="rgba(245,158,11,0.4)" fontSize={8} fontFamily="monospace">
            base
          </text>
        </>
      )}

      {/* Area fill */}
      <path d={areaPath} fill="url(#chartGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#FF8A1F" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {points.map((p) => (
        <g key={p.num}>
          {/* Glow */}
          <circle
            cx={p.x} cy={p.y} r={8}
            fill={p.decision === "promoted" ? "rgba(34,197,94,0.15)" : p.decision === "kept" ? "rgba(245,158,11,0.15)" : "rgba(255,138,31,0.15)"}
          />
          {/* Dot */}
          <circle
            cx={p.x} cy={p.y} r={4}
            fill={p.decision === "promoted" ? "#22c55e" : p.decision === "kept" ? "#f59e0b" : "#FF8A1F"}
            stroke="rgba(0,0,0,0.6)" strokeWidth={1.5}
          />
          {/* Label */}
          <text x={p.x} y={H - 3} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize={8} fontFamily="monospace">
            R{p.num}
          </text>
        </g>
      ))}
    </svg>
  );
}
