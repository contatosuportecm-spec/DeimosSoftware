"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LayoutApp from "@/app/layout-app";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { WikiPage } from "@/types";
import { UserCircle, ArrowRight, Plus } from "lucide-react";
import WikiPageEditor from "@/components/knowledge/WikiPageEditor";
import Button from "@/components/ui/Button";

export default function AvatarIndex() {
  const [avatars, setAvatars] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/wiki/pages?kind=avatar")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setAvatars(d))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <LayoutApp>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">
              Knowledge System · Módulo 3
            </p>
            <h1 className="text-2xl font-display text-text-primary mb-1">Avatar Vivo</h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
              Persona conversável. Pergunte como o avatar real responderia. Teste headlines/copy e veja a reação simulada.
              Evolui com cada briefing/destilação no nicho.
            </p>
          </div>
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus size={12} strokeWidth={1.5} /> Novo avatar
          </Button>
        </div>

        {creating && (
          <WikiPageEditor
            defaultKind="avatar"
            onClose={() => setCreating(false)}
            onSaved={() => load()}
          />
        )}

        {loading && <p className="text-xs text-text-muted">Carregando...</p>}

        {!loading && avatars.length === 0 && (
          <EmptyState
            title="Nenhum avatar cadastrado"
            description="Aplique a migration 014_seed_avatar.sql pra ter o primeiro avatar (Mulher 40+ Emagrecimento)."
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {avatars.map((a) => {
            const s = (a.structured ?? {}) as { age_range?: [number, number]; gender?: string; consciousness_predominant?: number };
            return (
              <Link key={a.id} href={`/avatar/${a.slug}`}>
                <Card padding="md" className="h-full hover:border-ai-blue/30 cursor-pointer group transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center">
                      <UserCircle size={16} strokeWidth={1.5} className="text-ai-blue" />
                    </div>
                    <ArrowRight size={12} strokeWidth={1.5} className="text-text-muted group-hover:text-ai-blue transition-colors mt-1.5" />
                  </div>
                  <h3 className="text-base font-medium text-text-primary mb-1">{a.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">
                    {a.summary}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border-subtle">
                    {s.age_range && (
                      <span className="text-[9px] uppercase tracking-wider text-text-muted bg-bg-4 px-1.5 py-0.5 rounded">
                        {s.age_range[0]}-{s.age_range[1]} anos
                      </span>
                    )}
                    {s.consciousness_predominant && (
                      <span className="text-[9px] uppercase tracking-wider text-text-muted bg-bg-4 px-1.5 py-0.5 rounded">
                        Nv {s.consciousness_predominant} Schwartz
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </LayoutApp>
  );
}
