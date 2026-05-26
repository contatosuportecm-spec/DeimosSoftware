"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Maximize2, Plus, AlignLeft, ToggleLeft, Sliders } from "lucide-react";
import { NODE_TYPE_META, type FunnelNode, type FunnelNodeType, type AggregatedMetrics } from "@/types/funnels";
import { cn } from "@/lib/utils";

type Tab = "content" | "metrics" | "notes";

interface NodeInspectorProps {
  node: FunnelNode | null;
  onClose: () => void;
  onUpdate: (nodeId: string, patch: Record<string, unknown>) => void;
  onDrillDown?: (nodeId: string) => void;
  aggregatedMetrics?: AggregatedMetrics;
  parentType?: FunnelNodeType | null;
}

export default function NodeInspector({ node, onClose, onUpdate, onDrillDown, aggregatedMetrics, parentType }: NodeInspectorProps) {
  const [tab, setTab] = useState<Tab>("content");
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout>();

  useEffect(() => { setTab("content"); }, [node?.id]);

  const debouncedUpdate = useCallback((field: string, value: unknown, isNested?: string) => {
    if (!node) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (isNested) {
        const current = (node as unknown as Record<string, unknown>)[isNested] as Record<string, unknown> ?? {};
        onUpdate(node.id, { [isNested]: { ...current, [field]: value } });
      } else {
        onUpdate(node.id, { [field]: value });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    }, 300);
  }, [node, onUpdate]);

  if (!node) return null;

  const meta = NODE_TYPE_META[node.type];
  const Icon = meta.icon;

  return (
    <div className="fixed top-0 right-0 h-full w-[360px] bg-bg-1 border-l border-white/[0.06] z-40 flex flex-col animate-[slideInRight_180ms_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={14} strokeWidth={1.5} style={{ color: meta.color }} />
          <span className="text-[13px] font-medium text-text-primary truncate">{node.label}</span>
          <span className="text-[9px] uppercase tracking-[0.1em] text-text-muted px-1.5 py-0.5 rounded bg-white/[0.04]">
            {meta.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-[10px] text-emerald-400 font-medium">Salvo</span>}
          <button onClick={onClose} className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors">
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {(["content", "metrics", "notes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 text-[11px] uppercase tracking-[0.12em] transition-colors",
              tab === t ? "text-text-primary border-b border-gold" : "text-text-muted hover:text-text-secondary"
            )}
          >
            {t === "content" ? "Conteudo" : t === "metrics" ? "Metricas" : "Notas"}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === "content" && (
          <ContentTab node={node} onChange={debouncedUpdate} onDrillDown={onDrillDown} />
        )}
        {tab === "metrics" && (
          <MetricsTab node={node} onChange={(f, v) => debouncedUpdate(f, v, "metrics")} aggregatedMetrics={aggregatedMetrics} parentType={parentType} />
        )}
        {tab === "notes" && (
          <NotesTab content={node.content} onChange={(v) => debouncedUpdate("notes", v, "content")} />
        )}
      </div>
    </div>
  );
}

/* ── Content Tab ── */

