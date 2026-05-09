"use client";

import { useState } from "react";
import { Activity, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrapeResult {
  scraped: number;
  errors: number;
  total: number;
  log: Array<{ id: string; name: string; status: "ok" | "error"; count?: number; error?: string }>;
}

interface ScrapeAllButtonProps {
  onDone?: () => void;
}

export default function ScrapeAllButton({ onDone }: ScrapeAllButtonProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/spy/scrape-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao executar scrape");
      } else {
        setResult(data);
        onDone?.();
        setTimeout(() => setResult(null), 8000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro de rede");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={run}
        disabled={running}
        title="Roda o Playwright local pra atualizar a contagem de ads ativos de todas as ofertas. Funciona em next dev (precisa do Chromium do Playwright instalado)."
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors border",
          "bg-bg-3 border-border text-text-secondary",
          "hover:border-amber/40 hover:text-amber",
          "disabled:opacity-60 disabled:cursor-wait",
        )}
      >
        {running ? (
          <Loader2 size={12} strokeWidth={1.5} className="animate-spin" />
        ) : (
          <Activity size={12} strokeWidth={1.5} />
        )}
        {running ? "Rodando scrape..." : "Atualizar contagem de ads"}
      </button>

      {result && (
        <div className="absolute right-0 top-full mt-2 w-72 z-50 rounded-lg border border-border bg-bg-2 shadow-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Check size={12} className="text-success" />
            <p className="text-[11px] font-semibold text-text-primary">
              {result.scraped} de {result.total} ofertas
            </p>
            {result.errors > 0 && (
              <span className="text-[10px] text-danger ml-auto">
                {result.errors} erro{result.errors > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {result.log.slice(0, 10).map((l) => (
              <div key={l.id} className="flex items-center gap-2 text-[10px]">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    l.status === "ok" ? "bg-success" : "bg-danger",
                  )}
                />
                <span className="text-text-secondary truncate flex-1">{l.name}</span>
                {l.status === "ok" && (
                  <span className="text-text-muted font-mono">{l.count}</span>
                )}
              </div>
            ))}
            {result.log.length > 10 && (
              <p className="text-[9px] text-text-muted text-center pt-1">
                +{result.log.length - 10} ofertas
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute right-0 top-full mt-2 w-72 z-50 rounded-lg border border-danger/30 bg-danger/5 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={12} className="text-danger flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-danger leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
