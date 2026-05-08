"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import LayoutApp from "@/app/layout-app";
import { Image, Video, Mic, ArrowRight, KeyRound, Clock, Sparkles, Download, X, ChevronLeft, ChevronRight, Library } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useForgeHistory } from "@/hooks/useForgeHistory";
import { ForgeGeneration } from "@/types/forge";
import { cn } from "@/lib/utils";

interface StudioCard {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  path: string;
  models: string[];
}

const STUDIOS: StudioCard[] = [
  {
    id: "image",
    name: "Image Studio",
    subtitle: "Text → Image",
    description: "Gere imagens para anúncios e criativos com modelos de última geração.",
    icon: Image,
    path: "/forge/image",
    models: ["Nano Banana 2", "GPT Image 1.5"],
  },
  {
    id: "video",
    name: "Video Studio",
    subtitle: "Text / Image → Video",
    description: "Crie vídeos cinematográficos para hooks, VSLs e criativos de performance.",
    icon: Video,
    path: "/forge/video",
    models: ["Seedance 2.0", "Seedance Pro", "Veo 3", "AI Video Effects"],
  },
  {
    id: "lipsync",
    name: "LipSync Studio",
    subtitle: "Image + Audio → Video",
    description: "Transforme fotos em talking heads com sincronia labial perfeita para UGC.",
    icon: Mic,
    path: "/forge/lipsync",
    models: ["LTX 2 Lipsync"],
  },
];

