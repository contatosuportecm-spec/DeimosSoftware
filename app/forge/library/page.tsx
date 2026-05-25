"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import LayoutApp from "@/app/layout-app";
import { useForgeHistory } from "@/hooks/useForgeHistory";
import { ForgeGeneration, ForgeCategory } from "@/types/forge";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon, Video, Mic, Download, X, ChevronLeft,
  Sparkles, Loader2, Search,
} from "lucide-react";

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
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

type FilterType = "all" | "image" | "video" | "lipsync";

const FILTERS: { value: FilterType; label: string; icon: typeof ImageIcon }[] = [
  { value: "all",     label: "Tudo",    icon: Sparkles },
  { value: "image",   label: "Imagens", icon: ImageIcon },
  { value: "video",   label: "Vídeos",  icon: Video },
  { value: "lipsync", label: "LipSync", icon: Mic },
];

function LibraryLightbox({ gen, onClose }: { gen: ForgeGeneration; onClose: () => void }) {
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
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
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

      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-8 pb-6 pt-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto flex items-end justify-between gap-6">
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
              <span className="text-[10px] text-white/40">{formatDate(gen.created_at)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => forceDownload(gen.result_url!, gen.category)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] uppercase tracking-[0.12em] transition-colors border border-white/10 backdrop-blur-sm flex-shrink-0"
          >
            <Download size={12} strokeWidth={1.5} />
            Download
          </button>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}

export default function LibraryPage() {
  const { generations, loading } = useForgeHistory(undefined, 100);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [lightboxGen, setLightboxGen] = useState<ForgeGeneration | null>(null);
  const closeLightbox = useCallback(() => setLightboxGen(null), []);

  const completed = generations.filter((g) => g.status === "completed" && g.result_url);

  const filtered = completed.filter((g) => {
    if (filter !== "all" && g.category !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const inPrompt = g.prompt?.toLowerCase().includes(q);
      const inModel = g.model_id.toLowerCase().includes(q);
      if (!inPrompt && !inModel) return false;
    }
    return true;
  });

  const counts = {
    all: completed.length,
    image: completed.filter((g) => g.category === "image").length,
    video: completed.filter((g) => g.category === "video").length,
    lipsync: completed.filter((g) => g.category === "lipsync").length,
  };

  return (
    <LayoutApp>
      <div className="p-6 space-y-5 h-[calc(100vh-0px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <a
              href="/forge"
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-border hover:border-border-strong hover:bg-bg-3 text-text-muted hover:text-text-primary transition-colors"
              title="Voltar ao AI Studio"
            >
              <ChevronLeft size={14} strokeWidth={1.5} />
            </a>
            <div>
              <h1 className="text-[15px] font-semibold text-text-primary tracking-wide">
                Biblioteca
              </h1>
              <p className="text-[10px] text-text-muted mt-0.5">
                Todas as suas gerações de IA
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search size={12} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por prompt ou modelo..."
              className="w-full bg-bg-2 border border-border rounded-lg pl-8 pr-3 py-2 text-[11px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-gold/30 transition-colors"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-bg-2 rounded-lg border border-border p-0.5 w-fit flex-shrink-0">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const active = filter === f.value;
            const count = counts[f.value];
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] uppercase tracking-[0.12em] transition-all",
                  active
                    ? "bg-bg-3 text-text-primary border border-border"
                    : "text-text-muted hover:text-text-secondary border border-transparent",
                )}
              >
                <Icon size={11} strokeWidth={1.5} />
                {f.label}
                {count > 0 && (
                  <span className={cn(
                    "text-[9px] font-mono ml-0.5",
                    active ? "text-text-secondary" : "text-text-muted/40",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={20} className="animate-spin text-text-muted/40" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Sparkles size={24} strokeWidth={1.5} className="text-text-muted/20" />
              <p className="text-[12px] text-text-muted/50">
                {search ? "Nenhum resultado encontrado" : "Nenhuma geração ainda"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map((gen) => {
                const isVideo = gen.category === "video" || gen.category === "lipsync";
                const CatIcon = gen.category === "image" ? ImageIcon : gen.category === "video" ? Video : Mic;

                return (
                  <button
                    key={gen.id}
                    onClick={() => setLightboxGen(gen)}
                    className="rounded-xl overflow-hidden border border-border bg-bg-2 hover:border-border-strong transition-all group text-left"
                  >
                    <div className="relative aspect-square bg-black/40 overflow-hidden">
                      {isVideo ? (
                        <video
                          src={gen.result_url!}
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                        />
                      ) : (
                        <img
                          src={gen.result_url!}
                          alt={gen.prompt || ""}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Category badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10">
                        <CatIcon size={9} strokeWidth={1.5} className="text-white/70" />
                        <span className="text-[8px] font-mono text-white/70 uppercase">{gen.category}</span>
                      </div>

                      {/* Download on hover */}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span
                          onClick={(e) => { e.stopPropagation(); forceDownload(gen.result_url!, gen.category); }}
                          className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10 cursor-pointer"
                        >
                          <Download size={11} strokeWidth={1.5} className="text-white" />
                        </span>
                      </div>
                    </div>

                    <div className="px-3 py-2.5 space-y-1">
                      <p className="text-[10px] text-text-primary truncate leading-tight">
                        {gen.prompt || "Sem prompt"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-text-muted/50 truncate">
                          {gen.model_id}
                        </span>
                        <span className="text-[9px] text-text-muted/40 flex-shrink-0 ml-2">
                          {formatDate(gen.created_at)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {lightboxGen && <LibraryLightbox gen={lightboxGen} onClose={closeLightbox} />}
      </div>
    </LayoutApp>
  );
}
