"use client";

import { useEffect, useState } from "react";
import { WikiPage, WikiPageKind } from "@/types";
import Button from "@/components/ui/Button";
import { X, Save, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const KINDS: WikiPageKind[] = [
  "voice", "framework", "concept", "avatar", "mechanism", "pattern", "claims", "lesson",
];

const NICHES = ["geral", "emagrecimento", "saude-masculina", "renda-extra", "beleza", "relacionamento"];

interface Props {
  /** Se passar page, está em modo EDIT. Se não, modo CREATE. */
  page?: WikiPage | null;
  /** Default kind pra modo CREATE (ex: ao clicar "Nova voz" em /copywriters). */
  defaultKind?: WikiPageKind;
  /** Default niches pra modo CREATE. */
  defaultNiches?: string[];
  onClose: () => void;
  onSaved: (page: WikiPage) => void;
  onDeleted?: () => void;
}

export default function WikiPageEditor({
  page,
  defaultKind,
  defaultNiches,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const isEdit = !!page;

  const [kind, setKind] = useState<WikiPageKind>(page?.kind ?? defaultKind ?? "concept");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [title, setTitle] = useState(page?.title ?? "");
  const [summary, setSummary] = useState(page?.summary ?? "");
  const [bodyMd, setBodyMd] = useState(page?.body_md ?? "");
  const [niches, setNiches] = useState<string[]>(page?.niches ?? defaultNiches ?? []);
  const [tagsText, setTagsText] = useState((page?.tags ?? []).join(", "));
  const [linksText, setLinksText] = useState((page?.links_to ?? []).join(", "));
  const [confidence, setConfidence] = useState(page?.confidence ?? 0.7);
  const [structuredText, setStructuredText] = useState(
    JSON.stringify(page?.structured ?? {}, null, 2),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Auto-gera slug ao digitar título (só em modo create)
  useEffect(() => {
    if (isEdit) return;
    if (!title || slug) return;
    const auto = `${kind}--${title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60)}`;
    setSlug(auto);
  }, [title, kind, slug, isEdit]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function toggleNiche(n: string) {
    setNiches((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  }

  async function save() {
    setError(null);

    let structuredParsed: Record<string, unknown>;
    try {
      structuredParsed = structuredText.trim() ? JSON.parse(structuredText) : {};
    } catch {
      setError("Structured não é JSON válido");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kind,
        title: title.trim(),
        summary: summary.trim(),
        body_md: bodyMd,
        niches,
        tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
        links_to: linksText.split(",").map((t) => t.trim()).filter(Boolean),
        confidence,
        structured: structuredParsed,
      };

      let res: Response;
      if (isEdit) {
        res = await fetch(`/api/wiki/pages/${page!.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, reason: "edit via UI" }),
        });
      } else {
        res = await fetch("/api/wiki/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, slug: slug.trim() || undefined }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha ao salvar");
      onSaved(data);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    if (!isEdit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/wiki/pages/${page!.slug}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d?.error ?? "Falha ao deletar");
      }
      onDeleted?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[92vh] bg-bg-1 border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">
              Knowledge editor
            </p>
            <h2 className="text-sm font-medium text-text-primary mt-0.5">
              {isEdit ? `Editar · ${page!.title}` : "Nova página"}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded hover:bg-white/[0.05] text-text-muted hover:text-text-primary"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body — 2 columns */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr]">
          {/* Left: metadata */}
          <div className="border-r border-border overflow-y-auto p-4 space-y-4 text-xs">
            {/* Kind */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                Kind
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as WikiPageKind)}
                disabled={isEdit}
                className="w-full bg-bg-2 border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-gold/40 disabled:opacity-50"
              >
                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              {isEdit && (
                <p className="text-[9px] text-text-muted mt-1">Kind não pode mudar após criar.</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                Slug
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={isEdit}
                placeholder="auto-gerado a partir do título"
                className="w-full bg-bg-2 border border-border rounded px-2 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:border-gold/40 disabled:opacity-50"
              />
            </div>

            {/* Niches */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1.5">
                Nichos
              </label>
              <div className="flex flex-wrap gap-1">
                {NICHES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleNiche(n)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] transition-all",
                      niches.includes(n)
                        ? "bg-nova/10 text-nova border border-nova/30"
                        : "bg-bg-3 text-text-muted border border-transparent hover:border-border-strong",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                Tags (vírgula)
              </label>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="copywriter, hook, ..."
                className="w-full bg-bg-2 border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-gold/40"
              />
            </div>

            {/* Links_to */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                Links para (slugs, vírgula)
              </label>
              <input
                value={linksText}
                onChange={(e) => setLinksText(e.target.value)}
                placeholder="voice--gary-halbert, framework--..."
                className="w-full bg-bg-2 border border-border rounded px-2 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:border-gold/40"
              />
            </div>

            {/* Confidence */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase tracking-wider text-text-muted">
                  Confiança
                </label>
                <span className="text-[10px] font-mono text-text-secondary">
                  {(confidence * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full accent-gold"
              />
            </div>

            {/* Structured */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                Metadata (JSON)
              </label>
              <textarea
                value={structuredText}
                onChange={(e) => setStructuredText(e.target.value)}
                rows={5}
                placeholder='{"saturation":"alta",...}'
                className="w-full bg-bg-2 border border-border rounded px-2 py-1.5 text-[10px] text-text-primary font-mono focus:outline-none focus:border-gold/40 resize-none"
              />
            </div>
          </div>

          {/* Right: title, summary, body_md */}
          <div className="overflow-y-auto p-4 space-y-3 flex flex-col">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                Título
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: David Ogilvy"
                className="w-full bg-bg-2 border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-gold/40"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                Sumário (1 frase, aparece no card)
              </label>
              <input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={200}
                placeholder="Pai do branding moderno..."
                className="w-full bg-bg-2 border border-border rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-gold/40"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-[300px]">
              <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                Corpo (markdown)
              </label>
              <textarea
                value={bodyMd}
                onChange={(e) => setBodyMd(e.target.value)}
                placeholder="# Título&#10;&#10;## Estilo&#10;..."
                className="flex-1 bg-bg-2 border border-border rounded p-3 text-xs text-text-primary font-mono focus:outline-none focus:border-gold/40 resize-none leading-relaxed min-h-[300px]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 flex items-center justify-between gap-3">
          {error && (
            <div className="flex items-center gap-1.5 text-[11px] text-danger">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {isEdit && onDeleted && (
              confirmDelete ? (
                <>
                  <span className="text-[11px] text-danger">Confirma?</span>
                  <Button variant="danger" size="sm" onClick={destroy} disabled={saving}>
                    <Trash2 size={11} strokeWidth={1.5} /> Sim, deletar
                  </Button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-[11px] text-text-muted hover:text-text-primary px-2"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                  className="text-[11px] text-danger hover:text-danger/80 flex items-center gap-1 px-3 py-2"
                >
                  <Trash2 size={11} strokeWidth={1.5} /> Deletar
                </button>
              )
            )}
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving || !title.trim() || !bodyMd.trim()} size="sm">
              {saving ? <><Loader2 size={11} className="animate-spin" /> Salvando</> : <><Save size={11} strokeWidth={1.5} /> Salvar</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
