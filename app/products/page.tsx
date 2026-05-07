"use client";

import { useState } from "react";
import { Plus, RefreshCw, Package, ShoppingCart, Zap, AlertCircle } from "lucide-react";
import LayoutApp from "@/app/layout-app";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import CreateProductModal from "@/components/products/CreateProductModal";
import ProductCard from "@/components/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

// ═══ Filtros ═══

type FilterKey = "all" | "draft" | "active" | "failed" | "creating";

const FILTERS: { key: FilterKey; label: string; color?: string }[] = [
  { key: "all",      label: "Todos" },
  { key: "active",   label: "Ativos",    color: "#34D399" },
  { key: "draft",    label: "Rascunho",  color: "#6B6B73" },
  { key: "creating", label: "Criando",   color: "#F4C430" },
  { key: "failed",   label: "Falhou",    color: "#F87171" },
];

function applyFilter(products: Product[], key: FilterKey): Product[] {
  if (key === "all") return products;
  return products.filter((p) => p.status === key);
}

// ═══ Page ═══

export default function ProductsPage() {
  const hook = useProducts();

  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter]       = useState<FilterKey>("all");

  const { products, loading, error, automatingId } = hook;

  const visible = applyFilter(products, filter);

  const countFor = (k: FilterKey) =>
    k === "all" ? products.length : applyFilter(products, k).length;

  const stats = {
    total:    products.length,
    active:   products.filter((p) => p.status === "active").length,
    revenue:  products.filter((p) => p.status === "active").reduce((sum, p) => sum + Number(p.price), 0),
    failed:   products.filter((p) => p.status === "failed").length,
  };

  const handleLaunch = hook.launchAutomation;
  const handleDelete = hook.deleteProduct;

  return (
    <LayoutApp>
      <div className="flex flex-col h-full">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bg-3 border border-border flex items-center justify-center">
              <Package size={14} strokeWidth={1.5} className="text-gold" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted leading-none mb-1">
                Automacao
              </p>
              <h1 className="text-sm font-semibold text-text-primary leading-none">
                Produtos
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={hook.refetch}
              className="p-2 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-3 transition-colors"
              title="Atualizar"
            >
              <RefreshCw size={13} strokeWidth={1.5} />
            </button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={13} strokeWidth={2} />
              Novo produto
            </Button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-border flex-shrink-0">
          <StatMini
            label="Total"
            value={String(stats.total)}
            icon={<Package size={13} strokeWidth={1.5} />}
            color="#A1A1AA"
          />
          <StatMini
            label="Ativos"
            value={String(stats.active)}
            icon={<Zap size={13} strokeWidth={1.5} />}
            color="#34D399"
          />
          <StatMini
            label="Receita catalogo"
            value={`R$ ${stats.revenue.toFixed(0)}`}
            icon={<ShoppingCart size={13} strokeWidth={1.5} />}
            color="#F4C430"
            mono
          />
          <StatMini
            label="Falhas"
            value={String(stats.failed)}
            icon={<AlertCircle size={13} strokeWidth={1.5} />}
            color={stats.failed > 0 ? "#F87171" : "#6B6B73"}
          />
        </div>

        {/* ── Filtros ── */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-border flex-shrink-0">
          {FILTERS.map((f) => {
            const count    = countFor(f.key);
            const isActive = filter === f.key;

            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                  isActive
                    ? "bg-bg-3 text-text-primary"
                    : "text-text-muted hover:text-text-secondary hover:bg-bg-3/40"
                )}
              >
                {f.color && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: f.color, opacity: isActive ? 1 : 0.5 }}
                  />
                )}
                {f.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "font-mono text-[10px] px-1.5 py-px rounded",
                      isActive
                        ? "bg-bg-4 text-text-secondary"
                        : "text-text-muted"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Conteudo ── */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
              <p className="text-xs text-danger">{error}</p>
            </div>
          ) : visible.length === 0 && filter !== "all" ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2">
              <p className="text-sm text-text-muted">Nenhum produto nessa categoria.</p>
              <button
                onClick={() => setFilter("all")}
                className="text-xs text-gold hover:text-gold-hover transition-colors"
              >
                Ver todos
              </button>
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title="Nenhum produto cadastrado"
              description="Crie um produto e automatize o cadastro na PerfectPay ou Kirvano com um clique."
              action={{ label: "Criar primeiro produto", onClick: () => setModalOpen(true) }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onLaunch={handleLaunch}
                  onDelete={handleDelete}
                  automating={automatingId === product.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={async (input) => { await hook.createProduct(input); }}
      />
    </LayoutApp>
  );
}

// ═══ Components ═══

function StatMini({
  label,
  value,
  icon,
  color,
  mono,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-3/50 border border-white/[0.04]">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}12`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn(
          "text-sm font-semibold text-text-primary leading-none",
          mono && "font-mono"
        )}>
          {value}
        </p>
        <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted mt-1 leading-none">
          {label}
        </p>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-bg-3 border border-border animate-pulse overflow-hidden"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-32 bg-bg-4" />
          <div className="p-4 space-y-3">
            <div className="h-3.5 bg-bg-4 rounded w-3/4" />
            <div className="h-2.5 bg-bg-4 rounded w-1/2" />
            <div className="h-8 bg-bg-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
