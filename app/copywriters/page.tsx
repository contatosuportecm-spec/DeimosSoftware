"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WikiPage } from "@/types";
import LayoutApp from "@/app/layout-app";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { Feather, ArrowRight, Plus } from "lucide-react";
import WikiPageEditor from "@/components/knowledge/WikiPageEditor";
import Button from "@/components/ui/Button";

export default function CopywritersPage() {
  const [voices, setVoices] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/wiki/pages?kind=voice")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setVoices(data);
        else setError(data?.error ?? "Erro ao carregar");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <LayoutApp>
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">
            Knowledge System · Módulo 5
          </p>
          <h1 className="text-2xl font-display text-text-primary mb-1">
            Copywriters Especialistas
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
            Vozes lendárias do direct response. Consulte qualquer um sobre sua oferta —
            eles respondem encarnando seu estilo, frameworks e princípios.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus size={12} strokeWidth={1.5} /> Nova voz
        </Button>
      </div>

      {creating && (
        <WikiPageEditor
          defaultKind="voice"
          onClose={() => setCreating(false)}
          onSaved={() => load()}
        />
      )}

      {loading && (
        <div className="text-xs text-text-muted">Carregando vozes...</div>
      )}

      {error && (
        <Card padding="md" className="border-danger/30 bg-danger/5">
          <p className="text-xs text-danger">Erro: {error}</p>
          <p className="text-[10px] text-text-muted mt-2">
            Verifique se as migrations 011 e 012 foram aplicadas no Supabase.
          </p>
        </Card>
      )}

      {!loading && !error && voices.length === 0 && (
        <EmptyState
          title="Nenhuma voz cadastrada ainda"
          description="Rode as migrations 011_knowledge_system.sql e 012_seed_copywriter_voices.sql no Supabase pra popular as 7 vozes seed."
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {voices.map((v) => {
          const structured = (v.structured ?? {}) as {
            era?: string;
            best_for?: string[];
            intensity?: string;
            formality?: string;
          };
          return (
            <Link key={v.id} href={`/copywriters/${v.slug}`} className="group">
              <Card
                padding="md"
                className="h-full hover:border-nova/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-nova/10 border border-nova/20 flex items-center justify-center">
                    <Feather size={16} strokeWidth={1.5} className="text-nova" />
                  </div>
                  <ArrowRight
                    size={14}
                    strokeWidth={1.5}
                    className="text-text-muted group-hover:text-nova transition-colors"
                  />
                </div>
                <h3 className="text-base font-medium text-text-primary mb-1">{v.title}</h3>
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mb-2">
                  {structured.era}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-2">
                  {v.summary}
                </p>
                {structured.best_for && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border-subtle">
                    {structured.best_for.slice(0, 3).map((b) => (
                      <span
                        key={b}
                        className="text-[9px] uppercase tracking-wider text-text-muted bg-bg-4 px-1.5 py-0.5 rounded"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
    </LayoutApp>
  );
}
