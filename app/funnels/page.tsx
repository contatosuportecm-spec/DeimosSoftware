"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LayoutApp from "@/app/layout-app";
import Button from "@/components/ui/Button";
import CreateFunnelModal from "@/components/funnels/CreateFunnelModal";
import { useFunnels } from "@/hooks/useFunnels";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";
import {
  Plus, Workflow, MoreHorizontal, Trash2, Copy,
} from "lucide-react";
import { STAGE_META, type StageType } from "@/types/funnels";

const FLOW_PREVIEW: StageType[] = ["sales-page", "vsl", "quiz", "email-whatsapp", "checkout"];

export default function FunnelsPage() {
  const router = useRouter();
  const { funnels, loading, error, create, remove, refetch } = useFunnels();
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleCreate = async (name: string, description?: string) => {
    const funnel = await create({ name, description });
    router.push(`/funnels/${funnel.id}`);
  };

  return (
    <LayoutApp>
      <div className="min-h-screen p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">
              Funnels
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Visualize e gerencie seus funis de vendas
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus size={14} strokeWidth={1.5} />
            Novo Funil
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-4 space-y-2">
            <p className="text-sm text-danger font-medium">Erro no banco de dados</p>
            <p className="text-xs text-text-muted">{error}</p>
            <p className="text-xs text-text-muted">
              Rode o SQL de migracao no Supabase Dashboard:
            </p>
            <pre className="text-[10px] text-text-secondary bg-bg-1 rounded-lg p-3 overflow-x-auto font-mono">
{`-- Criar tabela
create table if not exists funnels (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  viewport jsonb default '{"x":0,"y":0,"zoom":1}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON funnels FOR ALL
  USING (true) WITH CHECK (true);`}
            </pre>
            <Button onClick={() => refetch()} variant="secondary" size="sm">
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-52 rounded-xl border border-white/[0.06] bg-bg-3 animate-pulse" />
            ))}
          </div>
        ) : !error && funnels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <div className="w-16 h-16 rounded-xl bg-nova/10 border border-nova/20 flex items-center justify-center">
              <Workflow size={32} strokeWidth={1.5} className="text-nova" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              Nenhum funil ainda
            </h2>
            <p className="text-sm text-text-muted max-w-md text-center">
              Crie seu primeiro funil para visualizar toda a jornada do cliente — da pagina de vendas ate a conversao.
            </p>
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus size={14} strokeWidth={1.5} />
              Criar Primeiro Funil
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {funnels.map((funnel) => {
              const stageCount = Array.isArray(funnel.stages) ? funnel.stages.length : 0;

              return (
                <div
                  key={funnel.id}
                  onClick={() => router.push(`/funnels/${funnel.id}`)}
                  className={cn(
                    "group relative rounded-xl border border-white/[0.08] bg-bg-3 cursor-pointer transition-all duration-200",
                    "hover:border-white/[0.14] hover:shadow-lg hover:-translate-y-px"
                  )}
                >
                  {/* Mini flow preview */}
                  <div className="h-24 rounded-t-xl bg-bg-1 border-b border-white/[0.06] flex items-center justify-center gap-2 px-6">
                    {FLOW_PREVIEW.map((type, i) => {
                      const meta = STAGE_META[type];
                      return (
                        <div key={type} className="flex items-center gap-1.5">
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center"
                            style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}30` }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                          </div>
                          {i < FLOW_PREVIEW.length - 1 && (
                            <div className="w-4 h-px bg-white/[0.1]" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Info */}
                  <div className="px-4 py-3 space-y-1">
                    <p className="text-[13px] text-text-primary font-semibold truncate group-hover:text-gold transition-colors">
                      {funnel.name}
                    </p>
                    {funnel.description && (
                      <p className="text-[11px] text-text-muted truncate">{funnel.description}</p>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[10px] text-text-muted font-mono">
                        {stageCount} etapas
                      </span>
                      <span className="text-[10px] text-text-muted ml-auto">
                        {formatRelativeDate(funnel.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === funnel.id ? null : funnel.id); }}
                      className="w-7 h-7 rounded-lg bg-bg-1/80 backdrop-blur border border-white/[0.08] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                    >
                      <MoreHorizontal size={14} strokeWidth={1.5} />
                    </button>
                    {menuOpen === funnel.id && (
                      <div className="absolute top-8 right-0 w-36 bg-[#0B0B0C]/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl py-1 z-20">
                        <button
                          onClick={(e) => { e.stopPropagation(); remove(funnel.id); setMenuOpen(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 size={12} strokeWidth={1.5} />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add card */}
            <button
              onClick={() => setShowCreate(true)}
              className="h-[188px] rounded-xl border border-dashed border-white/[0.08] bg-transparent hover:border-nova/30 hover:bg-nova/5 transition-all duration-200 flex flex-col items-center justify-center gap-2"
            >
              <Plus size={20} strokeWidth={1.5} className="text-text-muted" />
              <span className="text-[11px] text-text-muted">Novo Funil</span>
            </button>
          </div>
        )}
      </div>

      <CreateFunnelModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </LayoutApp>
  );
}