function ContentTab({ node, onChange, onDrillDown }: {
  node: FunnelNode;
  onChange: (field: string, value: unknown, nested?: string) => void;
  onDrillDown?: (nodeId: string) => void;
}) {
  const meta = NODE_TYPE_META[node.type];
  const content = node.content as Record<string, unknown>;

  return (
    <div className="space-y-4">
      {/* Name — always */}
      <Field label="Nome" value={node.label} onChange={(v) => onChange("label", v)} />

      {/* Container: info message + drill-down button */}
      {meta.category === "container" && (
        <>
          <p className="text-[11px] text-text-muted leading-relaxed bg-white/[0.02] rounded-lg px-3 py-2.5 border border-white/[0.04]">
            O conteudo {meta.label === "Quiz" ? "deste" : "desta"} {meta.label} e montado dentro {meta.label === "Quiz" ? "dele" : "dela"}. Clique duplo no no ou use o botao abaixo para entrar.
          </p>
          {onDrillDown && (
            <button
              onClick={() => onDrillDown(node.id)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[9px] bg-[#FF6B00] text-black text-xs font-bold tracking-wide transition-all duration-200 hover:bg-[#FF7A1A] shadow-[0_0_14px_rgba(255,107,0,0.25)] hover:shadow-[0_0_24px_rgba(255,107,0,0.4)] active:scale-[0.97]"
            >
              <Maximize2 size={13} strokeWidth={2} />
              Abrir {meta.label}
            </button>
          )}
        </>
      )}

      {/* Block: specific fields */}
      {node.type === "headline" && (
        <Field label="Texto" value={(content.text as string) ?? ""} onChange={(v) => onChange("text", v, "content")} type="textarea" />
      )}

      {node.type === "copy_block" && (
        <>
          <Field label="Texto" value={(content.body as string) ?? ""} onChange={(v) => onChange("body", v, "content")} type="textarea" />
          <Field label="Funcao (role)" value={(content.role as string) ?? ""} onChange={(v) => onChange("role", v, "content")} placeholder="ex: lead, offer, ps" />
        </>
      )}

      {node.type === "button" && (
        <>
          <Field label="Label do Botao" value={(content.label as string) ?? ""} onChange={(v) => onChange("label", v, "content")} />
          <Field label="URL de Destino" value={(content.target_url as string) ?? ""} onChange={(v) => onChange("target_url", v, "content")} placeholder="https://..." />
        </>
      )}

      {node.type === "quiz_question" && (
        <QuizQuestionFields content={content} onChange={onChange} />
      )}

      {node.type === "button_answer" && (
        <>
          <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-1">Opcoes</p>
          {((content.options as Array<{id:string;label:string}>) ?? []).map((opt, i) => (
            <Field key={opt.id} label={`Opcao ${i + 1}`} value={opt.label} onChange={(v) => {
              const opts = [...((content.options as Array<{id:string;label:string}>) ?? [])];
              opts[i] = { ...opts[i], label: v };
              onChange("options", opts, "content");
            }} />
          ))}
        </>
      )}

      {node.type === "text_answer" && (
        <>
          <Field label="Label" value={(content.label as string) ?? ""} onChange={(v) => onChange("label", v, "content")} />
          <Field label="Placeholder" value={(content.placeholder as string) ?? ""} onChange={(v) => onChange("placeholder", v, "content")} placeholder="Ex: Joao Silva" />
        </>
      )}
    </div>
  );
}

/* ── Quiz Question Fields ── */

const Q_TYPES = [
  { value: "open",   label: "Aberta",  Icon: AlignLeft,  desc: "Campo de texto livre" },
  { value: "button", label: "Botão",   Icon: ToggleLeft, desc: "Botões clicáveis, cada um conectável a um fluxo" },
  { value: "scale",  label: "Escala",  Icon: Sliders,    desc: "Régua de medida (ex: 1 a 10)" },
] as const;

function normalizeQType(v: string): "open" | "button" | "scale" {
  if (v === "single" || v === "multi" || v === "button") return "button";
  if (v === "scale") return "scale";
  return "open";
}

function QuizQuestionFields({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (field: string, value: unknown, nested?: string) => void;
}) {
  const [qType, setQType] = useState<"open" | "button" | "scale">(() =>
    normalizeQType((content.question_type as string) ?? "open")
  );

  // Local state for options — immediate visual feedback without waiting for debounce
  const propsOptions = (content.options as Array<{ id: string; label: string }>) ?? [];
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>(propsOptions);

  // Sync when options are added/removed externally (e.g. from the card inline editor)
  const propsIdsKey = propsOptions.map((o) => o.id).join(",");
  useEffect(() => {
    setOptions((content.options as Array<{ id: string; label: string }>) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsIdsKey]);

  const handleTypeChange = (v: "open" | "button" | "scale") => {
    setQType(v);
    onChange("question_type", v, "content");
  };

  const updateOptions = (opts: Array<{ id: string; label: string }>) => {
    setOptions(opts); // immediate visual update
    onChange("options", opts, "content");
  };

  return (
    <div className="space-y-4">
      <Field
        label="Pergunta"
        value={(content.question as string) ?? ""}
        onChange={(v) => onChange("question", v, "content")}
        type="textarea"
      />

      {/* Type selector */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">
          Tipo de Resposta
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {Q_TYPES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg border text-center transition-all",
                qType === value
                  ? "border-[#C084FC]/50 bg-[#C084FC]/10 text-[#C084FC]"
                  : "border-white/[0.06] bg-bg-3 text-text-muted hover:border-white/[0.12] hover:text-text-secondary"
              )}
            >
              <Icon size={14} strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-text-muted mt-1.5 leading-relaxed">
          {Q_TYPES.find((t) => t.value === qType)?.desc}
        </p>
      </div>

      {/* Options editor (button type only) */}
      {qType === "button" && (
        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-[0.12em] text-text-muted">
            Opções
          </label>
          {options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#C084FC]/10 border border-[#C084FC]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-mono text-[#C084FC]/70">{i + 1}</span>
              </div>
              <input
                className="flex-1 bg-bg-3 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary outline-none focus:border-[#C084FC]/30 transition-colors"
                defaultValue={opt.label}
                placeholder={`Opção ${i + 1}`}
                onChange={(e) => {
                  const updated = options.map((o) => o.id === opt.id ? { ...o, label: e.target.value } : o);
                  updateOptions(updated);
                }}
              />
              <button
                type="button"
                onClick={() => updateOptions(options.filter((o) => o.id !== opt.id))}
                className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateOptions([...options, { id: crypto.randomUUID(), label: "" }])}
            className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-[#C084FC] transition-colors py-1"
          >
            <Plus size={12} strokeWidth={1.5} />
            Adicionar opção
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Metrics Tab ── */

function MetricsTab({ node, onChange, aggregatedMetrics, parentType }: {
  node: FunnelNode;
  onChange: (field: string, val: unknown) => void;
  aggregatedMetrics?: AggregatedMetrics;
  parentType?: FunnelNodeType | null;
}) {
  const meta = NODE_TYPE_META[node.type];

  // Container: show aggregated (read-only) except quiz which has own fields
  if (meta.category === "container" && node.type !== "quiz") {
    if (!aggregatedMetrics || Object.values(aggregatedMetrics).every((v) => v == null)) {
      return (
        <p className="text-[11px] text-text-muted">
          Metricas serao calculadas automaticamente a partir dos blocos internos.
        </p>
      );
    }
    return (
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">Agregadas (somente leitura)</p>
        {Object.entries(aggregatedMetrics).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
            <span className="text-[11px] text-text-secondary">{formatMetricName(key)}</span>
            <span className="text-[12px] text-text-primary font-mono tabular-nums">
              {val != null ? (key === "revenue" ? `R$ ${val}` : `${val.toFixed(1)}%`) : "—"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Quiz: own editable metrics
  if (node.type === "quiz") {
    return (
      <div className="space-y-3">
        <Field label="Taxa de Inicializacao (%)" value={String(node.metrics.initialization_rate ?? "")} onChange={(v) => onChange("initialization_rate", v ? Number(v) : null)} type="number" />
        <Field label="CTR Botao Final (%)" value={String(node.metrics.final_button_ctr ?? "")} onChange={(v) => onChange("final_button_ctr", v ? Number(v) : null)} type="number" />
      </div>
    );
  }

  // Terminal
  if (node.type === "checkout") {
    return <Field label="Taxa de Conversao (%)" value={String(node.metrics.conversion_rate ?? "")} onChange={(v) => onChange("conversion_rate", v ? Number(v) : null)} type="number" />;
  }
  if (node.type === "sale") {
    return <Field label="Receita (R$)" value={String(node.metrics.revenue ?? "")} onChange={(v) => onChange("revenue", v ? Number(v) : null)} type="number" />;
  }

  // Blocks: type-specific metrics
  const blockFields = getBlockMetricFields(node.type, parentType);
  if (blockFields.length === 0) {
    return <p className="text-[11px] text-text-muted">Sem metricas para este tipo de bloco.</p>;
  }

  return (
    <div className="space-y-3">
      {blockFields.map((f) => (
        <Field
          key={f.key}
          label={f.label}
          value={String((node.metrics as Record<string, unknown>)[f.key] ?? "")}
          onChange={(v) => onChange(f.key, v ? Number(v) : null)}
          type="number"
        />
      ))}
    </div>
  );
}

/* ── Notes Tab ── */

function NotesTab({ content, onChange }: { content: Record<string, unknown>; onChange: (val: string) => void }) {
  return (
    <textarea
      className="w-full h-64 bg-bg-3 border border-white/[0.06] rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder-text-muted resize-none outline-none focus:border-gold/30 transition-colors"
      placeholder="Anotacoes livres..."
      defaultValue={(content.notes as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/* ── Field component ── */

function Field({
  label, value, onChange, type = "text", options, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number" | "textarea" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.12em] text-text-muted mb-1.5">{label}</label>
      {type === "textarea" ? (
        <textarea
          className="w-full h-24 bg-bg-3 border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-gold/30 transition-colors resize-none"
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : type === "select" && options ? (
        <select
          className="w-full bg-bg-3 border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-gold/30 transition-colors"
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          className={cn(
            "w-full bg-bg-3 border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-gold/30 transition-colors",
            type === "number" && "font-mono"
          )}
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

/* ── Helpers ── */

function getBlockMetricFields(type: FunnelNodeType, parentType?: FunnelNodeType | null): Array<{ key: string; label: string }> {
  if (type === "headline") return [{ key: "playrate", label: "Play Rate (%)" }];
  if (type === "button") return [{ key: "ctr", label: "CTR (%)" }];
  if (type === "copy_block") {
    if (parentType === "vsl") return [{ key: "retention", label: "Retencao (%)" }];
    if (parentType === "sales_page") return [{ key: "ctr", label: "CTR (%)" }];
    if (parentType === "email" || parentType === "whatsapp") return [
      { key: "open_rate", label: "Taxa de Abertura (%)" },
      { key: "click_rate", label: "Taxa de Clique (%)" },
    ];
    return [];
  }
  return [];
}

function formatMetricName(key: string): string {
  const names: Record<string, string> = {
    playrate: "Play Rate",
    retention_media: "Retencao Media",
    ctr_botoes: "CTR Botoes",
    ctr_medio: "CTR Medio",
    open_rate_medio: "Taxa Abertura Media",
    click_rate_medio: "Taxa Clique Media",
    initialization_rate: "Taxa Inicializacao",
    final_button_ctr: "CTR Botao Final",
    conversion_rate: "Taxa Conversao",
    revenue: "Receita",
  };
  return names[key] ?? key;
}
