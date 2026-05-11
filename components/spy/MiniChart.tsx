"use client";

import { useId } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface MiniChartProps {
  data: DataPoint[];
  color?: string;
  className?: string;
  valueFontSize?: number;
  labelFontSize?: number;
  dotRadius?: number;
}

export default function MiniChart({
  data,
  color = "#F4C430",
  className,
  valueFontSize = 8.5,
  labelFontSize = 6.5,
  dotRadius = 3.5,
}: MiniChartProps) {
  const uid = useId();
  const gid = `mc${uid.replace(/:/g, "")}`;

  if (data.length < 2) return null;

  const W = 260;
  const H = 80;
  const padX = 28;
  const padTop = valueFontSize + 12;
  const padBot = labelFontSize + 10;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const range = max || 1;

  const chartW = W - padX * 2;
  const chartH = H - padTop - padBot;

  const pts = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padTop + (1 - d.value / range) * chartH,
    value: d.value,
    label: d.label,
  }));

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const area = [
    `M ${pts[0].x.toFixed(1)},${(padTop + chartH).toFixed(1)}`,
    ...pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`),
    `L ${pts[pts.length - 1].x.toFixed(1)},${(padTop + chartH).toFixed(1)}`,
    "Z",
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} style={{ width: W, height: H }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => {
        const isLast = i === pts.length - 1;
        return (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={dotRadius}
              fill="#0B0B0C"
              stroke={color}
              strokeWidth={1.5}
            />
            <text
              x={p.x}
              y={p.y - dotRadius - 5}
              textAnchor="middle"
              fill={isLast ? color : "#A1A1AA"}
              fontSize={valueFontSize}
              fontWeight={isLast ? 700 : 500}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {p.value}
            </text>
            <text
              x={p.x}
              y={H - 1}
              textAnchor="middle"
              fill="#6B6B73"
              fontSize={labelFontSize}
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="0.03em"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
