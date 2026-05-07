"use client";

import { useState } from "react";
import { Library, ArrowRight } from "lucide-react";
import { useNicheKeywords } from "@/hooks/useNicheKeywords";
import AdsLibraryModal from "./AdsLibraryModal";

export default function AdsLibraryModule() {
  const { groups, loading } = useNicheKeywords();
  const [open, setOpen] = useState(false);

  const totalKeywords = groups.reduce((sum, g) => sum + g.keywords.length, 0);
  const nicheCount = groups.filter((g) => g.niche !== null && g.keywords.length > 0).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative block glass-amber rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 w-full text-left"
      >
        {/* Halo */}
        <div
          className="absolute inset-0 opacity-50 transition-opacity duration-300 group-hover:opacity-90 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(244,196,48,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,138,31,0.10) 0%, transparent 60%)",
          }}
        />

        <div className="relative px-6 py-7 flex flex-col items-center text-center gap-3 min-h-[280px] justify-center">
          {/* Header pequeno */}
          <div className="flex items-center gap-2 text-text-muted">
            <Library size={12} strokeWidth={1.5} />
            <span className="text-[9px] uppercase tracking-[0.22em] font-semibold">
              Biblioteca · Meta Ads
            </span>
          </div>

          {/* Logo Meta */}
          <div className="my-3 flex flex-col items-center gap-2">
            <div
              className="w-[140px] h-[140px] rounded-2xl flex items-center justify-center border-2 overflow-hidden"
              style={{
                borderColor: "rgba(244,196,48,0.35)",
                background:
                  "linear-gradient(135deg, rgba(244,196,48,0.08) 0%, rgba(255,138,31,0.05) 100%)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/meta-logo.png"
                alt="Meta"
                className="w-[90px] h-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Meta Ads Library · keywords curadas
            </p>
          </div>

          <h3 className="text-[15px] font-semibold text-text-primary leading-tight">
            Biblioteca de Anúncios
          </h3>
          <p className="text-[11px] text-text-secondary max-w-[280px] leading-relaxed">
            Caça criativos por nicho na Meta Ads Library — keywords curadas em PT-BR e Inglês, prontas para abrir busca direta.
          </p>

          {!loading && totalKeywords > 0 && (
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
              <span className="font-mono text-text-secondary">{totalKeywords}</span> keywords ·{" "}
              <span className="font-mono text-text-secondary">{nicheCount}</span> nichos
            </p>
          )}

          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-amber font-medium uppercase tracking-[0.15em] group-hover:text-ember transition-colors">
            Selecionar nicho
            <ArrowRight size={11} strokeWidth={1.5} />
          </div>
        </div>
      </button>

      <AdsLibraryModal open={open} onClose={() => setOpen(false)} groups={groups} loading={loading} />
    </>
  );
}
