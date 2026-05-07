"use client";

import { useState } from "react";
import {
  Copy, Play, RotateCcw, Trash2, ExternalLink,
  Loader2, Check, ImageIcon, ShoppingCart, Zap,
} from "lucide-react";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onLaunch: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  automating: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:    { label: "Rascunho", color: "#6B6B73", bg: "rgba(107,107,115,0.08)", dot: "#6B6B73" },
  creating: { label: "Criando",  color: "#F4C430", bg: "rgba(244,196,48,0.10)", dot: "#F4C430" },
  active:   { label: "Ativo",    color: "#34D399", bg: "rgba(52,211,153,0.08)",  dot: "#34D399" },
  failed:   { label: "Falhou",   color: "#F87171", bg: "rgba(248,113,113,0.08)", dot: "#F87171" },
};

const PLATFORM_CONFIG: Record<string, { label: string; color: string }> = {
  perfectpay: { label: "PerfectPay", color: "#5B8CFF" },
  kirvano:    { label: "Kirvano",    color: "#818CF8" },
};

const FORMAT_LABELS: Record<string, string> = {
  ebook: "E-book",
  webapp: "WebApp",
  curso: "Curso",
  servico: "Servico",
};

export default function ProductCard({ product, onLaunch, onDelete, automating }: ProductCardProps) {
  const status = STATUS_CONFIG[product.status] ?? STATUS_CONFIG.draft;
  const platformCfg = PLATFORM_CONFIG[product.platform] ?? { label: product.platform, color: "#A1A1AA" };
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    if (product.checkout_url) {
      navigator.clipboard.writeText(product.checkout_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const hasExtras = product.bump_name || product.upsell_name;

  return (
    <div className={cn(
      "group rounded-xl border bg-bg-3 overflow-hidden transition-all duration-200",
      product.status === "active"
        ? "border-success/20 hover:border-success/40"
        : "border-border hover:border-border-strong"
    )}>
      {/* ── Image / Visual Header ── */}
      <div className="relative h-32 bg-gradient-to-br from-bg-4 to-bg-3 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-30">
            <ImageIcon size={28} strokeWidth={1} className="text-text-muted" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted">Sem imagem</span>
          </div>
        )}

        {/* Status pill overlay */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              "flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full backdrop-blur-md",
              product.status === "creating" && "animate-pulse"
            )}
            style={{
              color: status.color,
              backgroundColor: `${status.bg.replace("0.08", "0.85")}`,
              border: `1px solid ${status.color}22`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: status.dot }}
            />
            {status.label}
          </span>
        </div>

        {/* Platform badge overlay */}
        <div className="absolute top-3 right-3">
          <span
            className="text-[9px] font-medium px-2 py-1 rounded-full backdrop-blur-md uppercase tracking-[0.1em]"
            style={{
              color: platformCfg.color,
              backgroundColor: `rgba(0,0,0,0.6)`,
              border: `1px solid ${platformCfg.color}33`,
            }}
          >
            {platformCfg.label}
          </span>
        </div>

        {/* Price overlay */}
        <div className="absolute bottom-3 right-3">
          <span className="font-mono text-sm font-semibold text-white px-2.5 py-1 rounded-lg backdrop-blur-md bg-black/50 border border-white/10">
            R$ {Number(product.price).toFixed(2)}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex flex-col gap-2.5">
        {/* Title + format */}
        <div>
          <h3 className="text-[13px] font-semibold text-text-primary leading-tight truncate">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-text-muted uppercase tracking-[0.12em]">
              {FORMAT_LABELS[product.format] ?? product.format}
            </span>
            {product.guarantee_days > 0 && (
              <>
                <span className="text-text-muted/30">|</span>
                <span className="text-[10px] text-text-muted font-mono">
                  {product.guarantee_days}d garantia
                </span>
              </>
            )}
            {product.pixel_id && (
              <>
                <span className="text-text-muted/30">|</span>
                <span className="text-[10px] text-text-muted">
                  Pixel
                </span>
              </>
            )}
          </div>
        </div>

        {product.description && (
          <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Extras tags */}
        {hasExtras && (
          <div className="flex items-center gap-1.5">
            {product.bump_name && (
              <span className="flex items-center gap-1 text-[10px] text-gold/70 bg-gold/5 border border-gold/10 rounded px-2 py-0.5">
                <ShoppingCart size={9} strokeWidth={1.5} />
                Bump
              </span>
            )}
            {product.upsell_name && (
              <span className="flex items-center gap-1 text-[10px] text-nova/70 bg-nova/5 border border-nova/10 rounded px-2 py-0.5">
                <Zap size={9} strokeWidth={1.5} />
                Upsell
              </span>
            )}
          </div>
        )}

        {/* Installments */}
        {product.installment_price && product.max_installments && (
          <p className="text-[10px] text-text-muted font-mono">
            ou {product.max_installments}x de R$ {Number(product.installment_price).toFixed(2)}
          </p>
        )}

        {/* Checkout URL */}
        {product.checkout_url && (
          <div className="flex items-center gap-1.5 bg-success/5 border border-success/10 rounded-lg px-3 py-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
            <span className="text-[10px] text-success/80 truncate flex-1 font-mono">
              {product.checkout_url}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1 text-success/50 hover:text-success transition-colors flex-shrink-0"
              title="Copiar link"
            >
              {copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.5} />}
            </button>
            <a
              href={product.checkout_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-success/50 hover:text-success transition-colors flex-shrink-0"
              title="Abrir checkout"
            >
              <ExternalLink size={12} strokeWidth={1.5} />
            </a>
          </div>
        )}

        {/* Error message */}
        {product.status === "failed" && product.error_message && (
          <p className="text-[11px] text-danger bg-danger/5 border border-danger/15 rounded-lg px-3 py-2">
            {product.error_message}
          </p>
        )}

        {/* ── Footer actions ── */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-white/[0.04]">
          <span className="text-[10px] text-text-muted/60">
            {formatRelativeDate(product.created_at)}
          </span>

          <div className="flex items-center gap-1">
            {(product.status === "draft" || product.status === "failed") && (
              <button
                onClick={() => onLaunch(product.id)}
                disabled={automating}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all disabled:opacity-30",
                  product.status === "draft"
                    ? "text-gold bg-gold/8 hover:bg-gold/15 border border-gold/15"
                    : "text-gold bg-gold/8 hover:bg-gold/15 border border-gold/15"
                )}
              >
                {automating ? (
                  <Loader2 size={11} strokeWidth={1.5} className="animate-spin" />
                ) : product.status === "draft" ? (
                  <Play size={11} strokeWidth={1.5} />
                ) : (
                  <RotateCcw size={11} strokeWidth={1.5} />
                )}
                {product.status === "draft" ? "Publicar" : "Retry"}
              </button>
            )}

            <button
              onClick={() => onDelete(product.id)}
              className="p-1.5 rounded-lg text-text-muted/40 hover:text-danger hover:bg-danger/8 transition-all opacity-0 group-hover:opacity-100"
              title="Deletar"
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
