"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import LayoutApp from "@/app/layout-app";
import Link from "next/link";
import { useForgeHistory } from "@/hooks/useForgeHistory";
import { ForgeGeneration } from "@/types/forge";
import { cn } from "@/lib/utils";
import {
  Image, Video, Mic, ArrowRight, Download, X,
  ChevronLeft, ChevronRight, Zap, Sparkles, Eye,
} from "lucide-react";

const STATS = [
  { label: "Ofertas monitoradas", value: "—", sub: "Adicione ofertas no Spy" },
  { label: "Receita (MTD)",       value: "—", sub: "Sem dados ainda"         },
  { label: "Insights gerados",    value: "—", sub: "Sem dados ainda"         },
  { label: "ROAS médio",          value: "—", sub: "Sem dados ainda"         },
];

export default function DashboardPage() {
  const { generations, loading: histLoading } = useForgeHistory(undefined, 12);

  return (
    <LayoutApp>
      <div className="p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[23px] font-light text-text-primary leading-tight tracking-tight">
              Bem-vindo,{" "}
              <span className="italic text-nova font-light">Caio.</span>
            </h1>
            <p className="text-[12px] text-text-muted mt-1.5 font-normal">
              Adicione suas ofertas no Spy para começar a monitorar.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted/40" />
              <span className="text-[11px] text-text-muted">Sem dados ativos</span>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="glass glass-hover rounded-xl p-4 overflow-hidden">
              <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted mb-2 font-semibold">
                {s.label}
              </p>
              <p className="text-[22px] font-mono font-medium text-text-muted/40 leading-none">
                {s.value}
              </p>
              <p className="text-[10px] mt-1.5 font-mono text-text-muted/60">
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Main area ── */}
        <div className="grid grid-cols-[1fr_296px] gap-4">

          {/* NOVA chat widget */}
          <div className="glass rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-nova shadow-[0_0_8px_rgba(255,138,31,0.6)]" />
                <span className="text-xs font-semibold text-text-primary tracking-widest uppercase">
                  NOVA
                </span>
              </div>
              <span className="text-[10px] text-text-muted">Direct Response Analyst</span>
            </div>

            <div className="flex-1 p-4 flex items-center justify-center min-h-[260px]">
              <div className="text-center space-y-2">
                <p className="text-[12px] text-text-muted">
                  Adicione ofertas no Spy para ativar análise automática.
                </p>
                <Link href="/spy" className="text-[11px] text-gold hover:text-gold-hover transition-colors">
                  Ir para o Spy →
                </Link>
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] p-3 space-y-2">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-white/[0.07]" style={{ background: "rgba(0,0,0,0.3)" }}>
                <input
                  className="flex-1 bg-transparent text-[12px] text-text-secondary placeholder:text-text-muted outline-none"
                  placeholder="Pergunte à NOVA, ou descreva o criativo que você precisa..."
                />
                <button className="w-6 h-6 rounded-md bg-nova flex items-center justify-center flex-shrink-0 hover:bg-nova-hover transition-colors shadow-[0_0_10px_rgba(255,138,31,0.3)]">
                  <span className="text-white text-sm leading-none">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Top Ofertas */}
            <div className="glass glass-hover rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-semibold">
                  Top ofertas · ROAS
                </p>
                <Link href="/spy" className="text-[10px] text-text-muted hover:text-gold transition-colors">
                  Adicionar →
                </Link>
              </div>
              <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                <p className="text-[11px] text-text-muted/60">Nenhuma oferta monitorada</p>
                <Link href="/spy" className="text-[10px] text-gold/70 hover:text-gold transition-colors">
                  Ir para o Spy
                </Link>
              </div>
            </div>

            {/* Alertas */}
            <div className="glass glass-hover rounded-xl p-4">
              <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-semibold mb-4">
                Alertas inteligentes
              </p>
              <div className="flex items-center justify-center py-6">
                <p className="text-[11px] text-text-muted/60">Nenhum alerta ativo</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Spy ── */}
        <Link
          href="/spy"
          className="flex items-center justify-between px-5 py-4 rounded-xl border border-border bg-bg-2 hover:bg-bg-3 hover:border-border-strong transition-all group"
        >
          <div className="flex items-center gap-3">
            <Eye size={15} strokeWidth={1.5} className="text-nova" />
            <span className="text-[12px] font-semibold text-text-primary tracking-wide uppercase">Spy</span>
            <span className="text-[10px] text-text-muted">Monitoramento de ofertas</span>
          </div>
          <ArrowRight size={13} strokeWidth={1.5} className="text-text-muted/30 group-hover:text-nova transition-colors" />
        </Link>

        {/* ── AI Studio Section ── */}
        <AIStudioSection generations={generations} loading={histLoading} />
      </div>
    </LayoutApp>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AI Studio Section                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STUDIO_LINKS = [
  { label: "Imagem", sub: "Text → Image", icon: Image, path: "/forge/image" },
  { label: "Vídeo", sub: "Text / Image → Video", icon: Video, path: "/forge/video" },
  { label: "LipSync", sub: "Image + Audio → Video", icon: Mic, path: "/forge/lipsync" },
];

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
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function StudioLightbox({ gen, onClose }: { gen: ForgeGeneration; onClose: () => void }) {
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
    </div>,
    document.body,
  );
}

