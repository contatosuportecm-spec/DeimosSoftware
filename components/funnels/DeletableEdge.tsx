// @ts-nocheck — reactflow compat with @types/react 18.3
"use client";

import { memo, useState } from "react";
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from "reactflow";
import { X } from "lucide-react";

function DeletableEdgeComponent({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, style, label, data,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const color = data?.color as string | undefined;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const baseColor = color ?? "#6B7280";
  const normalOpacity = 0.5;
  const hoverOpacity = 0.85;

  // Compute arrowhead angle from last segment
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <>
      {/* Invisible wide path for easier hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={40}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {/* Glow path (behind) */}
      {hovered && (
        <path
          d={edgePath}
          fill="none"
          stroke={baseColor}
          strokeWidth={8}
          strokeLinecap="round"
          opacity={0.12}
          style={{ filter: "blur(4px)" }}
        />
      )}
      {/* Visible path */}
      <path
        d={edgePath}
        fill="none"
        stroke={baseColor}
        strokeWidth={hovered ? 4.5 : 3}
        strokeLinecap="round"
        opacity={hovered ? hoverOpacity : normalOpacity}
        strokeDasharray={hovered ? "8 4" : "none"}
        className={hovered ? "edge-flow-anim" : ""}
        style={{ transition: "stroke-width 200ms ease, opacity 200ms ease" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {/* Arrowhead at target */}
      <g transform={`translate(${targetX},${targetY}) rotate(${angle})`}>
        <polygon
          points="-8,-4 0,0 -8,4"
          fill={baseColor}
          opacity={hovered ? hoverOpacity : normalOpacity}
          style={{ transition: "opacity 200ms ease" }}
        />
      </g>
      {/* Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
              borderColor: `${baseColor}30`,
            }}
            className="text-[10px] text-[#a0a0b0] bg-[#0d0d12]/90 border px-2 py-0.5 rounded-md font-medium"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
      {/* Delete button */}
      {hovered && (
        <EdgeLabelRenderer>
          <button
            style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            className="w-5 h-5 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-lg hover:bg-red-400 transition-colors pointer-events-auto"
            onMouseEnter={() => setHovered(true)}
            onClick={() => data?.onDelete?.(id)}
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const DeletableEdge = memo(DeletableEdgeComponent);
