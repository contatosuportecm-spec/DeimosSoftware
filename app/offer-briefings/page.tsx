"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, RefreshCw, FileText, ShoppingCart, Zap,
  DollarSign, Search, ChevronDown,
} from "lucide-react";
import LayoutApp from "@/app/layout-app";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import OfferBriefingCard from "@/components/offer-briefings/OfferBriefingCard";
import { useOfferBriefings } from "@/hooks/useOfferBriefings";
import { OfferBriefing, OfferBriefingStatus } from "@/types";
import { cn } from "@/lib/utils";

// ═══ Filtros ═══

type FilterKey = "all" | OfferBriefingStatus;

const FILTERS: { key: FilterKey; label: string; color?: string }[] = [
  { key: "all",      label: "Todas" },
  { key: "active",   label: "Ativas",     color: "#34D399" },
  { key: "paused",   label: "Pausadas",   color: "#FB923C" },
  { key: "draft",    label: "Rascunho",   color: "#71717A" },
  { key: "archived", label: "Arquivadas", color: "#52525B" },
];

function applyFilter(briefings: OfferBriefing[], key: FilterKey): OfferBriefing[] {
  if (key === "all") return briefings;
  return briefings.filter((b) => b.status === key);
}

// ═══ Page ═══

export default function OfferBriefingsPage() {
  const router = useRouter();
  const hook = useOfferBriefings();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const { briefings, loading, error, stats } = hook;

  // Unique niches for dropdown
  const niches = useMemo(() => {
    const set = new Set(briefings.map((b) => b.niche));
    return Array.from(set).sort();
  }, [briefings]);

  // Apply all filters
  const visible = useMemo(() => {
    let result = applyFilter(briefings, filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        b.offer_name.toLowerCase().includes(q) ||
        b.niche.toLowerCase().includes(q) ||
        b.promise?.toLowerCase().includes(q)
      );
    }

    if (nicheFilter !== "all") {
      result = result.filter((b) => b.niche === nicheFilter);
    }

    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.offer_name.localeCompare(b.offer_name));
    } else if (sortBy === "sales") {
      result = [...result].sort((a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0));
    } else if (sortBy === "revenue") {
      result = [...result].sort((a, b) => Number(b.revenue ?? 0) - Number(a.revenue ?? 0));
    }
    // "recent" is default order from API

    return result;
  }, [briefings, filter, search, nicheFilter, sortBy]);

  const countFor = (k: FilterKey) =>
    k === "all" ? briefings.length : applyFilter(briefings, k).length;

  return (
    <LayoutApp>
      <div className="flex flex-col h-full">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 pt-7 pb-6 flex-shrink-0">
          <div>
            <h1 className="text-xl text-text-primary tracking-tight">
              Ofertas
            </h1>
            <p className="text-[13px] text-text-secondary mt-1">
              Acompanhe o desempenho das suas ofertas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={hook.refetch}
              className="w-9 h-9 rounded-xl border border-white/[0.06] bg-bg-3 flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-white/[0.12] transition-all"
              title="Atualizar"
            >
              <RefreshCw size={14} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => router.push("/offer-briefings/new")}
              className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold tracking-wide text-black bg-nova hover:bg-nova/90 active:scale-[0.96] transition-all duration-300 shadow-[0_4px_20px_rgba(255,138,31,0.25)] hover:shadow-[0_8px_32px_rgba(255,138,31,0.4)]"
            >
              <Plus size={14} strokeWidth={2.5} className="group-hover/btn:rotate-90 transition-transform duration-300" />
              Nova Oferta
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-4 px-8 pb-6 flex-shrink-0">
          <StatCard
            icon={<FileText size={20} strokeWidth={1.5} />}
            value={String(stats.total)}
            label="Ofertas totais"
            color="#FF8A1F"
          />
          <StatCard
            icon={<Zap size={20} strokeWidth={1.5} />}
            value={String(stats.active)}
            label="Ativas"
            color="#4ADE80"
          />
          <StatCard
            icon={<ShoppingCart size={20} strokeWidth={1.5} />}
            value={stats.totalSales.toLocaleString("pt-BR")}
            label="Vendas totais"
            color="#4ADE80"
          />
          <StatCard
            icon={<DollarSign size={20} strokeWidth={1.5} />}
            value={`R$ ${stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            label="Receita total"
            color="#4ADE80"
          />
        </div>

        {/* ── Filters + Search Bar ── */}
        <div className="flex items-center justify-between px-8 pb-5 flex-shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-0.5">
            {FILTERS.map((f) => {
              const count    = countFor(f.key);
              const isActive = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/[0.06] text-[#FAFAFA]"
                      : "text-text-secondary hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                  )}
                >
                  {f.color && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: f.color, opacity: isActive ? 1 : 0.5 }}
                    />
                  )}
                  {f.label}
                  <span className={cn(
                    "font-mono text-[11px] ml-0.5",
                    isActive ? "text-[#A1A1AA]" : "text-[#6B6B76]"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + dropdowns */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B76]" />
              <input
                type="text"
                placeholder="Buscar ofertas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 h-9 pl-9 pr-3 rounded-lg border border-white/[0.06] bg-[#111113] text-[12px] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-[#D4A54A]/30 focus:ring-1 focus:ring-[#D4A54A]/10 transition-all"
              />
            </div>

            {/* Nicho dropdown */}
            <div className="relative">
              <select
                value={nicheFilter}
                onChange={(e) => setNicheFilter(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 rounded-lg border border-white/[0.06] bg-[#111113] text-[12px] text-[#A1A1AA] focus:outline-none focus:border-[#D4A54A]/30 cursor-pointer"
              >
                <option value="all">Nicho</option>
                {niches.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6B76] pointer-events-none" />
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 rounded-lg border border-white/[0.06] bg-[#111113] text-[12px] text-[#A1A1AA] focus:outline-none focus:border-[#D4A54A]/30 cursor-pointer"
              >
                <option value="recent">Ordenar</option>
                <option value="name">Nome</option>
                <option value="sales">Vendas</option>
                <option value="revenue">Receita</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6B76] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-auto px-8 pb-8">
          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <div className="rounded-xl border border-[#F87171]/20 bg-[#F87171]/5 p-4">
              <p className="text-xs text-[#F87171]">{error}</p>
            </div>
          ) : visible.length === 0 && (filter !== "all" || search || nicheFilter !== "all") ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2">
              <p className="text-sm text-text-secondary">Nenhuma oferta encontrada.</p>
              <button
                onClick={() => { setFilter("all"); setSearch(""); setNicheFilter("all"); }}
                className="text-xs text-[#D4A54A] hover:text-[#e5b84e] transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title="Nenhuma oferta cadastrada"
              description="Crie um briefing estruturado para organizar suas ofertas e ter tudo em um só lugar."
              action={{ label: "Criar primeira oferta", onClick: () => router.push("/offer-briefings/new") }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((briefing) => (
                <OfferBriefingCard
                  key={briefing.id}
                  briefing={briefing}
                  onView={(b) => router.push(`/offer-briefings/${b.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutApp>
  );
}

// ═══ Stat Card ═══

function StatCard({ icon, value, label, color }: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-5 rounded-xl border border-white/[0.06] bg-bg-3">
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
      <div className="min-w-0">
        <p className="text-[24px] font-mono font-bold text-white leading-none tracking-tight">
          {value}
        </p>
        <p className="text-[11px] text-text-secondary mt-1.5 leading-none">
          {label}
        </p>
      </div>
    </div>
  );
}

// ═══ Skeleton ═══

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-[#111113] border border-white/[0.06] animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/[0.04] rounded w-3/4" />
                <div className="h-3 bg-white/[0.04] rounded w-1/3" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-2.5 bg-white/[0.04] rounded w-10 ml-auto" />
                <div className="h-5 bg-white/[0.04] rounded w-16" />
              </div>
            </div>
            <div className="pl-[52px] space-y-3">
              <div className="h-3 bg-white/[0.04] rounded w-full" />
              <div className="flex gap-8">
                <div className="space-y-1.5">
                  <div className="h-2.5 bg-white/[0.04] rounded w-12" />
                  <div className="h-5 bg-white/[0.04] rounded w-10" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 bg-white/[0.04] rounded w-16" />
                  <div className="h-4 bg-white/[0.04] rounded w-12" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
