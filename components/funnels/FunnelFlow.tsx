"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import StageCard from "./StageCard";
import type { Funnel, FunnelStage, FunnelConnection } from "@/types/funnels";

interface FunnelFlowProps {
  funnel: Funnel;
  onSave: (patch: { stages?: FunnelStage[]; connections?: FunnelConnection[] }) => void;
}

export default function FunnelFlow({ funnel, onSave }: FunnelFlowProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Split stages into main flow + terminal states
  const mainFlow = funnel.stages.filter(
    (s) => s.type !== "venda" && s.type !== "recusado"
  );
  const venda = funnel.stages.find((s) => s.type === "venda");
  const recusado = funnel.stages.find((s) => s.type === "recusado");

  const updateStage = useCallback(
    (updated: FunnelStage) => {
      const stages = funnel.stages.map((s) => (s.id === updated.id ? updated : s));
      onSave({ stages });
    },
    [funnel.stages, onSave]
  );

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto py-8 px-4 space-y-0">
      {/* Main linear flow */}
      {mainFlow.map((stage, idx) => (
        <div key={stage.id}>
          <StageCard
            stage={stage}
            isSelected={selectedStage === stage.id}
            onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
            onUpdate={updateStage}
          />

          {/* Connector line */}
          {idx < mainFlow.length - 1 && (
            <div className="flex justify-center py-1">
              <div className="w-px h-8 bg-gradient-to-b from-white/[0.12] to-white/[0.04]" />
            </div>
          )}
        </div>
      ))}

      {/* Fork: Checkout → Venda / Recusado */}
      {(venda || recusado) && (
        <>
          {/* Fork connector */}
          <div className="flex justify-center py-1">
            <div className="w-px h-6 bg-gradient-to-b from-white/[0.12] to-white/[0.04]" />
          </div>

          {/* Fork split */}
          <div className="relative">
            {/* Horizontal connector line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-white/[0.08]" />

            {/* Vertical drops from horizontal line */}
            <div className="absolute top-0 left-[20%] w-px h-5 bg-white/[0.08]" />
            <div className="absolute top-0 left-[80%] w-px h-5 bg-white/[0.08]" />

            {/* Labels on the branches */}
            <div className="flex justify-between px-[8%] mb-1">
              <span className="text-[9px] uppercase tracking-[0.15em] font-medium text-emerald-400/70 pt-6">
                Aprovado
              </span>
              <span className="text-[9px] uppercase tracking-[0.15em] font-medium text-red-400/70 pt-6">
                Recusado
              </span>
            </div>

            {/* Two terminal cards side by side */}
            <div className="grid grid-cols-2 gap-4 mt-1">
              {venda && (
                <StageCard
                  stage={venda}
                  isSelected={selectedStage === venda.id}
                  onClick={() => setSelectedStage(selectedStage === venda.id ? null : venda.id)}
                  onUpdate={updateStage}
                />
              )}
              {recusado && (
                <StageCard
                  stage={recusado}
                  isSelected={selectedStage === recusado.id}
                  onClick={() => setSelectedStage(selectedStage === recusado.id ? null : recusado.id)}
                  onUpdate={updateStage}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