function AIStudioSection({ generations, loading }: { generations: ForgeGeneration[]; loading: boolean }) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightboxGen, setLightboxGen] = useState<ForgeGeneration | null>(null);
  const closeLightbox = useCallback(() => setLightboxGen(null), []);

  const completed = generations.filter((g) => g.status === "completed" && g.result_url);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap size={14} strokeWidth={1.5} className="text-nova" />
            <h2 className="text-[13px] font-semibold text-text-primary tracking-wide uppercase">
              AI Studio
            </h2>
          </div>
          <span className="text-[10px] text-text-muted/50 font-mono">·</span>
          <span className="text-[10px] text-text-muted">Geração de conteúdo com IA</span>
        </div>

        <Link
          href="/forge"
          className="flex items-center gap-1 text-[10px] text-text-muted hover:text-nova transition-colors uppercase tracking-[0.12em]"
        >
          Ver tudo
          <ArrowRight size={10} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Studio buttons */}
      <div className="flex items-center gap-3">
        {STUDIO_LINKS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => router.push(s.path)}
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-bg-2 hover:bg-bg-3 hover:border-gold/20 transition-all group"
            >
              <Icon size={15} strokeWidth={1.5} className="text-text-muted group-hover:text-gold transition-colors" />
              <div className="text-left">
                <p className="text-[11px] font-medium text-text-primary leading-tight">
                  {s.label}
                </p>
                <p className="text-[9px] text-text-muted/50 font-mono mt-0.5">
                  {s.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Carousel */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-4 h-4 border-2 border-nova/20 border-t-nova rounded-full animate-spin" />
        </div>
      ) : completed.length === 0 ? (
        <div className="glass rounded-xl flex items-center justify-center py-10 gap-3">
          <Sparkles size={16} strokeWidth={1.5} className="text-text-muted/30" />
          <p className="text-[11px] text-text-muted/50">Nenhuma geração ainda — escolha um studio acima</p>
        </div>
      ) : (
        <div className="relative group/carousel">
          {/* Scroll arrows */}
          {completed.length > 4 && (
            <>
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-bg-2 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-bg-3"
              >
                <ChevronLeft size={14} strokeWidth={1.5} className="text-text-secondary" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-8 h-8 rounded-full bg-bg-2 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-bg-3"
              >
                <ChevronRight size={14} strokeWidth={1.5} className="text-text-secondary" />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {completed.map((gen) => {
              const isVideo = gen.category === "video" || gen.category === "lipsync";
              const CatIcon = gen.category === "image" ? Image : gen.category === "video" ? Video : Mic;

              return (
                <button
                  key={gen.id}
                  onClick={() => setLightboxGen(gen)}
                  className="flex-shrink-0 w-[200px] rounded-xl overflow-hidden border border-border bg-bg-2 hover:border-border-strong transition-all group snap-start"
                >
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Category */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10">
                      <CatIcon size={9} strokeWidth={1.5} className="text-white/70" />
                      <span className="text-[8px] font-mono text-white/70 uppercase">{gen.category}</span>
                    </div>

                    {/* Time */}
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10">
                      <span className="text-[8px] text-white/50">{formatDate(gen.created_at)}</span>
                    </div>

                    {/* Download hover */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span
                        onClick={(e) => { e.stopPropagation(); forceDownload(gen.result_url!, gen.category); }}
                        className="w-6 h-6 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10 cursor-pointer"
                      >
                        <Download size={11} strokeWidth={1.5} className="text-white" />
                      </span>
                    </div>
                  </div>

                  <div className="px-3 py-2 text-left">
                    <p className="text-[10px] text-text-primary truncate leading-tight">
                      {gen.prompt || "Sem prompt"}
                    </p>
                    <p className="text-[9px] font-mono text-text-muted/50 mt-0.5 truncate">
                      {gen.model_id}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {lightboxGen && <StudioLightbox gen={lightboxGen} onClose={closeLightbox} />}
    </div>
  );
}
