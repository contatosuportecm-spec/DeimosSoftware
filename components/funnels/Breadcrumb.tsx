"use client";

import { ArrowLeft, ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  id: string | null;
  label: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (nodeId: string | null) => void;
}

export default function FunnelBreadcrumb({ items, onNavigate }: BreadcrumbProps) {
  // The "back" target is the second-to-last item (one level up)
  const backTarget = items.length >= 2 ? items[items.length - 2] : null;

  return (
    <div className="flex items-center gap-2">
      {/* Back arrow — goes one level up */}
      {backTarget && (
        <button
          onClick={() => onNavigate(backTarget.id)}
          className="w-8 h-8 rounded-lg bg-nova/10 border border-nova/20 flex items-center justify-center text-nova hover:bg-nova/20 hover:border-nova/30 transition-colors flex-shrink-0"
          title="Voltar um nivel"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
      )}

      {/* Path */}
      <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <div key={item.id ?? "root"} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight size={11} strokeWidth={1.5} className="text-[#4a4a5a] flex-shrink-0" />}
              <button
                onClick={() => !isLast && onNavigate(item.id)}
                disabled={isLast}
                className={cn(
                  "truncate max-w-[180px] transition-colors text-[13px]",
                  isLast
                    ? "text-white font-semibold cursor-default"
                    : "text-[#6a6a7a] hover:text-[#a0a0b0]"
                )}
              >
                {i === 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Home size={11} strokeWidth={1.5} />
                    {item.label}
                  </span>
                ) : (
                  item.label
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
