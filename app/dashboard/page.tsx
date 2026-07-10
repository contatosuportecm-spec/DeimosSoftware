"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import LayoutApp from "@/app/layout-app";
import Link from "next/link";
import { useForgeHistory } from "@/hooks/useForgeHistory";
import { useSpy } from "@/hooks/useSpy";
import { useOfferBriefings } from "@/hooks/useOfferBriefings";
import { ForgeGeneration } from "@/types/forge";
import { OfferWithSnapshots, OfferBriefing } from "@/types";
import { cn, formatNumber } from "@/lib/utils";
import { tierColor } from "@/lib/spy-utils";
import MiniChart from "@/components/spy/MiniChart";
import {
  Image, Video, Mic, ArrowRight, Download, X, ExternalLink,
  ChevronLeft, ChevronRight, Cpu, Library as LibraryIcon, Radar,
  CircleDot, Briefcase, BarChart2,
  Fingerprint,
} from "lucide-react";

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "HOJE";
  const day = d.getDate();
  const months = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  return `${day} ${months[d.getMonth()]}`;
}

export default function DashboardPage() {
  const { generations, loading: histLoading } = useForgeHistory(undefined, 12);
  const { offers } = useSpy();
  const { briefings } = useOfferBriefings();

  // Top 2 spy offers by ads count
  const topSpy = useMemo(() => [...offers]
    .filter((o) => o.status !== "archived" && o.snapshots.length > 0)
    .sort((a, b) => {
      const aLast = a.snapshots[a.snapshots.length - 1]?.active_ads_count ?? 0;
      const bLast = b.snapshots[b.snapshots.length - 1]?.active_ads_count ?? 0;
      return bLast - aLast;
    })
    .slice(0, 2), [offers]);

  // Active briefings
  const activeBriefings = useMemo(() => briefings.filter((b) => b.status === "active" || b.status === "draft").slice(0, 4), [briefings]);

  // Stats
  const { totalOffers, totalAds, totalBriefings, activeBriefingsCount } = useMemo(() => ({
    totalOffers: offers.filter((o) => o.status !== "archived").length,
    totalAds: offers.reduce((sum, o) => {
      const last = o.snapshots[o.snapshots.length - 1]?.active_ads_count ?? 0;
      return sum + last;
    }, 0),
    totalBriefings: briefings.length,
    activeBriefingsCount: briefings.filter((b) => b.status === "active").length,
  }), [offers, briefings]);

  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <LayoutApp>
      <div className="p-8 space-y-7">

          {/* ── Header ── */}
          <div className="flex items-start justify-between animate-fade-in-up">
            <div>
              <h1 className="text-[22px] font-light text-white leading-tight tracking-tight">
                Bem-vindo,{" "}
                <span className="italic text-nova font-light">Caio.</span>
              </h1>
              <p className="text-[13px] text-text-secondary mt-1.5">
                Veja o desempenho geral do seu monitoramento.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.06] bg-bg-3 text-[12px] text-text-secondary">
              {today}
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-4 gap-4 animate-fade-in-up stagger-1">
            <StatCard icon={<Radar size={20} strokeWidth={1.5} />} value={String(totalOffers)} label="Ofertas monitoradas" color="#FF8A1F" />
            <StatCard icon={<BarChart2 size={20} strokeWidth={1.5} />} value={formatNumber(totalAds)} label="Anuncios ativos" color="#34D399" />
            <StatCard icon={<Briefcase size={20} strokeWidth={1.5} />} value={String(totalBriefings)} label="Briefings criados" color="#F4C430" />
            <StatCard icon={<CircleDot size={20} strokeWidth={1.5} />} value={String(activeBriefingsCount)} label="Ofertas ativas" color="#34D399" />
          </div>

          {/* ── Spy — maior volume ── */}
          {topSpy.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Radar size={16} strokeWidth={1.5} className="text-nova" />
                  <div>
                    <h2 className="text-[15px] font-bold text-white">Spy — maior volume</h2>
                    <p className="text-[12px] text-text-secondary mt-0.5">Ofertas com mais anuncios ativos hoje</p>
                  </div>
                </div>
                <Link href="/spy" className="flex items-center gap-1.5 text-[12px] font-semibold text-nova hover:text-nova/80 transition-colors">
                  Ver todas no Spy
                  <ArrowRight size={13} strokeWidth={2} />
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {topSpy.map((offer, idx) => (
                  <SpyHighlightCard key={offer.id} offer={offer} rank={idx + 1} />
                ))}
              </div>
            </section>
          )}

          {/* ── Suas Ofertas Ativas ── */}
          {activeBriefings.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Briefcase size={16} strokeWidth={1.5} className="text-nova" />
                  <div>
                    <h2 className="text-[15px] font-bold text-white">Suas ofertas ativas</h2>
                    <p className="text-[12px] text-text-secondary mt-0.5">Acompanhe o desempenho das suas ofertas</p>
                  </div>
                </div>
                <Link href="/offer-briefings" className="flex items-center gap-1.5 text-[12px] font-semibold text-nova hover:text-nova/80 transition-colors">
                  Ver todas as ofertas
                  <ArrowRight size={13} strokeWidth={2} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeBriefings.map((b) => (
                  <BriefingMiniCard key={b.id} briefing={b} />
                ))}
              </div>
            </section>
          )}

          {/* ── Knowledge System ── */}
          <section className="space-y-4 animate-fade-in-up stagger-4">
            <div className="flex items-center gap-2.5">
              <LibraryIcon size={16} strokeWidth={1.5} className="text-gold" />
              <div>
                <h2 className="text-[15px] font-bold text-white">Knowledge System</h2>
                <p className="text-[12px] text-text-secondary mt-0.5">Pesquise, converse com documentos e simule clientes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Biblioteca */}
              <Link
                href="/biblioteca"
                className="flex items-center gap-4 px-5 py-5 rounded-2xl bg-bg-3 border border-white/[0.06] hover:border-gold/15 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gold/10 border border-gold/15">
                  <LibraryIcon size={20} strokeWidth={1.5} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-white">Biblioteca</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Converse com seus documentos, PDFs e videos. Use vozes de copywriters lendarios.</p>
                </div>
                <ArrowRight size={14} strokeWidth={1.5} className="text-[#6B6B76] group-hover:text-gold transition-colors flex-shrink-0" />
              </Link>

              {/* Clientes Artificiais */}
              <Link
                href="/clientes"
                className="flex items-center gap-4 px-5 py-5 rounded-2xl bg-bg-3 border border-white/[0.06] hover:border-gold/15 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gold/10 border border-gold/15">
                  <Fingerprint size={20} strokeWidth={1.5} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-white">Clientes Artificiais</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Simule seu publico-alvo com IA e teste copy antes de gastar com trafego.</p>
                </div>
                <ArrowRight size={14} strokeWidth={1.5} className="text-[#6B6B76] group-hover:text-gold transition-colors flex-shrink-0" />
              </Link>
            </div>
          </section>

          {/* ── AI Studio Section ── */}
          <AIStudioSection generations={generations} loading={histLoading} />
      </div>
    </LayoutApp>
  );
}

