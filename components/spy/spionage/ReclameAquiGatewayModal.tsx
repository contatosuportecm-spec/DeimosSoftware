"use client";

import { ExternalLink } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { RECLAME_AQUI_GATEWAYS, reclameAquiUrl } from "@/lib/gateways";

interface ReclameAquiGatewayModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ReclameAquiGatewayModal({ open, onClose }: ReclameAquiGatewayModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Reclame Aqui — Gateways">
      <p className="text-[11px] text-text-muted mb-4 leading-relaxed">
        Verifique a saúde de cada gateway e identifique reclamações recorrentes que podem indicar bloqueios, bugs ou fraudes em curso.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {RECLAME_AQUI_GATEWAYS.map((g) => (
          <a
            key={g.slug}
            href={reclameAquiUrl(g.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-bg-4/40 hover:border-amber/40 hover:bg-amber/5 transition-all"
          >
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center font-mono text-base font-bold border overflow-hidden"
              style={{
                color: g.color,
                backgroundColor: g.logo ? "#FFFFFF" : `${g.color}1F`,
                borderColor: `${g.color}55`,
              }}
            >
              {g.logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={g.logo}
                  alt={g.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                g.initials
              )}
            </div>
            <span className="text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">
              {g.name}
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.15em] text-text-muted group-hover:text-amber transition-colors">
              Abrir
              <ExternalLink size={9} strokeWidth={1.5} />
            </span>
          </a>
        ))}
      </div>

      <p className="text-[10px] text-text-muted/60 mt-4 text-center">
        Lista expansível. Para adicionar/remover gateways, edite <span className="font-mono">lib/gateways.ts</span>.
      </p>
    </Modal>
  );
}
