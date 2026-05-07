"use client";

import { useForgeHistory } from "@/hooks/useForgeHistory";
import { ForgeCategory, ForgeGeneration } from "@/types/forge";
import { cn } from "@/lib/utils";
import { Clock, Image as ImageIcon, Video, Mic, AlertCircle, Loader2 } from "lucide-react";

interface HistorySidebarProps {
  category: ForgeCategory;
  onSelect?: (gen: ForgeGeneration) => void;
  activeId?: string;
}

const STATUS_INDICATORS = {
  completed: "bg-success",
  failed: "bg-danger",
  pending: "bg-warning animate-pulse",
  processing: "bg-gold animate-pulse",
};

export default function HistorySidebar({ category, onSelect, activeId }: HistorySidebarProps) {
  const { generations, loading } = useForgeHistory(category, 30);

  const CategoryIcon = category === "image" ? ImageIcon : category === "video" ? Video : Mic;

  return (
    <div className="w-56 flex-shrink-0 border-l border-border bg-bg-2/50 flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
        <Clock size={12} strokeWidth={1.5} className="text-text-muted" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold">Histórico</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={16} className="animate-spin text-text-muted" />
          </div>
        ) : generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <CategoryIcon size={20} strokeWidth={1} className="text-text-muted/30" />
            <p className="text-[10px] text-text-muted/60">Nenhuma geração ainda</p>
          </div>
        ) : (
          generations.map((gen) => (
            <button
              key={gen.id}
              onClick={() => onSelect?.(gen)}
              className={cn(
                "w-full text-left rounded-md p-2 transition-colors group",
                gen.id === activeId
                  ? "bg-gold/10 border border-gold/20"
                  : "hover:bg-bg-3 border border-transparent"
              )}
            >
              <div className="flex items-start gap-2">
                {/* Thumbnail or placeholder */}
                <div className="w-10 h-10 rounded bg-bg-3 flex-shrink-0 overflow-hidden border border-border flex items-center justify-center">
                  {gen.status === "completed" && gen.result_url && gen.category === "image" ? (
                    <img src={gen.result_url} alt="" className="w-full h-full object-cover" />
                  ) : gen.status === "failed" ? (
                    <AlertCircle size={12} className="text-danger/50" />
                  ) : gen.status === "completed" ? (
                    <CategoryIcon size={12} className="text-gold/50" />
                  ) : (
                    <Loader2 size={12} className="animate-spin text-text-muted/40" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-text-primary truncate leading-tight">
                    {gen.prompt || gen.model_id}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_INDICATORS[gen.status])} />
                    <span className="text-[9px] text-text-muted font-mono">{gen.model_id}</span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