/* ═══ Stat Card ═══ */

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="group rounded-2xl overflow-hidden bg-bg-3 border border-transparent hover:border-[rgba(255,180,100,0.10)] transition-all" style={{ padding: "4px" }}>
      <div className="rounded-xl px-4 py-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}10, transparent 70%)` }}>
        {/* Subtle shine on hover */}
        <div className="absolute w-[150%] h-[1px] top-0 left-[-100%] bg-white/15 rotate-[50deg] blur-[3px] group-hover:left-[70%] group-hover:top-[100%] transition-all duration-1000" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15`, color }}>
            {icon}
          </div>
          <div>
            <p className="text-[20px] font-mono font-bold text-white leading-none">{value}</p>
            <p className="text-[9px] text-text-muted mt-1 uppercase tracking-wider">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ Spy Highlight Card ═══ */

function SpyHighlightCard({ offer, rank }: { offer: OfferWithSnapshots; rank: number }) {
  const snaps = offer.snapshots;
  const todayCount = snaps.length > 0 ? snaps[snaps.length - 1].active_ads_count : 0;
  const color = tierColor(todayCount);

  const chartData = snaps.map((s) => ({
    label: formatChartDate(s.date),
    value: s.active_ads_count,
  }));

  return (
    <div className="rounded-2xl overflow-hidden bg-bg-3 border border-transparent hover:border-[rgba(255,180,100,0.12)] transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]" style={{ padding: "4px" }}>
      {/* Colored top section */}
      <div className="rounded-xl px-4 py-4 relative" style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-white truncate">{offer.name}</p>
            <p className="text-[10px] capitalize mt-0.5" style={{ color: `${color}aa` }}>{offer.niche}</p>
          </div>
          <p className="text-[26px] font-mono font-bold leading-none" style={{ color }}>
            {formatNumber(todayCount)}
          </p>
        </div>
      </div>
      {/* Chart + Biblioteca */}
      <div className="px-3 py-3">
        {chartData.length >= 2 ? (
          <MiniChart data={chartData} color={color} valueFontSize={9} labelFontSize={7} dotRadius={3.5} />
        ) : (
          <div className="h-12 flex items-center justify-center">
            <span className="text-[10px] text-text-muted">Aguardando dados</span>
          </div>
        )}
        <div className="mt-2 pt-2 border-t border-[rgba(255,180,100,0.06)]">
          {offer.library_url ? (
            <a href={offer.library_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-nova bg-nova/8 border border-nova/15 hover:bg-nova/15 hover:border-nova/25 transition-all">
              <LibraryIcon size={11} strokeWidth={1.5} />
              Biblioteca
              <ExternalLink size={9} strokeWidth={1.5} />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] text-text-muted/40">
              <LibraryIcon size={11} strokeWidth={1.5} />
              Sem link
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ Briefing Mini Card ═══ */

function BriefingMiniCard({ briefing }: { briefing: OfferBriefing }) {
  const router = useRouter();
  const ticket = Number(briefing.ticket || 0);
  const sales = briefing.sales_count ?? 0;

  const NICHE_COLORS: Record<string, string> = {
    emagrecimento: "#FF8A1F", "Emagrecimento": "#FF8A1F",
    "saude-masculina": "#34D399", "Saúde & Bem-estar": "#34D399",
    "renda-extra": "#F4C430", "Renda Extra": "#F4C430",
    beleza: "#FF8A1F", "Beleza & Estética": "#FF8A1F",
    relacionamento: "#F4C430",
  };
  const nicheColor = NICHE_COLORS[briefing.niche] ?? "#FF8A1F";

  return (
    <div
      className="group rounded-2xl overflow-hidden cursor-pointer bg-bg-3 border border-transparent hover:border-[rgba(255,180,100,0.12)] transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
      style={{ padding: "4px" }}
      onClick={() => router.push(`/offer-briefings/${briefing.id}`)}
    >
      {/* Colored header band */}
      <div className="rounded-xl px-4 py-3.5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${nicheColor}20, ${nicheColor}08)` }}>
        {/* Shine effect */}
        <div className="absolute w-[150%] h-[2px] top-0 left-[-100%] bg-white/20 rotate-[50deg] blur-[4px] group-hover:left-[70%] group-hover:top-[100%] transition-all duration-1000" />
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white truncate">{briefing.offer_name}</p>
            <p className="text-[10px] mt-0.5" style={{ color: `${nicheColor}99` }}>{briefing.niche}</p>
          </div>
          <span className="flex items-center gap-1 text-[8px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 shrink-0">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            Ativa
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[8px] uppercase tracking-wider text-text-muted">Ticket</p>
            <p className="text-[13px] font-mono font-bold text-white mt-0.5">
              R$ {ticket.toFixed(0)}
            </p>
          </div>
          <div className="border-l border-r" style={{ borderColor: "rgba(255,180,100,0.06)" }}>
            <p className="text-[8px] uppercase tracking-wider text-text-muted pl-2">Vendas</p>
            <p className="text-[13px] font-mono font-bold text-white mt-0.5 pl-2">{sales}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-wider text-text-muted pl-2">Conv.</p>
            <p className="text-[13px] font-mono font-bold text-white mt-0.5 pl-2">{sales > 0 ? "2,4%" : "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AI Studio Section                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STUDIO_LINKS = [
  { label: "Imagem", sub: "Text → Image", icon: Image, path: "/forge/image" },
  { label: "Video", sub: "Text / Image → Video", icon: Video, path: "/forge/video" },
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

function fmtDate(iso: string) {
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
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10">
        <X size={18} strokeWidth={1.5} className="text-white" />
      </button>
      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video src={gen.result_url!} controls autoPlay loop className="max-w-full max-h-[85vh] rounded-lg" />
        ) : (
          <img src={gen.result_url!} alt={gen.prompt || ""} className="max-w-full max-h-[85vh] rounded-lg object-contain" />
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-8 pb-6 pt-16" onClick={(e) => e.stopPropagation()}>
        <div className="max-w-3xl mx-auto flex items-end justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            {gen.prompt && <p className="text-sm text-white/90 leading-relaxed line-clamp-2">{gen.prompt}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/70 border border-white/10">{gen.model_id}</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/70 border border-white/10 uppercase">{gen.category}</span>
              {params.aspect_ratio && <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/70 border border-white/10">{String(params.aspect_ratio)}</span>}
              <span className="text-[10px] text-white/40">{fmtDate(gen.created_at)}</span>
            </div>
          </div>
          <button type="button" onClick={() => forceDownload(gen.result_url!, gen.category)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] uppercase tracking-[0.12em] transition-colors border border-white/10 backdrop-blur-sm flex-shrink-0">
            <Download size={12} strokeWidth={1.5} />
            Download
          </button>
        </div>
      </div>
    </motion.div>,
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
    scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Cpu size={16} strokeWidth={1.5} className="text-nova" />
          <div>
            <h2 className="text-[15px] font-bold text-white">AI Studio</h2>
            <p className="text-[12px] text-text-secondary mt-0.5">Geracao de conteudo com IA</p>
          </div>
        </div>
        <Link href="/forge" className="flex items-center gap-1.5 text-[12px] font-semibold text-nova hover:text-nova/80 transition-colors">
          Ver tudo
          <ArrowRight size={13} strokeWidth={2} />
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
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-bg-3 border border-white/[0.06] hover:border-white/[0.12] transition-all group"
            >
              <Icon size={14} strokeWidth={1.5} className="text-text-muted group-hover:text-nova transition-colors" />
              <p className="text-[11px] font-medium text-text-secondary group-hover:text-white transition-colors">{s.label}</p>
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
        <div className="rounded-xl bg-bg-3 flex items-center justify-center py-10 gap-3" style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }}>
          <Cpu size={16} strokeWidth={1.5} className="text-text-muted" />
          <p className="text-[11px] text-text-muted">Nenhuma geracao ainda — escolha um studio acima</p>
        </div>
      ) : (
        <div className="relative group/carousel">
          {completed.length > 4 && (
            <>
              <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-bg-3 border border-white/[0.06] shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-bg-4">
                <ChevronLeft size={14} strokeWidth={1.5} className="text-text-secondary" />
              </button>
              <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-8 h-8 rounded-full bg-bg-3 border border-white/[0.06] shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-bg-4">
                <ChevronRight size={14} strokeWidth={1.5} className="text-text-secondary" />
              </button>
            </>
          )}

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
            {completed.map((gen) => {
              const isVideo = gen.category === "video" || gen.category === "lipsync";
              const CatIcon = gen.category === "image" ? Image : gen.category === "video" ? Video : Mic;
              return (
                <button key={gen.id} onClick={() => setLightboxGen(gen)} className="flex-shrink-0 w-[200px] rounded-xl overflow-hidden bg-bg-3 hover:bg-bg-3/80 transition-all group snap-start" style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }}>
                  <div className="relative aspect-[4/3] bg-black/40 overflow-hidden">
                    {isVideo ? (
                      <video src={gen.result_url!} muted playsInline className="w-full h-full object-cover" onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
                    ) : (
                      <img src={gen.result_url!} alt={gen.prompt || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10">
                      <CatIcon size={9} strokeWidth={1.5} className="text-white/70" />
                      <span className="text-[8px] font-mono text-white/70 uppercase">{gen.category}</span>
                    </div>
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10">
                      <span className="text-[8px] text-white/50">{fmtDate(gen.created_at)}</span>
                    </div>
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span onClick={(e) => { e.stopPropagation(); forceDownload(gen.result_url!, gen.category); }} className="w-6 h-6 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10 cursor-pointer">
                        <Download size={11} strokeWidth={1.5} className="text-white" />
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-2 text-left">
                    <p className="text-[10px] text-white truncate leading-tight">{gen.prompt || "Sem prompt"}</p>
                    <p className="text-[9px] font-mono text-text-muted mt-0.5 truncate">{gen.model_id}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {lightboxGen && <StudioLightbox gen={lightboxGen} onClose={closeLightbox} />}
    </section>
  );
}
