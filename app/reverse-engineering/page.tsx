"use client";

import { useEffect, useState } from "react";
import LayoutApp from "@/app/layout-app";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { CompetitorOffer } from "@/types";
import { Loader2, Sparkles, Eye, AlertCircle } from "lucide-react";

const NICHES = ["emagrecimento", "saude-masculina", "renda-extra", "beleza", "relacionamento", "geral"];

export default function ReverseEngineeringPage() {
  const [list, setList] = useState<CompetitorOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [rawText, setRawText] = useState("");
  const [nameHint, setNameHint] = useState("");
  const [nicheHint, setNicheHint] = useState("emagrecimento");
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CompetitorOffer | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/reverse-engineering")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setList(d))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function destill() {
    setWorking(true);
    setError(null);
    setLastResult(null);
    try {
      const res = await fetch("/api/reverse-engineering/destill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: rawText,
          name_hint: nameHint || undefined,
          niche_hint: nicheHint,
          source_url: sourceUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha");
      setLastResult(data.competitor_offer);
      setRawText("");
      setNameHint("");
      setSourceUrl("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setWorking(false);
    }
  }

  return (
    <LayoutApp>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">
            Knowledge System · Módulo 2
          </p>
          <h1 className="text-2xl font-display text-text-primary mb-1">Reverse-Engineering</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
            Cole a copy/transcript/LP de qualquer oferta concorrente. O sistema destila
            estrutura, mecanismo, padrões — e popula a biblioteca automaticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
          {/* Form */}
          <Card padding="lg">
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-3">
              Destilar nova oferta
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                  Nome (opcional)
                </label>
                <input
                  value={nameHint}
                  onChange={(e) => setNameHint(e.target.value)}
                  placeholder="Ex: Café Termogênico XYZ"
                  className="w-full bg-bg-2 border border-border rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-nova/40"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                  Nicho
                </label>
                <select
                  value={nicheHint}
                  onChange={(e) => setNicheHint(e.target.value)}
                  className="w-full bg-bg-2 border border-border rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-nova/40"
                >
                  {NICHES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                  URL fonte (opcional)
                </label>
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-bg-2 border border-border rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-nova/40"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                  Copy / Transcript *
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Cole aqui a copy completa da LP / transcript do vídeo / texto do anúncio..."
                  className="w-full bg-bg-2 border border-border rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-nova/40 resize-none font-mono leading-relaxed"
                  rows={14}
                />
                <p className="text-[9px] text-text-muted mt-1">
                  Mínimo 100 caracteres. Máximo recomendado: ~25k caracteres.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-md bg-danger/5 border border-danger/20">
                  <AlertCircle size={12} className="text-danger flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-danger">{error}</p>
                </div>
              )}

              <Button
                onClick={destill}
                disabled={working || rawText.trim().length < 100}
                className="w-full"
              >
                {working ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Destilando...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} strokeWidth={1.5} /> Destilar
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Resultado / Lista */}
          <div className="space-y-3">
            {lastResult && (
              <Card padding="md" className="border-success/30 bg-success/5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-success mb-2">
                  Destilada
                </p>
                <h3 className="text-sm font-medium text-text-primary mb-2">{lastResult.name}</h3>
                <pre className="text-[10px] text-text-secondary whitespace-pre-wrap max-h-60 overflow-y-auto font-mono leading-relaxed">
                  {JSON.stringify(lastResult.extracted, null, 2)}
                </pre>
                {lastResult.l2_page_ids.length > 0 && (
                  <p className="text-[10px] text-text-muted mt-2 pt-2 border-t border-border-subtle">
                    {lastResult.l2_page_ids.length} página(s) da biblioteca atualizada(s).
                  </p>
                )}
              </Card>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-3">
                Ofertas destiladas ({list.length})
              </p>

              {loading && <p className="text-xs text-text-muted">Carregando...</p>}

              {!loading && list.length === 0 && !lastResult && (
                <EmptyState
                  title="Nenhuma oferta destilada ainda"
                  description="Cole sua primeira ao lado pra começar a alimentar a biblioteca."
                />
              )}

              <div className="space-y-2">
                {list.map((o) => (
                  <Card key={o.id} padding="sm" className="hover:border-gold/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-text-primary truncate">{o.name}</p>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted">
                          {o.niche ?? "—"} · {new Date(o.captured_at).toLocaleDateString("pt-BR")}
                        </p>
                        {o.extracted.hook && (
                          <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">
                            <Eye size={10} strokeWidth={1.5} className="inline mr-1" />
                            {o.extracted.hook}
                          </p>
                        )}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-gold bg-gold/10 px-1.5 py-0.5 rounded">
                        {o.l2_page_ids.length} pages
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutApp>
  );
}
