"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import LayoutApp from "@/app/layout-app";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  OfferBriefing, VslDraft, WikiPage, VslDraftVerdict, VslScores,
} from "@/types";
import {
  ArrowLeft, Sparkles, ClipboardCheck, Loader2, CheckCircle2, AlertTriangle, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "generate" | "evaluate";

export default function VslStudioDetail() {
  const params = useParams();
  const briefingId = params.briefingId as string;

  const [briefing, setBriefing] = useState<OfferBriefing | null>(null);
  const [voices, setVoices] = useState<WikiPage[]>([]);
  const [mode, setMode] = useState<Mode>("generate");
  const [styleBlend, setStyleBlend] = useState<Record<string, number>>({
    "voice--gary-halbert": 0.6,
    "voice--joe-sugarman": 0.4,
  });
  const [sourceCopy, setSourceCopy] = useState("");
  const [draft, setDraft] = useState<VslDraft | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/offer-briefings`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const found = data.find((b: OfferBriefing) => b.id === briefingId);
          setBriefing(found ?? null);
        }
      });
    fetch("/api/wiki/pages?kind=voice")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setVoices(d));
  }, [briefingId]);

  async function run() {
    setWorking(true);
    setError(null);
    setDraft(null);
    try {
      const url = mode === "generate" ? "/api/vsl/generate" : "/api/vsl/evaluate";
      const body =
        mode === "generate"
          ? { briefingId, style_blend: styleBlend }
          : { briefingId, source_copy: sourceCopy, style_blend: styleBlend };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha");
      setDraft(data);
      if (mode === "generate" && data.generated_copy) setSourceCopy(data.generated_copy);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setWorking(false);
    }
  }

  function adjustBlend(slug: string, value: number) {
    setStyleBlend((prev) => {
      const next = { ...prev, [slug]: value };
      // remove zerados
      Object.keys(next).forEach((k) => next[k] <= 0 && delete next[k]);
      return next;
    });
  }

  return (
    <LayoutApp>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Link
          href="/vsl-studio"
          className="text-xs text-text-muted hover:text-gold flex items-center gap-1.5 mb-3"
        >
          <ArrowLeft size={12} strokeWidth={1.5} /> VSL Studio
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-4 h-[calc(100vh-120px)]">
          {/* ─── Coluna 1: Briefing summary + Modo + Style blend ─── */}
          <div className="space-y-3 overflow-y-auto">
            <Card padding="md">
              <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted mb-1">Briefing</p>
              <h2 className="text-sm font-medium text-text-primary mb-1 line-clamp-1">
                {briefing?.offer_name ?? "—"}
              </h2>
              <p className="text-[10px] uppercase tracking-wider text-text-muted mb-3">
                {briefing?.niche}
              </p>
              <div className="space-y-2 text-[11px]">
                <Field label="Promessa" value={briefing?.promise} />
                <Field label="Mecanismo" value={briefing?.new_mechanism ?? briefing?.syndrome_name} />
                <Field label="Avatar" value={briefing?.target_audience} />
              </div>
            </Card>

            <Card padding="md">
              <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted mb-2">Modo</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setMode("generate")}
                  className={cn(
                    "flex-1 px-3 py-2 rounded text-xs transition-all flex items-center justify-center gap-1.5",
                    mode === "generate"
                      ? "bg-gold/10 text-gold border border-gold/30"
                      : "text-text-muted border border-transparent hover:bg-white/[0.03]",
                  )}
                >
                  <Sparkles size={12} strokeWidth={1.5} /> Gerar
                </button>
                <button
                  onClick={() => setMode("evaluate")}
                  className={cn(
                    "flex-1 px-3 py-2 rounded text-xs transition-all flex items-center justify-center gap-1.5",
                    mode === "evaluate"
                      ? "bg-nova/10 text-nova border border-nova/30"
                      : "text-text-muted border border-transparent hover:bg-white/[0.03]",
                  )}
                >
                  <ClipboardCheck size={12} strokeWidth={1.5} /> Auditar
                </button>
              </div>
            </Card>

            <Card padding="md">
              <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted mb-2">Style blend</p>
              <div className="space-y-2.5">
                {voices.map((v) => {
                  const val = styleBlend[v.slug] ?? 0;
                  return (
                    <div key={v.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-text-secondary">{v.title.split(" ")[0]}</span>
                        <span className="text-[10px] font-mono text-text-muted">
                          {(val * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={val}
                        onChange={(e) => adjustBlend(v.slug, parseFloat(e.target.value))}
                        className="w-full accent-nova"
                      />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Button
              onClick={run}
              disabled={working || (mode === "evaluate" && sourceCopy.trim().length < 50)}
              className="w-full"
            >
              {working ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Trabalhando...
                </>
              ) : mode === "generate" ? (
                <>
                  <Sparkles size={12} strokeWidth={1.5} /> Gerar VSL
                </>
              ) : (
                <>
                  <ClipboardCheck size={12} strokeWidth={1.5} /> Auditar copy
                </>
              )}
            </Button>

            {error && (
              <Card padding="sm" className="border-danger/30 bg-danger/5">
                <p className="text-[11px] text-danger">{error}</p>
              </Card>
            )}
          </div>

          {/* ─── Coluna 2: Copy (editor) ─── */}
          <Card padding="none" className="flex flex-col overflow-hidden">
            <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">
                {mode === "generate" ? "Copy gerada" : "Copy para auditar"}
              </p>
              {draft?.generated_copy && (
                <button
                  onClick={() => navigator.clipboard.writeText(sourceCopy)}
                  className="text-[10px] text-text-muted hover:text-gold uppercase tracking-wider"
                >
                  Copiar
                </button>
              )}
            </div>
            <textarea
              value={sourceCopy}
              onChange={(e) => setSourceCopy(e.target.value)}
              placeholder={
                mode === "generate"
                  ? "Clique em 'Gerar VSL' pra começar..."
                  : "Cole aqui a copy/VSL que você quer auditar..."
              }
              className="flex-1 bg-bg-2 p-5 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none font-mono leading-relaxed"
            />
          </Card>

          {/* ─── Coluna 3: Resultado / scores / improvements ─── */}
          <div className="overflow-y-auto space-y-3">
            {!draft && !working && (
              <Card padding="lg" className="text-center">
                <p className="text-xs text-text-muted leading-relaxed">
                  {mode === "generate"
                    ? "Resultado da geração aparece aqui."
                    : "Scores e sugestões aparecem aqui após auditoria."}
                </p>
              </Card>
            )}

            {working && (
              <Card padding="lg" className="text-center">
                <Loader2 className="animate-spin mx-auto mb-2 text-gold" size={20} />
                <p className="text-xs text-text-muted">
                  {mode === "generate" ? "Gerando VSL com 6 seções..." : "Auditando 5 dimensões..."}
                </p>
              </Card>
            )}

            {draft && mode === "evaluate" && draft.scores && (
              <ScoresPanel verdict={draft.verdict} scores={draft.scores as VslScores} />
            )}

            {draft && mode === "evaluate" && draft.improvements?.length > 0 && (
              <Card padding="md">
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-3">
                  Sugestões ({draft.improvements.length})
                </p>
                <div className="space-y-3">
                  {draft.improvements.map((imp, i) => (
                    <div key={i} className="border-l-2 border-warning/40 pl-3 py-1">
                      <p className="text-[9px] uppercase tracking-wider text-warning mb-1">
                        {imp.section} · Δ+{imp.expected_delta}
                      </p>
                      <p className="text-[11px] text-text-muted line-through mb-1">
                        {imp.current_excerpt}
                      </p>
                      <p className="text-[11px] text-text-primary mb-1">{imp.suggestion}</p>
                      <p className="text-[10px] text-text-muted italic">{imp.reason}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {draft && mode === "evaluate" && draft.verdict === "approved" && (
              <Card padding="md" className="border-success/30 bg-success/5">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={14} className="text-success" />
                  <p className="text-xs text-success font-medium">Copy aprovada</p>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Score overall ≥ 80 e todas as dimensões ≥ 75. Nenhuma sugestão precisa ser feita.
                </p>
              </Card>
            )}

            {draft && mode === "generate" && draft.sections && (
              <Card padding="md">
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-3">
                  Seções geradas
                </p>
                <div className="space-y-2">
                  {(["hook", "lead", "mechanism", "offer", "guarantee", "cta"] as const).map((k) => (
                    <div key={k}>
                      <p className="text-[9px] uppercase tracking-wider text-gold mb-0.5">{k}</p>
                      <p className="text-[11px] text-text-secondary line-clamp-3">
                        {(draft.sections as Record<string, string | undefined>)[k] ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </LayoutApp>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-text-muted mb-0.5">{label}</p>
      <p className="text-text-secondary line-clamp-2">{value ?? "—"}</p>
    </div>
  );
}

function ScoresPanel({ verdict, scores }: { verdict: VslDraftVerdict | null; scores: VslScores }) {
  const dims: (keyof VslScores)[] = ["clareza", "gancho", "prova", "urgencia", "compliance"];
  const verdictIcon = {
    approved: <CheckCircle2 size={14} className="text-success" />,
    needs_polish: <AlertTriangle size={14} className="text-warning" />,
    needs_rewrite: <XCircle size={14} className="text-danger" />,
  };
  const verdictLabel = {
    approved: "Aprovada",
    needs_polish: "Refinar",
    needs_rewrite: "Reescrever",
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">Auditoria</p>
        {verdict && (
          <div className="flex items-center gap-1.5">
            {verdictIcon[verdict]}
            <span className="text-[11px] text-text-primary">{verdictLabel[verdict]}</span>
          </div>
        )}
      </div>

      {/* Overall big */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">Overall</span>
          <span className="text-2xl font-mono text-text-primary">{scores.overall ?? 0}</span>
        </div>
        <div className="h-1.5 bg-bg-4 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              (scores.overall ?? 0) >= 80 ? "bg-success" :
              (scores.overall ?? 0) >= 60 ? "bg-warning" : "bg-danger",
            )}
            style={{ width: `${scores.overall ?? 0}%` }}
          />
        </div>
      </div>

      {/* Dimensões */}
      <div className="space-y-2">
        {dims.map((d) => {
          const v = scores[d] ?? 0;
          return (
            <div key={d}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] uppercase tracking-wider text-text-muted capitalize">{d}</span>
                <span className="text-[10px] font-mono text-text-secondary">{v}</span>
              </div>
              <div className="h-1 bg-bg-4 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    v >= 75 ? "bg-success/70" : v >= 50 ? "bg-warning/70" : "bg-danger/70",
                  )}
                  style={{ width: `${v}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
