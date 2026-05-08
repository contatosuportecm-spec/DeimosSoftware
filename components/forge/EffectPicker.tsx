"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EffectPickerProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  label?: string;
}

export default function EffectPicker({ options, selected, onSelect, label = "Efeito" }: EffectPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="space-y-1.5">
      <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted/80 font-semibold">{label}</p>

      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-bg-3 border transition-colors text-xs",
            open ? "border-gold/40" : "border-border hover:border-border-strong",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={12} strokeWidth={1.5} className="text-gold flex-shrink-0" />
            <span className="text-text-primary truncate">{selected || "Selecionar"}</span>
          </div>
          <ChevronDown
            size={12}
            strokeWidth={1.5}
            className={cn("text-text-muted flex-shrink-0 transition-transform", open && "rotate-180")}
          />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-border bg-bg-2 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <Search size={11} strokeWidth={1.5} className="text-text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar efeito..."
                className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <span className="text-[9px] font-mono text-text-muted/60">
                {filtered.length}
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-[10px] text-text-muted">
                  Nenhum efeito encontrado
                </div>
              ) : (
                filtered.map((opt) => {
                  const isActive = opt === selected;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onSelect(opt);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors",
                        isActive
                          ? "bg-gold/10 text-gold"
                          : "text-text-secondary hover:bg-bg-3 hover:text-text-primary",
                      )}
                    >
                      <span className="truncate">{opt}</span>
                      {isActive && <Check size={11} strokeWidth={2} className="flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
