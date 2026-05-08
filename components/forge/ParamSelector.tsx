"use client";

import { cn } from "@/lib/utils";

interface ParamSelectorProps {
  label: string;
  options: (string | number)[];
  selected: string | number;
  onSelect: (value: string | number) => void;
}

export default function ParamSelector({ label, options, selected, onSelect }: ParamSelectorProps) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-semibold">{label}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {options.map((opt) => {
          const isActive = opt === selected;
          const display = typeof opt === "number" ? `${opt}s` : opt;

          return (
            <button
              type="button"
              key={String(opt)}
              onClick={() => onSelect(opt)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-medium transition-all border",
                isActive
                  ? "bg-gold/15 border-gold/30 text-gold"
                  : "bg-bg-3 border-transparent text-text-muted hover:text-text-secondary hover:border-border"
              )}
            >
              {display}
            </button>
          );
        })}
      </div>
    </div>
  );
}
