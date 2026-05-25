"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useForgeHistory } from "@/hooks/useForgeHistory";
import { ForgeCategory, ForgeGeneration } from "@/types/forge";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Video, Mic, AlertCircle, Loader2, ArrowRight, Download, ArrowUpRight, X } from "lucide-react";

async function forceDownload(url: string, category: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = category === "image" ? "png" : "mp4";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `forge-${Date.now()}.${ext}`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function HistoryLightbox({
  gen,
  supportsImageRef,
  onUseAsReference,
  onClose,
}: {
  gen: ForgeGeneration;
  supportsImageRef?: boolean;
  onUseAsReference?: (url: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isVideo = gen.category === "video" || gen.category === "lipsync";
  const params = gen.params as Record<string, string | number | undefined>;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-2xl bg-black/40"
      style={{ WebkitBackdropFilter: "blur(40px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >

      <button
        onClick={onClose}
        className="absolute top-3 right-3 md:top-5 md:right-5 w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
      >
        <X size={18} strokeWidth={1.5} className="text-white" />
      </button>

      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video src={gen.result_url!} controls autoPlay loop className="max-w-full max-h-[85vh] rounded-lg" />
        ) : (
          <img src={gen.result_url!} alt={gen.prompt || ""} className="max-w-full max-h-[85vh] rounded-lg object-contain" />
        )}
      </div>

      {/* Bottom info bar */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 md:px-8 pb-4 md:pb-6 pt-12 md:pt-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-3 md:gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            {gen.prompt && (
              <p className="text-sm text-white/90 leading-relaxed line-clamp-2">{gen.prompt}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/70 border border-white/10">
                {gen.model_id}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/70 border border-white/10 uppercase">
                {gen.category}
              </span>
              {params.aspect_ratio && (
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/70 border border-white/10">
                  {String(params.aspect_ratio)}
                </span>
              )}
              {params.resolution && (
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/70 border border-white/10">
                  {String(params.resolution)}
                </span>
              )}
              {params.duration && (
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/70 border border-white/10">
                  {String(params.duration)}s
                </span>
              )}
              {params.quality && (
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/70 border border-white/10">
                  {String(params.quality)}
                </span>
              )}
              <span className="text-[10px] text-white/40">{formatDate(gen.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {supportsImageRef && onUseAsReference && gen.category === "image" && (
              <button
                type="button"
                onClick={() => { onUseAsReference(gen.result_url!); onClose(); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold text-[11px] uppercase tracking-[0.12em] transition-colors border border-gold/30 backdrop-blur-sm"
              >
                <ArrowUpRight size={12} strokeWidth={1.5} />
                Referência
              </button>
            )}
            <button
              type="button"
              onClick={() => forceDownload(gen.result_url!, gen.category)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] uppercase tracking-[0.12em] transition-colors border border-white/10 backdrop-blur-sm"
            >
              <Download size={12} strokeWidth={1.5} />
              Download
            </button>
          </div>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}

interface HistoryStripProps {
  category: ForgeCategory;
  onSelect?: (gen: ForgeGeneration) => void;
  activeId?: string;
  supportsImageRef?: boolean;
  onUseAsReference?: (url: string) => void;
  label?: string;
  refreshKey?: number;
}

const STATUS_DOT = {
  completed: "bg-success",
  failed: "bg-danger",
  pending: "bg-warning animate-pulse",
  processing: "bg-gold animate-pulse",
};

export default function HistoryStrip({ category, onSelect, activeId, supportsImageRef, onUseAsReference, label, refreshKey }: HistoryStripProps) {
  const { generations, loading, refetch } = useForgeHistory(category, 20);
  const prevRefreshKey = useRef(refreshKey);

  useEffect(() => {
    if (refreshKey !== undefined && refreshKey !== prevRefreshKey.current) {
      prevRefreshKey.current = refreshKey;
      refetch();
    }
  }, [refreshKey, refetch]);
  const CategoryIcon = category === "image" ? ImageIcon : category === "video" ? Video : Mic;
  const [lightboxGen, setLightboxGen] = useState<ForgeGeneration | null>(null);
  const closeLightbox = useCallback(() => setLightboxGen(null), []);

  const handleClick = (gen: ForgeGeneration) => {
    if (gen.status === "completed" && gen.result_url) {
      setLightboxGen(gen);
    }
    onSelect?.(gen);
  };

  return (
    <div className="border-t border-border pt-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold">
          {label || "Gerações Recentes"}
        </span>
        <a href="/forge/library" className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-text-muted hover:text-text-secondary transition-colors">
          Ver todas
          <ArrowRight size={11} strokeWidth={1.5} />
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={14} className="animate-spin text-text-muted/60" />
        </div>
      ) : generations.length === 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border border-border bg-bg-3/40"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
          {generations.slice(0, 7).map((gen) => (
            <button
              key={gen.id}
              onClick={() => handleClick(gen)}
              className={cn(
                "aspect-square rounded-lg overflow-hidden border transition-all relative group",
                gen.id === activeId
                  ? "border-gold ring-2 ring-gold/20"
                  : "border-border hover:border-border-strong",
              )}
              title={gen.prompt || gen.model_id}
            >
              {gen.status === "completed" && gen.result_url && gen.category === "image" ? (
                <div className="w-full h-full relative bg-bg-3 skeleton-shimmer">
                  <img
                    src={gen.result_url}
                    alt={gen.prompt || ""}
                    className="w-full h-full object-cover animate-[fadeIn_300ms_ease-out]"
                    onLoad={(e) => { (e.currentTarget.parentElement as HTMLDivElement).classList.remove("skeleton-shimmer", "bg-bg-3"); }}
                  />
                </div>
              ) : gen.status === "completed" && gen.result_url ? (
                <div className="w-full h-full relative bg-bg-3 skeleton-shimmer">
                  <video
                    src={gen.result_url}
                    className="w-full h-full object-cover animate-[fadeIn_300ms_ease-out]"
                    muted
                    playsInline
                    onLoadedData={(e) => { (e.currentTarget.parentElement as HTMLDivElement).classList.remove("skeleton-shimmer", "bg-bg-3"); }}
                  />
                </div>
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

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5">
                <CategoryIcon size={11} strokeWidth={1.5} className="text-white/80" />
                {gen.status === "completed" && gen.result_url && (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {supportsImageRef && onUseAsReference && gen.category === "image" && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onUseAsReference(gen.result_url!); }}
                        className="w-5 h-5 rounded bg-gold/80 hover:bg-gold flex items-center justify-center transition-colors"
                        title="Usar como referência"
                      >
                        <ArrowUpRight size={10} strokeWidth={2} className="text-black" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); forceDownload(gen.result_url!, gen.category); }}
                      className="w-5 h-5 rounded bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                      title="Download"
                    >
                      <Download size={10} strokeWidth={2} className="text-white" />
                    </button>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {lightboxGen && (
        <HistoryLightbox
          gen={lightboxGen}
          supportsImageRef={supportsImageRef}
          onUseAsReference={onUseAsReference}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
