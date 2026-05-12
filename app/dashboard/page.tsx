"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
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
  Image, Video, Mic, ArrowRight, Download, X,
  ChevronLeft, ChevronRight, Zap, Sparkles, Eye,
  Flame, FileText, ShoppingCart, TrendingUp,
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
  const topSpy = [...offers]
    .filter((o) => o.status !== "archived" && o.snapshots.length > 0)
    .sort((a, b) => {
      const aLast = a.snapshots[a.snapshots.length - 1]?.active_ads_count ?? 0;
      const bLast = b.snapshots[b.snapshots.length - 1]?.active_ads_count ?? 0;
      return bLast - aLast;
    })
    .slice(0, 2);

  // Active briefings
  const activeBriefings = briefings.filter((b) => b.status === "active" || b.status === "draft").slice(0, 4);

  // Stats
  const totalOffers = offers.filter((o) => o.status !== "archived").length;
  const totalAds = offers.reduce((sum, o) => {
    const last = o.snapshots[o.snapshots.length - 1]?.active_ads_count ?? 0;
    return sum + last;
  }, 0);
  const totalBriefings = briefings.length;
  const activeBriefingsCount = briefings.filter((b) => b.status === "active").length;

  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <LayoutApp>
      <div className="p-8 space-y-7">

          {/* ── Header ── */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[22px] font-light text-white leading-tight tracking-tight">
                Bem-vindo,{" "}
                <span className="italic text-[#FF6B00] font-light">Caio.</span>
              </h1>
              <p className="text-[13px] text-[#9B9BA5] mt-1.5">
                Veja o desempenho geral do seu monitoramento.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-white/[0.06] bg-[#0F0F11] text-[12px] text-[#9B9BA5]">
              <span className="text-[#6B6B76]">📅</span>
              {today}
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={<Eye size={20} strokeWidth={1.5} />} value={String(totalOffers)} label="Ofertas monitoradas" color="#FF6B00" />
            <StatCard icon={<TrendingUp size={20} strokeWidth={1.5} />} value={formatNumber(totalAds)} label="Anuncios ativos" color="#4ADE80" />
            <StatCard icon={<FileText size={20} strokeWidth={1.5} />} value={String(totalBriefings)} label="Briefings criados" color="#60A5FA" />
            <StatCard icon={<Sparkles size={20} strokeWidth={1.5} />} value={String(activeBriefingsCount)} label="Ofertas ativas" color="#C084FC" />
          </div>

          {/* ── Spy em Alta ── */}
          {topSpy.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Eye size={16} strokeWidth={1.5} className="text-[#FF6B00]" />
                  <div>
                    <h2 className="text-[15px] font-bold text-white">Spy em alta</h2>
                    <p className="text-[12px] text-[#9B9BA5] mt-0.5">Ofertas com mais anuncios ativos hoje</p>
                  </div>
                </div>
                <Link href="/spy" className="flex items-center gap-1.5 text-[12px] font-semibold text-[#FF6B00] hover:text-[#FF7A1A] transition-colors">
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
                  <FileText size={16} strokeWidth={1.5} className="text-[#FF6B00]" />
                  <div>
                    <h2 className="text-[15px] font-bold text-white">Suas ofertas ativas</h2>
                    <p className="text-[12px] text-[#9B9BA5] mt-0.5">Acompanhe o desempenho das suas ofertas</p>
                  </div>
                </div>
                <Link href="/offer-briefings" className="flex items-center gap-1.5 text-[12px] font-semibold text-[#FF6B00] hover:text-[#FF7A1A] transition-colors">
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

          {/* ── AI Studio Section ── */}
          <AIStudioSection generations={generations} loading={histLoading} />
      </div>
    </LayoutApp>
  );
}

/* ═══ Stat Card ═══ */

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-4 px-5 py-5 rounded-xl bg-[#0F0F11]"
      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border"
        style={{
          backgroundColor: `${color}15`,
          borderColor: `${color}22`,
          boxShadow: `0 0 20px ${color}18, inset 0 0 12px ${color}08`,
          color,
          filter: `drop-shadow(0 0 4px ${color}50)`,
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[24px] font-mono font-bold text-white leading-none">{value}</p>
        <p className="text-[11px] text-[#9B9BA5] mt-1.5">{label}</p>
      </div>
    </div>
  );
}

/* ═══ Spy Highlight Card ═══ */

function SpyHighlightCard({ offer, rank }: { offer: OfferWithSnapshots; rank: number }) {
  const snaps = offer.snapshots;
  const todayCount = snaps.length > 0 ? snaps[snaps.length - 1].active_ads_count : 0;
  const yesterdayCount = snaps.length > 1 ? snaps[snaps.length - 2].active_ads_count : 0;
  const delta = yesterdayCount > 0 ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100) : null;
  const color = tierColor(todayCount);

  const chartData = snaps.map((s) => ({
    label: formatChartDate(s.date),
    value: s.active_ads_count,
  }));

  return (
    <div className="rounded-xl p-5 bg-[#0F0F11]" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start gap-4">
        {/* Left: rank + info + count */}
        <div className="flex-shrink-0 space-y-4 min-w-[140px]">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[11px] font-mono font-bold text-[#9B9BA5]">
              {rank}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-white truncate">{offer.name}</p>
              <p className="text-[11px] text-[#9B9BA5] capitalize mt-0.5">{offer.niche}</p>
            </div>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-[0.15em] text-[#7C7C87] font-semibold">Anuncios ativos</p>
            <p className="text-[36px] font-mono font-bold leading-none mt-1" style={{ color }}>
              {formatNumber(todayCount)}
            </p>
            {delta !== null && (
              <p className="text-[11px] font-mono mt-1.5" style={{ color: delta >= 0 ? "#4ADE80" : "#F87171" }}>
                {delta >= 0 ? "+" : ""}{delta}% vs ontem
              </p>
            )}
          </div>

          <Link
            href="/spy"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color, backgroundColor: `${color}12`, border: `1px solid ${color}20` }}
          >
            Ver no Spy
            <ArrowRight size={11} strokeWidth={2} />
          </Link>
        </div>

        {/* Right: chart */}
        <div className="flex-1 min-w-0 flex flex-col">
          <p className="text-[9px] uppercase tracking-[0.15em] text-[#7C7C87] font-semibold mb-2">
            Variacao — Ultimos {snaps.length} dias
          </p>
          {chartData.length >= 2 ? (
            <MiniChart data={chartData} color={color} valueFontSize={10} labelFontSize={7.5} dotRadius={4.5} />
          ) : (
            <div className="h-20 flex items-center justify-center border border-dashed border-white/[0.06] rounded-lg">
              <span className="text-[11px] text-[#7C7C87]">Aguardando dados...</span>
            </div>
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
    emagrecimento: "#FF6B6B", "Emagrecimento": "#FF6B6B",
    "saude-masculina": "#60A5FA", "Saúde & Bem-estar": "#4ADE80",
    "renda-extra": "#34D399", "Renda Extra": "#34D399",
    beleza: "#C084FC", "Beleza & Estética": "#C084FC",
    relacionamento: "#F472B6",
  };
  const nicheColor = NICHE_COLORS[briefing.niche] ?? "#FF8A1F";

  return (
    <div
      className="rounded-xl p-4 cursor-pointer bg-[#0F0F11]"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "border-color 0.25s ease, background 0.25s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "#121214"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "#0F0F11"; }}
      onClick={() => router.push(`/offer-briefings/${briefing.id}`)}
    >
      {/* Top: icon + name + status */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${nicheColor}15`, boxShadow: `0 0 16px ${nicheColor}15` }}
        >
          <Flame size={16} strokeWidth={1.8} style={{ color: nicheColor, filter: `drop-shadow(0 0 3px ${nicheColor}60)` }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white truncate">{briefing.offer_name}</p>
          <p className="text-[11px] text-[#9B9BA5] mt-0.5">{briefing.niche}</p>
        </div>
        <span className="flex items-center gap-1 text-[9px] font-semibold text-[#4ADE80] px-2 py-0.5 rounded-full bg-[#4ADE80]/8 border border-[#4ADE80]/20 flex-shrink-0">
          <span className="w-1 h-1 rounded-full bg-[#4ADE80]" style={{ boxShadow: "0 0 4px #4ADE80" }} />
          Ativa
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.1em] text-[#7C7C87] font-semibold">Ticket</p>
          <p className="text-[14px] font-mono font-bold text-white mt-0.5">
            R$ {ticket.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.1em] text-[#7C7C87] font-semibold">Vendas</p>
          <p className="text-[14px] font-mono font-bold text-white mt-0.5">{sales}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.1em] text-[#7C7C87] font-semibold">Conversao</p>
          <p className="text-[14px] font-mono font-bold text-white mt-0.5">{sales > 0 ? "2,45%" : "—"}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7C7C87] hover:text-[#FF6B00] transition-colors">
          Ver detalhes
          <ArrowRight size={12} strokeWidth={2} />
        </span>
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm" style={{ animation: "fadeIn 200ms ease-out" }} onClick={onClose}>
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
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
    scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Zap size={16} strokeWidth={1.5} className="text-[#FF6B00]" />
          <div>
            <h2 className="text-[15px] font-bold text-white">AI Studio</h2>
            <p className="text-[12px] text-[#9B9BA5] mt-0.5">Geracao de conteudo com IA</p>
          </div>
        </div>
        <Link href="/forge" className="flex items-center gap-1.5 text-[12px] font-semibold text-[#FF6B00] hover:text-[#FF7A1A] transition-colors">
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
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#0F0F11] hover:bg-[#121214] transition-all group"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
            >
              <Icon size={15} strokeWidth={1.5} className="text-[#7C7C87] group-hover:text-[#FF6B00] transition-colors" />
              <div className="text-left">
                <p className="text-[11px] font-semibold text-white leading-tight">{s.label}</p>
                <p className="text-[9px] text-[#7C7C87] font-mono mt-0.5">{s.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Carousel */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-4 h-4 border-2 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin" />
        </div>
      ) : completed.length === 0 ? (
        <div className="rounded-xl bg-[#0F0F11] flex items-center justify-center py-10 gap-3" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <Sparkles size={16} strokeWidth={1.5} className="text-[#7C7C87]" />
          <p className="text-[11px] text-[#7C7C87]">Nenhuma geracao ainda — escolha um studio acima</p>
        </div>
      ) : (
        <div className="relative group/carousel">
          {completed.length > 4 && (
            <>
              <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-[#0F0F11] border border-white/[0.06] shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-[#1A1A1D]">
                <ChevronLeft size={14} strokeWidth={1.5} className="text-[#9B9BA5]" />
              </button>
              <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-8 h-8 rounded-full bg-[#0F0F11] border border-white/[0.06] shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-[#1A1A1D]">
                <ChevronRight size={14} strokeWidth={1.5} className="text-[#9B9BA5]" />
              </button>
            </>
          )}

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
            {completed.map((gen) => {
              const isVideo = gen.category === "video" || gen.category === "lipsync";
              const CatIcon = gen.category === "image" ? Image : gen.category === "video" ? Video : Mic;
              return (
                <button key={gen.id} onClick={() => setLightboxGen(gen)} className="flex-shrink-0 w-[200px] rounded-xl overflow-hidden bg-[#0F0F11] hover:bg-[#121214] transition-all group snap-start" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
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
                    <p className="text-[9px] font-mono text-[#7C7C87] mt-0.5 truncate">{gen.model_id}</p>
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
