"use client";

import { Eye, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

export type SpyTab = "ofertas" | "espionagem";

interface SpyTabsProps {
  active: SpyTab;
  onChange: (tab: SpyTab) => void;
  ofertasCount?: number;
}

const TABS: { id: SpyTab; label: string; sub: string; Icon: typeof Eye }[] = [
  { id: "ofertas",    label: "Ofertas",    sub: "Inteligência sobre ofertas em monitoramento", Icon: Eye },
  { id: "espionagem", label: "Espionagem", sub: "Caça de novas ofertas e gateways",            Icon: Crosshair },
];

export default function SpyTabs({ active, onChange, ofertasCount }: SpyTabsProps) {
  return (
    <div className="flex items-stretch gap-2 px-6 pt-4 pb-3 border-b border-border flex-shrink-0">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "group relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 text-left",
              isActive
                ? "bg-amber/10 border border-amber/30"
                : "bg-bg-3/40 border border-border hover:border-border-strong"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                isActive ? "bg-amber/15 text-amber" : "bg-bg-4 text-text-muted group-hover:text-text-secondary"
              )}
            >
              <tab.Icon size={13} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 leading-none">
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.18em]",
                    isActive ? "text-amber" : "text-text-secondary"
                  )}
                >
                  {tab.label}
                </span>
                {tab.id === "ofertas" && typeof ofertasCount === "number" && ofertasCount > 0 && (
                  <span
                    className={cn(
                      "font-mono text-[10px] px-1.5 py-px rounded",
                      isActive ? "bg-amber/15 text-amber" : "bg-bg-4 text-text-muted"
                    )}
                  >
                    {ofertasCount}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-none">{tab.sub}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
