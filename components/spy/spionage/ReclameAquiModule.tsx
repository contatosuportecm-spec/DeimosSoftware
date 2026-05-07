"use client";

import { useState } from "react";
import { ShieldAlert, ArrowRight } from "lucide-react";
import ReclameAquiGatewayModal from "./ReclameAquiGatewayModal";
import { RECLAME_AQUI_GATEWAYS } from "@/lib/gateways";

export default function ReclameAquiModule() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative block glass-nova rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 w-full text-left"
      >
        <div
          className="absolute inset-0 opacity-50 transition-opacity duration-300 group-hover:opacity-90 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 70% 20%, rgba(255,138,31,0.18) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(244,196,48,0.10) 0%, transparent 60%)",
          }}
        />

        <div className="relative px-6 py-7 flex flex-col items-center text-center gap-3 min-h-[280px] justify-center">
          <div className="flex items-center gap-2 text-text-muted">
            <ShieldAlert size={12} strokeWidth={1.5} />
            <span className="text-[9px] uppercase tracking-[0.22em] font-semibold">Reclame Aqui · Gateway Health</span>
          </div>

          {/* Logo Reclame Aqui */}
          <div className="my-3 flex flex-col items-center gap-2">
            <div
              className="w-[140px] h-[140px] rounded-2xl flex items-center justify-center border-2 overflow-hidden bg-white"
              style={{
                borderColor: "rgba(255,138,31,0.35)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/reclameaqui-logo.png"
                alt="Reclame Aqui"
                className="w-[110px] h-auto object-contain opacity-95 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
              <span className="font-mono text-text-secondary">{RECLAME_AQUI_GATEWAYS.length}</span> gateways monitorados
            </p>
          </div>

          <h3 className="text-[15px] font-semibold text-text-primary leading-tight">
            Saúde dos Gateways
          </h3>
          <p className="text-[11px] text-text-secondary max-w-[280px] leading-relaxed">
            Abre Reclame Aqui de cada checkout (Kirvano, Kiwify, Hotmart...) — leitura rápida sobre bloqueios e fraudes em rota.
          </p>

          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-ember font-medium uppercase tracking-[0.15em] group-hover:text-amber transition-colors">
            Ver gateways
            <ArrowRight size={11} strokeWidth={1.5} />
          </div>
        </div>
      </button>

      <ReclameAquiGatewayModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
