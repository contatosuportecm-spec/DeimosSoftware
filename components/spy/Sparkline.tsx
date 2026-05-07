"use client";

import { useId } from "react";

interface SparklineProps {
  data: number[];
  height?: number;
  color?: string;
  /** Se true, ocupa 100% da largura do container */
  fullWidth?: boolean;
  /** Ignorado quando fullWidth=true */
  width?: number;
}

const INTERNAL_WIDTH = 300;

export default function Sparkline({
  data,
  height = 24,
  color,
  fullWidth = false,
  width = 72,
}: SparklineProps) {
  const uid = useId();
  const gradientId = `sg${uid.replace(/:/g, "")}`;

  if (data.length === 0) return null;

  const trend = data[data.length - 1] - data[0];
  const lineColor =
    color ?? (trend > 0 ? "#34D399" : trend < 0 ? "#F87171" : "#F4C430");

  const W = fullWidth ? INTERNAL_WIDTH : width;

  if (data.length === 1) {
    return (
      <svg
        width={fullWidth ? "100%" : width}
        height={height}
        viewBox={fullWidth ? `0 0 ${W} ${height}` : undefined}
        preserveAspectRatio={fullWidth ? "none" : undefined}
      >
        <circle cx={W / 2} cy={height / 2} r={2.5} fill={lineColor} />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padV = 5;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: padV + (1 - (v - min) / range) * (height - padV * 2),
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = [
    `M 0,${height}`,
    ...points.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`),
    `L ${W},${height}`,
    "Z",
  ].join(" ");

  const last = points[points.length - 1];

  return (
    <svg
      width={fullWidth ? "100%" : width}
      height={height}
      viewBox={fullWidth ? `0 0 ${W} ${height}` : undefined}
      preserveAspectRatio={fullWidth ? "none" : undefined}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {!fullWidth && (
        <circle cx={last.x} cy={last.y} r={2.5} fill={lineColor} />
      )}
      {fullWidth && (
        <circle
          cx={(last.x / INTERNAL_WIDTH) * INTERNAL_WIDTH}
          cy={last.y}
          r={3}
          fill={lineColor}
        />
      )}
    </svg>
  );
}