export default function ForgePage() {
  const router = useRouter();
  const { generations, loading: histLoading } = useForgeHistory(undefined, 20);

  return (
    <LayoutApp>
      <div className="p-4 md:p-6 space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-[23px] font-light text-text-primary leading-tight tracking-tight">
              AI{" "}
              <span className="italic text-nova font-light">Studio.</span>
            </h1>
            <p className="text-[12px] text-text-muted mt-1.5 font-normal">
              Gere imagens, vídeos e talking heads com IA. Suas API keys, suas regras.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/forge/library")}
              className="flex items-center gap-1.5 px-3.5 py-2 md:py-1.5 rounded-md bg-gold/10 border border-gold/25 hover:bg-gold/20 hover:border-gold/40 text-gold text-[10px] font-medium transition-colors"
            >
              <Library size={11} strokeWidth={1.5} />
              Biblioteca
            </button>
            <button
              onClick={() => router.push("/forge/settings")}
              className="flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded-md bg-bg-3 border border-border hover:border-border-strong text-[10px] text-text-muted hover:text-text-secondary transition-colors"
            >
              <KeyRound size={11} strokeWidth={1.5} />
              API Keys
            </button>
          </div>
        </div>

        {/* ── Studios ── */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted font-semibold mb-3 px-1">
            Studios
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {STUDIOS.map((studio) => {
              const Icon = studio.icon;

              return (
                <button
                  key={studio.id}
                  onClick={() => router.push(studio.path)}
                  className="glass glass-hover rounded-xl text-left group overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    {/* Icon + Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-nova/10 border border-nova/20 flex items-center justify-center shadow-[0_0_12px_rgba(255,138,31,0.15)]">
                          <Icon size={16} strokeWidth={1.5} className="text-nova" />
                        </div>
                        <div>
                          <h3 className="text-[13px] font-semibold text-text-primary group-hover:text-white transition-colors leading-tight">
                            {studio.name}
                          </h3>
                          <p className="text-[9px] font-mono text-nova/60 mt-0.5">
                            {studio.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-nova/10 transition-all">
                        <ArrowRight size={12} strokeWidth={2} className="text-nova" />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {studio.description}
                    </p>

                    {/* Models tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
                      {studio.models.map((model) => (
                        <span
                          key={model}
                          className="px-2 py-[3px] rounded bg-bg-4/60 text-[9px] font-mono text-text-muted border border-border"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Últimas Gerações — Carrossel ── */}
        <RecentCarousel generations={generations} loading={histLoading} />
      </div>
    </LayoutApp>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  RecentCarousel                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

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

function GenLightbox({ gen, onClose }: { gen: ForgeGeneration; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isVideo = gen.category === "video" || gen.category === "lipsync";
  const params = gen.params as Record<string, string | number | undefined>;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      style={{ animation: "fadeIn 200ms ease-out" }}
      onClick={onClose}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 md:top-5 md:right-5 w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
      >
        <X size={18} strokeWidth={1.5} className="text-white" />
      </button>

      {/* Media */}
      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video src={gen.result_url!} controls autoPlay loop className="max-w-full max-h-[85vh] rounded-lg" />
        ) : (
          <img src={gen.result_url!} alt={gen.prompt || ""} className="max-w-full max-h-[85vh] rounded-lg object-contain" />
        )}
      </div>

      {/* Info bar */}
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
    </div>,
    document.body,
  );
}

type FilterType = "all" | "image" | "video";

const FILTERS: { value: FilterType; label: string; icon: typeof Image }[] = [
  { value: "all", label: "Tudo", icon: Sparkles },
  { value: "image", label: "Imagens", icon: Image },
  { value: "video", label: "Vídeos", icon: Video },
];

function RecentCarousel({ generations, loading }: { generations: ForgeGeneration[]; loading: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightboxGen, setLightboxGen] = useState<ForgeGeneration | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const closeLightbox = useCallback(() => setLightboxGen(null), []);

  const allCompleted = generations.filter((g) => g.status === "completed" && g.result_url);
  const completed = filter === "all"
    ? allCompleted
    : filter === "image"
      ? allCompleted.filter((g) => g.category === "image")
      : allCompleted.filter((g) => g.category === "video" || g.category === "lipsync");

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 px-1 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock size={12} strokeWidth={1.5} className="text-text-muted/50" />
            <span className="text-[10px] md:text-[9px] uppercase tracking-[0.22em] text-text-muted font-semibold">
              Últimas Gerações
            </span>
          </div>

          <div className="flex items-center gap-1 bg-bg-2 rounded-lg border border-border p-0.5">
            {FILTERS.map((f) => {
              const Icon = f.icon;
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] uppercase tracking-[0.12em] transition-all",
                    active
                      ? "bg-bg-3 text-text-primary border border-border"
                      : "text-text-muted hover:text-text-secondary border border-transparent",
                  )}
                >
                  <Icon size={10} strokeWidth={1.5} />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {completed.length > 4 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              className="w-6 h-6 rounded-md bg-bg-3 border border-border hover:border-border-strong flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={12} strokeWidth={1.5} className="text-text-muted" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-6 h-6 rounded-md bg-bg-3 border border-border hover:border-border-strong flex items-center justify-center transition-colors"
            >
              <ChevronRight size={12} strokeWidth={1.5} className="text-text-muted" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-nova/20 border-t-nova rounded-full animate-spin" />
        </div>
      ) : completed.length === 0 ? (
        <div className="glass rounded-xl flex flex-col items-center justify-center py-12 gap-2">
          <div className="w-10 h-10 rounded-xl bg-bg-3 border border-border flex items-center justify-center">
            <Sparkles size={18} strokeWidth={1.5} className="text-text-muted/40" />
          </div>
          <p className="text-[11px] text-text-muted/60">Nenhuma geração ainda</p>
          <p className="text-[10px] text-text-muted/40">Selecione um studio acima para começar</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {completed.map((gen) => {
            const isVideo = gen.category === "video" || gen.category === "lipsync";
            const CategoryIcon = gen.category === "image" ? Image : gen.category === "video" ? Video : Mic;

            return (
              <button
                key={gen.id}
                onClick={() => setLightboxGen(gen)}
                className="flex-shrink-0 w-[170px] sm:w-[220px] rounded-xl overflow-hidden border border-border bg-bg-2 hover:border-border-strong transition-all group snap-start"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-black/40 overflow-hidden">
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

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Category badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10">
                    <CategoryIcon size={9} strokeWidth={1.5} className="text-white/70" />
                    <span className="text-[8px] font-mono text-white/70 uppercase">{gen.category}</span>
                  </div>

                  {/* Time */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10">
                    <span className="text-[8px] text-white/50">{formatDate(gen.created_at)}</span>
                  </div>

                  {/* Download on hover */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span
                      onClick={(e) => { e.stopPropagation(); forceDownload(gen.result_url!, gen.category); }}
                      className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10 cursor-pointer"
                    >
                      <Download size={12} strokeWidth={1.5} className="text-white" />
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="px-3 py-2.5 text-left space-y-1.5">
                  <p className="text-[10px] text-text-primary truncate leading-tight">
                    {gen.prompt || "Sem prompt"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-text-muted/60 truncate">
                      {gen.model_id}
                    </span>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      gen.status === "completed" ? "bg-emerald-400" : "bg-amber-400 animate-pulse",
                    )} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {lightboxGen && <GenLightbox gen={lightboxGen} onClose={closeLightbox} />}
    </div>
  );
}
