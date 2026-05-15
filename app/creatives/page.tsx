"use client";

import { useRouter } from "next/navigation";
import LayoutApp from "@/app/layout-app";
import { useNiches } from "@/hooks/useNiches";

export default function CreativesPage() {
  const router = useRouter();
  const { niches, loading } = useNiches();

  return (
    <LayoutApp>
      <div className="p-6 space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-1">IA por Nicho</p>
          <h1 className="text-xl text-text-primary tracking-tight">Criativos</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-bg-3 border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {niches.map((niche) => (
              <button
                key={niche.id}
                onClick={() => router.push(`/creatives/${niche.id}`)}
                className="text-left p-5 rounded-lg border border-border bg-bg-3 hover:border-border-gold hover:bg-bg-4 transition-all group"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-xl">{niche.emoji}</span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ backgroundColor: `${niche.color}18`, color: niche.color }}
                  >
                    {niche.id}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary group-hover:text-gold transition-colors">
                  {niche.name}
                </h3>
                {niche.description && (
                  <p className="text-[11px] text-text-muted mt-1 line-clamp-2 leading-relaxed">
                    {niche.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </LayoutApp>
  );
}
