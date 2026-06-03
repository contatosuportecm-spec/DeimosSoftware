"use client";

import { useRef, useState, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";
import { OfferTag } from "@/types";
import { cn } from "@/lib/utils";
import { TAG_META, TAG_ORDER } from "./tagMeta";

interface TagControlProps {
  tag: OfferTag | null;
  onChange: (tag: OfferTag | null) => void;
  /** "sm" = pill compacta (grid card) · "md" = pill maior (hero) */
  size?: "sm" | "md";
}

export default function TagControl({ tag, onChange, size = "sm" }: TagControlProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function pick(next: OfferTag | null) {
    onChange(next);
    setOpen(false);
  }

  const meta = tag ? TAG_META[tag] : null;
  const iconSize = size === "md" ? 13 : 11;
  const padding = size === "md" ? "px-2.5 py-1" : "px-2 py-[3px]";
  const textSize = size === "md" ? "text-[11px]" : "text-[10px]";

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {meta ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          title="Alterar tag"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all",
            padding,
            textSize,
          )}
          style={{
            color: meta.color,
            backgroundColor: `${meta.color}1A`,
            borderColor: `${meta.color}40`,
          }}
        >
          <meta.icon size={iconSize} strokeWidth={1.5} />
          {meta.label}
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          title="Adicionar tag"
          aria-label="Adicionar tag"
          className={cn(
            "inline-flex items-center justify-center rounded-full border border-dashed border-white/15 text-text-muted/60",
            "hover:text-text-secondary hover:border-white/30 hover:bg-white/[0.04] transition-all",
            "opacity-50 group-hover:opacity-100",
            size === "md" ? "w-7 h-7" : "w-[22px] h-[22px]",
          )}
        >
          <Plus size={size === "md" ? 14 : 12} strokeWidth={1.5} />
        </button>
      )}

      {open && (
        <div className="absolute top-full right-0 mt-1.5 z-50 w-44 rounded-xl border border-border-strong bg-bg-2 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          <p className="px-2 pt-1 pb-1.5 text-[9px] uppercase tracking-[0.18em] text-text-muted/70">
            Tag da oferta
          </p>
          {TAG_ORDER.map((key) => {
            const m = TAG_META[key];
            const active = tag === key;
            const Icon = m.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pick(active ? null : key);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] transition-colors",
                  active ? "bg-white/[0.06]" : "hover:bg-white/[0.04]",
                )}
                style={{ color: active ? m.color : undefined }}
              >
                <Icon size={13} strokeWidth={1.5} style={{ color: m.color }} />
                <span className={cn(!active && "text-text-secondary")}>{m.label}</span>
                {active && <Check size={13} strokeWidth={2} className="ml-auto" style={{ color: m.color }} />}
              </button>
            );
          })}
          {tag && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                pick(null);
              }}
              className="mt-1 w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] text-text-muted hover:text-danger hover:bg-danger/5 transition-colors border-t border-white/[0.05] pt-2"
            >
              <X size={13} strokeWidth={1.5} />
              Remover tag
            </button>
          )}
        </div>
      )}
    </div>
  );
}
