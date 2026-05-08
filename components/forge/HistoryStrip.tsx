"use client";

import { useForgeHistory } from "@/hooks/useForgeHistory";
import { ForgeCategory, ForgeGeneration } from "@/types/forge";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Video, Mic, AlertCircle, Loader2, ArrowRight } from "lucide-react";

interface HistoryStripProps {
  category: ForgeCategory;
  onSelect?: (gen: ForgeGeneration) => void;
  activeId?: string;
}

const STATUS_DOT = {
  completed: "bg-success",
  failed: "bg-danger",
  pending: "bg-warning animate-pulse",
  processing: "bg-gold animate-pulse",
};

export default function HistoryStrip({ category, onSelect, activeId }: HistoryStripProps) {
  const { generations, loading } = useForgeHistory(category, 20);
  const CategoryIcon = category === "image" ? ImageIcon : category === "video" ? Video : Mic;

  return (
    <div className="border-t border-border pt-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold">
          Gerações Recentes
        </span>
        <button className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-text-muted hover:text-text-secondary transition-colors">
          Ver todas
          <ArrowRight size={11} strokeWidth={1.5} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={14} className="animate-spin text-text-muted/60" />
        </div>
      ) : generations.length === 0 ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border border-border bg-bg-3/40"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {generations.slice(0, 7).map((gen) => (
            <button
              key={gen.id}
              onClick={() => onSelect?.(gen)}
              className={cn(
                "aspect-square rounded-lg overflow-hidden border transition-all relative group",
                gen.id === activeId
                  ? "border-gold ring-2 ring-gold/20"
                  : "border-border hover:border-border-strong",
              )}
              title={gen.prompt || gen.model_id}
            >
              {gen.status === "completed" && gen.result_url && gen.category === "image" ? (
                <img
                  src={gen.result_url}
                  alt={gen.prompt || ""}
                  className="w-full h-full object-cover"
                />
              ) : gen.status === "completed" && gen.result_url ? (
                <video
                  src={gen.result_url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : gen.status === "failed" ? (
                <div className="w-full h-full flex items-center justify-center bg-danger/5">
                  <AlertCircle size={16} strokeWidth={1.5} className="text-danger/60" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-bg-3">
                  <Loader2 size={14} className="animate-spin text-gold/60" />
                </div>
              )}

              <div className="absolute bottom-1 left-1 flex items-center gap-1">
                <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[gen.status])} />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                <CategoryIcon size={11} strokeWidth={1.5} className="text-white/80" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
