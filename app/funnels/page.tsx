"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import LayoutApp from "@/app/layout-app";
import Button from "@/components/ui/Button";
import CreateFunnelModal from "@/components/funnels/CreateFunnelModal";
import { useFunnels } from "@/hooks/useFunnels";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";
import {
  Plus, Activity, GitFork, Clock, Trash2,
  ArrowRight, File, Layout,
} from "lucide-react";
import { NODE_TYPE_META, type FunnelNodeType } from "@/types/funnels";

export default function FunnelsPage() {
  const router = useRouter();
  const { funnels, loading, error, create, remove, refetch } = useFunnels();
  const [showCreate, setShowCreate] = useState(false);


  const handleCreate = async (name: string, description?: string) => {
    const funnel = await create({ name, description });
    router.push(`/funnels/${funnel.id}`);
  };

  // Stats
  const totalNodes = useMemo(() => funnels.reduce((s, f) => s + (f.node_count ?? 0), 0), [funnels]);
  const lastEdited = useMemo(() => {
    if (funnels.length === 0) return null;
    return formatRelativeDate(funnels[0].updated_at);
  }, [funnels]);

  return (
    <LayoutApp>
      <div className="min-h-screen p-8 max-w-[1200px] mx-auto">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-[28px] font-bold text-text-primary tracking-tight font-display">
              Funnels
            </h1>
            <p className="text-[14px] text-text-muted mt-1">
              Visualize, organize e otimize seus funis em um canvas inteligente.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus size={14} strokeWidth={2} />
            Novo Funil
          </Button>
        </div>

        {/* ── Stats bar ── */}
        {funnels.length > 0 && (
          <div className="flex items-center gap-3 mt-5 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02]">
              <Activity size={13} strokeWidth={1.5} className="text-text-muted" />
              <span className="text-[12px] text-text-muted">
                <span className="text-nova font-semibold">{funnels.length}</span> funil{funnels.length !== 1 ? "s" : ""} ativo{funnels.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02]">
              <GitFork size={13} strokeWidth={1.5} className="text-text-muted" />
              <span className="text-[12px] text-text-muted">
                <span className="text-nova font-semibold">{totalNodes}</span> nos criados
              </span>
            </div>
            {lastEdited && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02]">
                <Clock size={13} strokeWidth={1.5} className="text-text-muted" />
                <span className="text-[12px] text-text-muted">
                  Ultima edicao <span className="text-nova font-semibold">{lastEdited}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-4 space-y-2 mb-6">
            <p className="text-sm text-danger font-medium">Erro no banco de dados</p>
            <p className="text-xs text-text-muted">{error}</p>
            <Button onClick={() => refetch()} variant="secondary" size="sm">
              Tentar novamente
            </Button>
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[0, 1].map((i) => (
              <div key={i} className="h-72 rounded-2xl border border-white/[0.06] bg-[#0f1219] animate-pulse" />
            ))}
          </div>
        ) : !error && funnels.length === 0 ? (
          /* ── Empty: just the create card ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
            <CreateCard onClick={() => setShowCreate(true)} />
          </div>
        ) : (
          /* ── Funnel cards grid ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {funnels.map((funnel) => (
              <div
                key={funnel.id}
                className="group relative rounded-2xl border border-nova/15 bg-[#0a0e14] overflow-hidden cursor-pointer transition-all duration-300 hover:border-nova/30"
                style={{ boxShadow: "0 0 30px rgba(255,138,31,0.04), inset 0 1px 0 rgba(255,255,255,0.03)" }}
                onClick={() => router.push(`/funnels/${funnel.id}`)}
              >
                {/* Top glow line */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-nova/30 to-transparent" />

                {/* ── Header ── */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06]">
                  <h2 className="text-[20px] font-semibold text-white truncate flex-1 font-display">
                    {funnel.name}
                  </h2>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Ativo
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(funnel.id); }}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title="Excluir funil"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>

                {/* ── Flow preview ── */}
                <div className="relative px-6 py-8">
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#5B8CFF]/[0.02] via-transparent to-[#A78BFA]/[0.02] pointer-events-none" />

                  {(funnel.preview_nodes?.length ?? 0) > 0 ? (
                    <div className="flex items-center justify-center gap-4 relative">
                      {funnel.preview_nodes!.slice(0, 5).map((node, i) => {
                        const meta = NODE_TYPE_META[node.type as FunnelNodeType];
                        const NodeIcon = meta?.icon;
                        return (
                          <div key={`${node.type}-${i}`} className="flex items-center gap-4">
                            <div className="flex flex-col items-center gap-2">
                              <div
                                className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${meta?.color ?? '#555'}08, ${meta?.color ?? '#555'}04)`,
                                  border: `1.5px solid ${meta?.color ?? '#555'}30`,
                                  boxShadow: `0 4px 20px ${meta?.color ?? '#555'}08`,
                                }}
                              >
                                {NodeIcon && <NodeIcon size={28} strokeWidth={1.5} style={{ color: meta.color }} />}
                              </div>
                              <span className="text-[11px] text-text-secondary truncate max-w-[80px] text-center">{node.label}</span>
                            </div>
                            {i < Math.min(funnel.preview_nodes!.length, 5) - 1 && (
                              <div className="flex items-center gap-1 mb-7">
                                <div className="w-6 h-px bg-gradient-to-r from-white/10 to-transparent" />
                                <div className="w-[5px] h-[5px] rounded-full bg-nova/70" />
                                <div className="w-[5px] h-[5px] rounded-full bg-nova/50" />
                                <div className="w-[5px] h-[5px] rounded-full bg-nova/30" />
                                <div className="w-6 h-px bg-gradient-to-l from-white/10 to-transparent" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {(funnel.preview_nodes?.length ?? 0) > 5 && (
                        <span className="text-[11px] text-text-muted mb-7">+{funnel.preview_nodes!.length - 5}</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <span className="text-[13px] text-[#3a3a4a] italic">Sem nos — abra para comecar</span>
                    </div>
                  )}
                </div>

                {/* ── Footer ── */}
                <div className="border-t border-white/[0.06] px-6 py-3 flex items-center">
                  <div className="flex items-center divide-x divide-white/[0.08] flex-1">
                    <div className="flex items-center gap-2.5 pr-6">
                      <GitFork size={14} strokeWidth={1.5} className="text-text-muted" />
                      <div>
                        <span className="text-[16px] font-semibold text-white font-mono block leading-tight">{funnel.node_count ?? 0}</span>
                        <span className="text-[10px] text-text-muted">nos</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 px-6">
                      <Activity size={14} strokeWidth={1.5} className="text-nova" />
                      <div>
                        <span className="text-[10px] text-text-muted block leading-tight">PR medio</span>
                        <span className="text-[14px] font-semibold text-nova font-mono">—</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 px-6">
                      <Clock size={14} strokeWidth={1.5} className="text-text-muted" />
                      <div>
                        <span className="text-[10px] text-text-muted block leading-tight">Editado</span>
                        <span className="text-[14px] font-semibold text-white">{formatRelativeDate(funnel.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-[14px] text-nova font-bold group-hover:gap-3 transition-all duration-300">
                    Abrir
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </span>
                </div>
              </div>
            ))}

            {/* Create card */}
            <CreateCard onClick={() => setShowCreate(true)} />
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

/* ── Create Card Component ── */

function CreateCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl border border-dashed border-white/[0.06] bg-transparent cursor-pointer flex flex-col items-center justify-center py-14 gap-5 overflow-hidden hover:border-nova/40"
      style={{ transition: "border-color 0.6s ease, background 0.6s ease, box-shadow 0.8s ease", boxShadow: "inset 0 0 0 0 transparent" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(255,138,31,0.12), 0 0 50px rgba(255,138,31,0.06), inset 0 0 30px rgba(255,138,31,0.04)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 0 0 0 transparent"; }}
    >
      {/* Glow orb — slow fade in on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{ transition: "opacity 0.8s ease" }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-nova/[0.06] blur-[60px]" />
      </div>

      <div
        className="w-16 h-16 rounded-full border border-white/[0.08] flex items-center justify-center relative group-hover:border-nova/25 group-hover:shadow-[0_0_24px_rgba(255,138,31,0.08)]"
        style={{ transition: "border-color 0.6s ease, box-shadow 0.6s ease" }}
      >
        <Plus
          size={28}
          strokeWidth={1.5}
          className="text-text-muted group-hover:text-nova"
          style={{ transition: "color 0.6s ease" }}
        />
      </div>
      <div className="text-center relative">
        <p
          className="text-[16px] font-semibold text-text-primary group-hover:text-white"
          style={{ transition: "color 0.6s ease" }}
        >
          Criar novo funil
        </p>
        <p
          className="text-[12px] text-text-muted mt-1 group-hover:text-text-secondary"
          style={{ transition: "color 0.6s ease" }}
        >
          Comece com um canvas vazio ou use um template
        </p>
      </div>
      <div className="flex items-center gap-3 relative">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-[12px] text-text-secondary group-hover:border-nova/20 group-hover:text-text-primary"
          style={{ transition: "all 0.5s ease" }}
        >
          <File size={13} strokeWidth={1.5} />
          Em branco
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-[12px] text-text-secondary group-hover:border-nova/20 group-hover:text-text-primary"
          style={{ transition: "all 0.5s ease" }}
        >
          <Layout size={13} strokeWidth={1.5} />
          Template
        </button>
      </div>
    </div>
  );
}
