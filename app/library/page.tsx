"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LayoutApp from "@/app/layout-app";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { WikiPage, WikiPageKind } from "@/types";
import {
  Beaker, Layers, Sparkles, ShieldCheck, BookOpen, Filter, ArrowRight, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import WikiPageEditor from "@/components/knowledge/WikiPageEditor";
import Button from "@/components/ui/Button";

type TabKey = "mechanism" | "framework" | "pattern" | "claims" | "concept";

const TABS: { key: TabKey; label: string; icon: typeof Beaker; kinds: WikiPageKind[] }[] = [
  { key: "mechanism", label: "Mecanismos",  icon: Beaker,      kinds: ["mechanism"] },
  { key: "framework", label: "Frameworks",  icon: Layers,      kinds: ["framework"] },
  { key: "pattern",   label: "Padrões",     icon: Sparkles,    kinds: ["pattern"] },
  { key: "claims",    label: "Compliance",  icon: ShieldCheck, kinds: ["claims"] },
  { key: "concept",   label: "Conceitos",   icon: BookOpen,    kinds: ["concept"] },
];

const NICHES = ["todos", "emagrecimento", "saude-masculina", "renda-extra", "beleza", "relacionamento", "geral"];

export default function LibraryPage() {
  const [tab, setTab] = useState<TabKey>("mechanism");
  const [niche, setNiche] = useState<string>("todos");
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/wiki/pages?limit=200")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPages(data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const currentTab = TABS.find((t) => t.key === tab)!;

  const filtered = useMemo(() => {
    return pages.filter((p) => {
      if (!currentTab.kinds.includes(p.kind)) return false;
      if (niche !== "todos" && !p.niches.includes(niche)) return false;
      return true;
    });
  }, [pages, currentTab, niche]);

  return (
    <LayoutApp>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">
              Knowledge System · Módulo 4
            </p>
            <h1 className="text-2xl font-display text-text-primary mb-1">Biblioteca</h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
              Mecanismos, frameworks e padrões catalogados. Auto-populado pelo Reverse-Engineering + curado manualmente.
            </p>
          </div>
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus size={12} strokeWidth={1.5} /> Nova página
          </Button>
        </div>

        {creating && (
          <WikiPageEditor
            defaultKind={tab}
            defaultNiches={niche === "todos" ? [] : [niche]}
            onClose={() => setCreating(false)}
            onSaved={() => load()}
          />
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-md text-xs transition-all flex-shrink-0",
                  active
                    ? "bg-bg-3 text-text-primary border border-gold/30 shadow-[0_0_18px_rgba(244,196,48,0.08)]"
                    : "text-text-muted hover:text-text-secondary border border-transparent hover:bg-white/[0.03]",
                )}
              >
                <Icon size={13} strokeWidth={1.5} className={active ? "text-gold" : ""} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Filtro nicho */}
        <div className="flex items-center gap-2 mb-5">
          <Filter size={12} strokeWidth={1.5} className="text-text-muted" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Nicho:</span>
          <div className="flex gap-1 overflow-x-auto">
            {NICHES.map((n) => (
              <button
                key={n}
                onClick={() => setNiche(n)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] uppercase tracking-wider transition-all flex-shrink-0",
                  niche === n
                    ? "bg-nova/10 text-nova border border-nova/20"
                    : "text-text-muted hover:text-text-secondary border border-transparent hover:bg-white/[0.03]",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-xs text-text-muted">Carregando...</p>}

        {!loading && filtered.length === 0 && (
          <EmptyState
            title="Nenhum item nessa categoria/nicho"
            description="Aplique as migrations 011/012/013 no Supabase, ou destile concorrentes via Reverse-Engineering pra popular."
          />
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <LibraryCard key={p.id} page={p} />
          ))}
        </div>
      </div>
    </LayoutApp>
  );
}

function LibraryCard({ page }: { page: WikiPage }) {
  const structured = (page.structured ?? {}) as {
    saturation?: string;
    proof_strength?: string;
    compliance_risk?: string;
    complexity?: string;
    last_seen?: string;
  };

  const saturationColor =
    structured.saturation === "alta" ? "text-danger" :
    structured.saturation === "media" ? "text-warning" :
    structured.saturation === "baixa" ? "text-success" : "text-text-muted";

  return (
    <Link href={`/library/${page.slug}`} className="group">
      <Card padding="md" className="h-full hover:border-gold/30 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-medium text-text-primary leading-snug">{page.title}</h3>
          <ArrowRight
            size={12}
            strokeWidth={1.5}
            className="text-text-muted group-hover:text-gold transition-colors flex-shrink-0 mt-0.5 ml-2"
          />
        </div>
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">
          {page.summary}
        </p>

        {/* niches */}
        <div className="flex flex-wrap gap-1 mb-2">
          {page.niches.slice(0, 3).map((n) => (
            <span
              key={n}
              className="text-[9px] uppercase tracking-wider text-text-muted bg-bg-4 px-1.5 py-0.5 rounded"
            >
              {n}
            </span>
          ))}
        </div>

        {/* metadata bar */}
        <div className="flex items-center gap-3 pt-2 mt-2 border-t border-border-subtle text-[9px] uppercase tracking-wider">
          {structured.saturation && (
            <span className={saturationColor}>
              Saturação: {structured.saturation}
            </span>
          )}
          {structured.proof_strength && (
            <span className="text-text-muted">
              Prova: {structured.proof_strength}
            </span>
          )}
          {structured.complexity && (
            <span className="text-text-muted">
              Complex: {structured.complexity}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
