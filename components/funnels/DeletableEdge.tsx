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

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      {/* Invisible wide path for easier hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {/* Visible path */}
      <path
        d={edgePath}
        fill="none"
        stroke={hovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"}
        strokeWidth={hovered ? 3.5 : 2.5}
        style={{ transition: "stroke 150ms, stroke-width 150ms" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {/* Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: "none" }}
            className="text-[10px] text-[#737373] bg-[#141414] px-1.5 py-0.5 rounded"
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
