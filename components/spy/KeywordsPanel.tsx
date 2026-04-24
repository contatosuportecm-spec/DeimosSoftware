"use client";

import { useState } from "react";
import {
  Search, Plus, Trash2, X, Radar, Clock, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { useKeywords, SpyKeyword } from "@/hooks/useKeywords";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";

// ═══ Categorias ═══

const CATEGORIES: Record<string, { label: string; color: string }> = {
  gatilho_metodo:   { label: "Método",    color: "#D6C2A1" },
  causa_problema:   { label: "Causa",     color: "#5B8CFF" },
  prova_social:     { label: "Prova",     color: "#34D399" },
  urgencia_censura: { label: "Urgência",  color: "#F87171" },
  emocional:        { label: "Emocional", color: "#A78BFA" },
  geral:            { label: "Geral",     color: "#A1A1AA" },
};

// ═══ KeywordsPanel ═══

export default function KeywordsPanel() {
  const {
    keywords,
    lastRuns,
    loading,
    discovering,
    stats,
    addKeyword,
    toggleKeyword,
    deleteKeyword,
    runDiscovery,
  } = useKeywords();

  const [expanded, setExpanded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newKw, setNewKw] = useState("");
  const [newCat, setNewCat] = useState("geral");
  const [newLang, setNewLang] = useState("pt");

  const lastRun = lastRuns[0];

  const handleAdd = async () => {
    if (!newKw.trim()) return;
    try {
      await addKeyword(newKw.trim(), newCat, newLang);
      setNewKw("");
      setShowAdd(false);
    } catch {
      // error handled in hook
    }
  };

  // Agrupa por categoria
  const grouped = keywords.reduce<Record<string, SpyKeyword[]>>((acc, kw) => {
    const cat = kw.category || "geral";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(kw);
    return acc;
  }, {});

  return (
    <div className="border border-border rounded-lg bg-bg-3/30 overflow-hidden">
      {/* ── Header ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-3/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-bg-4 flex items-center justify-center">
            <Radar size={12} strokeWidth={1.5} className="text-gold" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-text-primary leading-none">
              Discovery Engine
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              {stats.active} keywords ativas · {stats.totalFound} ofertas encontradas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastRun && (
            <span className="text-[9px] text-text-muted flex items-center gap-1">
              <Clock size={9} strokeWidth={1.5} />
              {lastRun.finished_at ? formatRelativeDate(lastRun.finished_at) : "Rodando..."}
            </span>
          )}
          {expanded ? (
            <ChevronUp size={14} strokeWidth={1.5} className="text-text-muted" />
          ) : (
            <ChevronDown size={14} strokeWidth={1.5} className="text-text-muted" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* ── Last run summary ── */}
          {lastRun && (
            <div className="px-4 py-2.5 border-b border-border bg-bg-3/20">
              <div className="flex items-center gap-3 text-[10px]">
                <span className="uppercase tracking-[0.12em] text-text-muted">
                  Último scan
                </span>
                <span className="font-mono text-text-secondary">
                  {lastRun.keywords_scanned} keywords
                </span>
                <span className="font-mono text-text-secondary">
                  {lastRun.pages_found} páginas
                </span>
                <span className="font-mono text-success">
                  +{lastRun.offers_created} novas
                </span>
                {lastRun.errors > 0 && (
                  <span className="font-mono text-danger">
                    {lastRun.errors} erros
                  </span>
                )}
                <div className="ml-auto">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-medium",
                      lastRun.status === "completed"
                        ? "text-success bg-success/10"
                        : lastRun.status === "failed"
                        ? "text-danger bg-danger/10"
                        : "text-gold bg-gold/10"
                    )}
                  >
                    {lastRun.status === "completed" ? "OK" : lastRun.status === "failed" ? "ERRO" : "RODANDO"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <button
              onClick={runDiscovery}
              disabled={discovering}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium uppercase tracking-[0.12em] transition-all",
                discovering
                  ? "bg-gold/10 text-gold/50 cursor-wait"
                  : "bg-gold/10 text-gold hover:bg-gold/20"
              )}
            >
              <Zap size={10} strokeWidth={1.5} className={discovering ? "animate-pulse" : ""} />
              {discovering ? "Buscando..." : "Rodar Discovery"}
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] text-text-muted hover:text-text-secondary hover:bg-bg-4/50 transition-colors"
            >
              <Plus size={10} strokeWidth={1.5} />
              Keyword
            </button>
          </div>

          {/* ── Add keyword form ── */}
          {showAdd && (
            <div className="px-4 py-3 border-b border-border bg-bg-3/30">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newKw}
                  onChange={(e) => setNewKw(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="Nova keyword..."
                  className="flex-1 bg-bg-1 border border-border rounded px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted focus:border-gold/40 focus:outline-none transition-colors"
                />
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="bg-bg-1 border border-border rounded px-2 py-1.5 text-xs text-text-secondary focus:outline-none"
                >
                  {Object.entries(CATEGORIES).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <select
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  className="bg-bg-1 border border-border rounded px-2 py-1.5 text-xs text-text-secondary focus:outline-none w-14"
                >
                  <option value="pt">PT</option>
                  <option value="en">EN</option>
                </select>
                <button
                  onClick={handleAdd}
                  disabled={!newKw.trim()}
                  className="px-2.5 py-1.5 rounded bg-gold/10 text-gold text-xs hover:bg-gold/20 disabled:opacity-30 transition-colors"
                >
                  <Plus size={12} strokeWidth={2} />
                </button>
                <button
                  onClick={() => { setShowAdd(false); setNewKw(""); }}
                  className="p-1.5 rounded text-text-muted hover:text-text-secondary transition-colors"
                >
                  <X size={12} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}

          {/* ── Keywords list ── */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-xs text-text-muted">
                Carregando keywords...
              </div>
            ) : keywords.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-text-muted">
                Nenhuma keyword cadastrada. Rode a migration 002 para popular as keywords iniciais.
              </div>
            ) : (
              Object.entries(grouped).map(([cat, kws]) => {
                const catCfg = CATEGORIES[cat] ?? CATEGORIES.geral;
                return (
                  <div key={cat}>
                    <div className="px-4 py-1.5 bg-bg-3/20 border-b border-border">
                      <span
                        className="text-[8px] uppercase tracking-[0.15em] font-medium"
                        style={{ color: catCfg.color }}
                      >
                        {catCfg.label}
                      </span>
                      <span className="text-[8px] text-text-muted ml-1.5 font-mono">
                        {kws.length}
                      </span>
                    </div>
                    {kws.map((kw) => (
                      <div
                        key={kw.id}
                        className={cn(
                          "flex items-center gap-2 px-4 py-1.5 border-b border-border/50",
                          "hover:bg-bg-3/30 transition-colors group",
                          !kw.is_active && "opacity-40"
                        )}
                      >
                        <button
                          onClick={() => toggleKeyword(kw.id, !kw.is_active)}
                          className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0 transition-colors",
                            kw.is_active ? "bg-success" : "bg-bg-4"
                          )}
                          title={kw.is_active ? "Desativar" : "Ativar"}
                        />
                        <span className="text-xs text-text-secondary flex-1 truncate">
                          {kw.keyword}
                        </span>
                        <span className="text-[9px] text-text-muted font-mono uppercase">
                          {kw.language}
                        </span>
                        {kw.total_found > 0 && (
                          <span className="text-[9px] text-text-muted font-mono">
                            {kw.total_found}
                          </span>
                        )}
                        <button
                          onClick={() => deleteKeyword(kw.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-danger transition-all"
                        >
                          <Trash2 size={10} strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
