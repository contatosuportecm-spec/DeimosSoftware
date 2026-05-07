"use client";

import { ExternalLink, ScanSearch } from "lucide-react";

const URLSCAN_URL = "https://urlscan.io/search/#cdn.utmify.com.br";

export default function UrlscanModule() {
  return (
    <a
      href={URLSCAN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block glass-amber rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Halo de fundo */}
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
          <ScanSearch size={12} strokeWidth={1.5} />
          <span className="text-[9px] uppercase tracking-[0.22em] font-semibold">URLScan · CDN Trace</span>
        </div>

        {/* Logo Utmify */}
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
              src="/utmify-logo.png"
              alt="Utmify"
              className="w-[90px] h-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
            Páginas servidas via cdn.utmify.com.br
          </p>
        </div>

        <h3 className="text-[15px] font-semibold text-text-primary leading-tight">
          Caçar Ofertas no URLScan
        </h3>
        <p className="text-[11px] text-text-secondary max-w-[280px] leading-relaxed">
          Lista todos os domínios e páginas que carregaram o pixel da Utmify recentemente — fonte direta de ofertas em produção.
        </p>

        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-amber font-medium uppercase tracking-[0.15em] group-hover:text-ember transition-colors">
          Abrir URLScan
          <ExternalLink size={11} strokeWidth={1.5} />
        </div>
      </div>
    </a>
  );
}
