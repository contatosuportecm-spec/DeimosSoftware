"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LayoutApp from "@/app/layout-app";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { OfferBriefing } from "@/types";
import { Pencil, ArrowRight, Plus } from "lucide-react";

export default function VslStudioIndex() {
  const [briefings, setBriefings] = useState<OfferBriefing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/offer-briefings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBriefings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <LayoutApp>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">
            Knowledge System · Módulo 1
          </p>
          <h1 className="text-2xl font-display text-text-primary mb-1">VSL Studio</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
            Gere VSL nova a partir de um briefing, ou ausculte uma copy existente.
            Powered by 7 vozes lendárias + biblioteca de frameworks/mecanismos.
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">
            Selecione um briefing
          </p>
          <Link href="/offer-briefings/new">
            <button className="text-xs text-nova hover:text-nova-hover flex items-center gap-1">
              <Plus size={12} strokeWidth={1.5} /> Novo briefing
            </button>
          </Link>
        </div>

        {loading && <p className="text-xs text-text-muted">Carregando...</p>}

        {!loading && briefings.length === 0 && (
          <EmptyState
            title="Nenhum briefing ainda"
            description="Crie um briefing antes pra abrir o VSL Studio."
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {briefings.map((b) => (
            <Link key={b.id} href={`/vsl-studio/${b.id}`}>
              <Card padding="md" className="h-full hover:border-gold/30 cursor-pointer group transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <Pencil size={14} strokeWidth={1.5} className="text-gold" />
                  </div>
                  <ArrowRight
                    size={12}
                    strokeWidth={1.5}
                    className="text-text-muted group-hover:text-gold transition-colors mt-2"
                  />
                </div>
                <h3 className="text-sm font-medium text-text-primary mb-1 line-clamp-1">{b.offer_name}</h3>
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
                  {b.niche} {b.ticket ? `· R$ ${b.ticket}` : ""}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {b.promise ?? b.desire ?? b.new_opportunity ?? "Sem promessa definida"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </LayoutApp>
  );
}
