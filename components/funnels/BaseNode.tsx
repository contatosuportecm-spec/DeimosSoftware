// @ts-nocheck — reactflow Handle/NodeProps compat with @types/react 18.3
"use client";

import { memo, useState, useEffect } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Maximize2, Trash2, Plus, X, AlignLeft, ToggleLeft, Sliders } from "lucide-react";
import { NODE_TYPE_META, type FunnelNodeType, type AggregatedMetrics } from "@/types/funnels";
import { cn } from "@/lib/utils";

/* ── Types ── */

export interface ChildSummary {
  id: string;
  type: FunnelNodeType;
  label: string;
  metrics: Record<string, unknown>;
  content: Record<string, unknown>;
  childCount?: number;
}

export interface BaseNodeData {
  id: string;
  type: FunnelNodeType;
  label: string;
  content: Record<string, unknown>;
  metrics: Record<string, unknown>;
  aggregatedMetrics?: AggregatedMetrics;
  children?: ChildSummary[];
  has_children: boolean;
  onDrillDown?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onSelectChild?: (childId: string) => void;
  onUpdateMetric?: (nodeId: string, key: string, value: number | null) => void;
  onUpdateContent?: (nodeId: string, content: Record<string, unknown>) => void;
  onDeleteEdgesByHandle?: (nodeId: string, handleId: string) => void;
  onQuickAdd?: (sourceId: string) => void;
  parentType?: FunnelNodeType | null;
}

const MAX_SUBLINES = 6;

/* ── Metric helpers ── */

function fmtLabel(key: string): string {
  const m: Record<string, string> = {
    playrate: "PR", retention: "RT", ctr: "CTR",
    open_rate: "AB", click_rate: "CL",
    conversion_rate: "Conv", revenue: "R$",
    initialization_rate: "Init", final_button_ctr: "CTR final",
    playrate_media: "PR", retention_media: "RT", ctr_botoes: "CTR",
    ctr_medio: "CTR", open_rate_medio: "AB", click_rate_medio: "CL",
  };
  return m[key] ?? key;
}

function fmtValue(key: string, val: number): string {
  if (key === "revenue" || key.startsWith("R$")) return val >= 1000 ? `R$ ${(val / 1000).toFixed(1)}k` : `R$ ${val}`;
  return val < 10 && val % 1 !== 0 ? `${val.toFixed(1)}%` : `${Math.round(val)}%`;
}

function getChildMetricStr(child: ChildSummary, parentType?: FunnelNodeType | null): string {
  const m = child.metrics as Record<string, unknown>;
  if (child.type === "headline" && typeof m.playrate === "number") return `PR ${fmtValue("playrate", m.playrate)}`;
  if (child.type === "button" && typeof m.ctr === "number") return `CTR ${fmtValue("ctr", m.ctr)}`;
  if (child.type === "copy_block") {
    if (parentType === "vsl" && typeof m.retention === "number") return `RT ${fmtValue("retention", m.retention)}`;
    if (parentType === "sales_page" && typeof m.ctr === "number") return `CTR ${fmtValue("ctr", m.ctr)}`;
    if ((parentType === "email" || parentType === "whatsapp") && typeof m.open_rate === "number") return `AB ${fmtValue("open_rate", m.open_rate)}`;
  }
  if (child.type === "quiz_question") return "";
  if (child.type === "button_answer") {
    const opts = (child.content.options as Array<{id:string;label:string}>) ?? [];
    return opts.length > 0 ? `${opts.length} opcoes` : "";
  }
  if (child.type === "text_answer") {
    const lbl = child.content.label as string;
    return lbl ? `"${lbl}"` : "";
  }
  if (NODE_TYPE_META[child.type]?.category === "container") {
    if (typeof m.playrate === "number") return `PR ${fmtValue("playrate", m.playrate)}`;
    if (typeof m.initialization_rate === "number") return `Init ${fmtValue("initialization_rate", m.initialization_rate)}`;
    if (typeof m.ctr === "number") return `CTR ${fmtValue("ctr", m.ctr)}`;
    if (typeof m.open_rate === "number") return `AB ${fmtValue("open_rate", m.open_rate)}`;
  }
  if (child.type === "checkout" && typeof m.conversion_rate === "number") return `Conv ${fmtValue("conversion_rate", m.conversion_rate)}`;
  if (child.type === "sale" && typeof m.revenue === "number") return fmtValue("revenue", m.revenue);
  return "";
}

function getBlockHeaderMetric(data: BaseNodeData): string {
  const m = data.metrics as Record<string, unknown>;
  if (data.type === "headline" && typeof m.playrate === "number") return `PR ${fmtValue("playrate", m.playrate)}`;
  if (data.type === "button" && typeof m.ctr === "number") return `CTR ${fmtValue("ctr", m.ctr)}`;
  if (data.type === "copy_block") {
    const parts: string[] = [];
    if (typeof m.retention === "number") parts.push(`RT ${fmtValue("retention", m.retention)}`);
    if (typeof m.ctr === "number") parts.push(`CTR ${fmtValue("ctr", m.ctr)}`);
    if (typeof m.open_rate === "number") parts.push(`AB ${fmtValue("open_rate", m.open_rate)}`);
    if (typeof m.click_rate === "number") parts.push(`CL ${fmtValue("click_rate", m.click_rate)}`);
    return parts.join(" · ");
  }
  if (data.type === "checkout" && typeof m.conversion_rate === "number") return `Conv ${fmtValue("conversion_rate", m.conversion_rate)}`;
  if (data.type === "sale" && typeof m.revenue === "number") return fmtValue("revenue", m.revenue);
  return "";
}

function hasFilledMetric(child: ChildSummary): boolean {
  return Object.values(child.metrics).some((v) => typeof v === "number");
}

function getBestChildId(children: ChildSummary[]): string | null {
  let bestId: string | null = null;
  let bestVal = -Infinity;
  for (const child of children) {
    for (const val of Object.values(child.metrics)) {
      if (typeof val === "number" && val > bestVal) {
        bestVal = val;
        bestId = child.id;
      }
    }
  }
  return bestId;
}

/* ── Inline metric editor ── */

function InlineMetricInput({ value, onSave, onCancel }: { value: string; onSave: (v: number | null) => void; onCancel: () => void }) {
  const [val, setVal] = useState(value);
  return (
    <input
      autoFocus
      type="number"
      className="w-[52px] bg-white border border-amber-400/50 rounded px-1.5 py-0.5 text-[10px] text-[#1a1a2e] font-mono tabular-nums outline-none text-right shadow-sm"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.stopPropagation(); onSave(val ? Number(val) : null); }
        if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
      }}
      onBlur={() => onCancel()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    />
  );
}

/* ── normalizeQType ── */

function normalizeQType(v: string): "open" | "button" | "scale" {
  if (v === "single" || v === "multi" || v === "button") return "button";
  if (v === "scale") return "scale";
  return "open";
}

const Q_TYPE_META: Record<"open" | "button" | "scale", { label: string; Icon: typeof AlignLeft }> = {
  open:   { label: "Aberta",  Icon: AlignLeft },
  button: { label: "Botao",   Icon: ToggleLeft },
  scale:  { label: "Escala",  Icon: Sliders },
};

/* ── Helpers ── */

function getFirstMetricKey(data: BaseNodeData): string | null {
  const m = data.metrics as Record<string, unknown>;
  if (data.type === "headline") return typeof m.playrate === "number" ? "playrate" : null;
  if (data.type === "button") return typeof m.ctr === "number" ? "ctr" : null;
  if (data.type === "copy_block") {
    if (typeof m.retention === "number") return "retention";
    if (typeof m.ctr === "number") return "ctr";
    if (typeof m.open_rate === "number") return "open_rate";
    return null;
  }
  if (data.type === "checkout") return typeof m.conversion_rate === "number" ? "conversion_rate" : null;
  if (data.type === "sale") return typeof m.revenue === "number" ? "revenue" : null;
  return null;
}

function getFirstMetricKeyForChild(child: ChildSummary, parentType?: FunnelNodeType | null): string | null {
  const m = child.metrics as Record<string, unknown>;
  if (child.type === "headline") return typeof m.playrate === "number" ? "playrate" : null;
  if (child.type === "button") return typeof m.ctr === "number" ? "ctr" : null;
  if (child.type === "copy_block") {
    if (parentType === "vsl" && typeof m.retention === "number") return "retention";
    if (parentType === "sales_page" && typeof m.ctr === "number") return "ctr";
    if ((parentType === "email" || parentType === "whatsapp") && typeof m.open_rate === "number") return "open_rate";
    return null;
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */

function BaseNodeComponent({ data, selected, dragging }: NodeProps<BaseNodeData>) {
  const meta = NODE_TYPE_META[data.type];
  if (!meta) return null;
  const Icon = meta.icon;
  const isContainer = meta.category === "container";
  const isTerminal = meta.category === "terminal";
  const showDrillDown = isContainer;
  const children = data.children ?? [];

  const [editingMetric, setEditingMetric] = useState<{ nodeId: string; key: string } | null>(null);

  const cardWidth = isContainer ? 320 : (meta.cardWidth ?? 260);

  const displayChildren = data.type === "quiz" ? children.filter((c) => c.type === "quiz_question") : children;
  const showOverflow = displayChildren.length > MAX_SUBLINES;
  const visibleChildren = showOverflow ? displayChildren.slice(0, MAX_SUBLINES - 1) : displayChildren;
  const overflowCount = displayChildren.length - visibleChildren.length;

  const agg = data.aggregatedMetrics;
  const hasAgg = agg && Object.values(agg).some((v) => typeof v === "number");
  const blockMetric = !isContainer ? getBlockHeaderMetric(data) : "";
  const bestChildId = getBestChildId(displayChildren);

  // Does this card use per-option handles instead of a single right connector?
  const hasPerOptionHandles =
    (data.type === "button_answer") ||
    (data.type === "quiz_question" && normalizeQType((data.content.question_type as string) ?? "open") === "button");

  return (
    <div
      className={cn(
        "group relative rounded-xl animate-fade-in-scale",
        "border",
        dragging
          ? "shadow-[0_16px_48px_rgba(0,0,0,0.25)] cursor-grabbing"
          : "cursor-grab",
        !dragging && selected
          ? "shadow-[0_0_0_3px_var(--node-color-35),0_8px_28px_rgba(0,0,0,0.12)]"
          : !dragging && "hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
      )}
      style={{
        width: cardWidth,
        willChange: dragging ? "transform" : undefined,
        transition: dragging ? "none" : "border-color 150ms ease, box-shadow 150ms ease",
        "--node-color": meta.color,
        "--node-color-35": `${meta.color}50`,
        background: "#FFFFFF",
        borderColor: dragging ? "#d0d0d0" : selected ? `${meta.color}70` : "#E5E5EA",
        borderLeftWidth: "4px",
        borderLeftColor: meta.color,
      } as React.CSSProperties}
      onDoubleClick={(e) => { e.stopPropagation(); if (showDrillDown) data.onDrillDown?.(data.id); }}
    >
      {/* ══ HANDLES — standardized hierarchy ══
           All cards: left target (receive connections)
           Cards with options (quiz_question button, button_answer): per-option mini + only (inside body)
           Cards without options: + connector on right + subtle top/bottom handles
      */}
      {/* Left target — every card can receive */}
      <Handle id="left" type="target" position={Position.Left} className="funnel-handle !-left-[10px]" />

      {/* Right connector (+) + top/bottom — only cards WITHOUT per-option handles */}
      {!hasPerOptionHandles && (
        <>
          <Handle id="top" type="source" position={Position.Top} className="funnel-handle !-top-[10px]" />
          <Handle id="bottom" type="source" position={Position.Bottom} className="funnel-handle !-bottom-[10px]" />
          <div className="absolute top-1/2 connector-plus" style={{ "--connector-color": meta.color, right: "-32px", transform: "translateY(-50%)" } as React.CSSProperties}>
            <Handle id="right" type="source" position={Position.Right} className="connector-plus-handle" />
          </div>
        </>
      )}

      {/* ═══ HEADER — Title + Type Tag ═══ */}
      <div
        className="flex items-center gap-2 pl-5 pr-3 pt-3.5 pb-2.5"
        style={{ background: `linear-gradient(90deg, ${meta.color}18 0%, ${meta.color}08 50%, transparent 100%)`, borderRadius: "12px 12px 0 0" }}
      >
        <p className="text-[14px] font-semibold text-[#1C1C1E] leading-tight truncate flex-1 min-w-0">
          {data.label}
        </p>
        {/* Type pill */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}20` }}
        >
          <Icon size={11} strokeWidth={1.5} style={{ color: meta.color }} />
          <span className="text-[9px] font-medium tracking-wide" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
        {/* Hover actions — colored icons */}
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {showDrillDown && (
            <button
              onClick={(e) => { e.stopPropagation(); data.onDrillDown?.(data.id); }}
              className="p-1.5 rounded-md transition-colors hover:bg-black/[0.05]"
              style={{ color: meta.color }}
              title="Abrir"
            >
              <Maximize2 size={13} strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); data.onDelete?.(data.id); }}
            className="p-1.5 rounded-md text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Excluir"
          >
            <Trash2 size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ═══ CONTAINER: children list ═══ */}
      {isContainer && (
        <>
          {displayChildren.length > 0 ? (
            <div className="pl-5 pr-3 pb-2 pt-0.5">
              {visibleChildren.map((child) => {
                const childMeta = NODE_TYPE_META[child.type];
                const ChildIcon = childMeta?.icon;
                const metricStr = getChildMetricStr(child, data.type);
                const isEditingThis = editingMetric?.nodeId === child.id;
                const hasMet = hasFilledMetric(child);
                const isBest = child.id === bestChildId;

                return (
                  <div
                    key={child.id}
                    className={cn(
                      "flex items-center gap-2 h-[30px] rounded-lg px-2 -mx-2 cursor-pointer transition-colors",
                      isBest ? "bg-amber-50 hover:bg-amber-100/80" : "hover:bg-[#F5F5F7]"
                    )}
                    onClick={(e) => { e.stopPropagation(); data.onSelectChild?.(child.id); }}
                  >
                    {ChildIcon && <ChildIcon size={12} strokeWidth={1.5} style={{ color: childMeta.color }} className="flex-shrink-0" />}
                    <span className={cn("text-[12px] truncate flex-1", isBest ? "text-[#1C1C1E] font-medium" : "text-[#6B6B73]")}>{child.label}</span>
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", hasMet ? (isBest ? "bg-amber-400" : "bg-emerald-400") : "bg-[#E0E0E4]")} />
                    {metricStr ? (
                      <span
                        className={cn(
                          "text-[10px] font-mono tabular-nums rounded px-1.5 py-0.5 flex-shrink-0 cursor-default",
                          isBest ? "text-amber-600 bg-amber-50 font-semibold" : "text-[#8A8A8E] bg-[#F5F5F7]"
                        )}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          const key = getFirstMetricKeyForChild(child, data.type);
                          if (key) setEditingMetric({ nodeId: child.id, key });
                        }}
                      >
                        {isEditingThis ? (
                          <InlineMetricInput
                            value={String((child.metrics as Record<string, unknown>)[editingMetric!.key] ?? "")}
                            onSave={(v) => { data.onUpdateMetric?.(child.id, editingMetric!.key, v); setEditingMetric(null); }}
                            onCancel={() => setEditingMetric(null)}
                          />
                        ) : metricStr}
                      </span>
                    ) : null}
                  </div>
                );
              })}
              {showOverflow && (
                <span className="text-[11px] mt-1 mb-1 block font-medium" style={{ color: meta.color }}>
                  + {overflowCount} mais
                </span>
              )}
            </div>
          ) : (
            <div className="pl-5 pr-3 pb-3 pt-1">
              <span className="text-[12px] text-[#AFAFB5] italic">vazio — duplo-clique para abrir</span>
            </div>
          )}

          {/* Footer: aggregated metrics */}
          {(hasAgg || data.type === "quiz") && (
            <div className="border-t border-[#F0F0F4] pl-5 pr-3 py-2 flex items-center gap-1.5 flex-wrap">
              {hasAgg && Object.entries(agg).map(([key, val]) => {
                if (typeof val !== "number") return null;
                return (
                  <span key={key} className="text-[10px] font-mono tabular-nums text-[#8A8A8E]">
                    {fmtLabel(key)} {fmtValue(key, val)}
                  </span>
                );
              })}
              {data.type === "quiz" && typeof (data.metrics as Record<string, unknown>).initialization_rate === "number" && (
                <span className="text-[10px] font-mono tabular-nums text-[#8A8A8E]">
                  Init {fmtValue("initialization_rate", (data.metrics as Record<string, unknown>).initialization_rate as number)}
                </span>
              )}
              {data.type === "quiz" && typeof (data.metrics as Record<string, unknown>).final_button_ctr === "number" && (
                <span className="text-[10px] font-mono tabular-nums text-[#8A8A8E]">
                  CTR final {fmtValue("final_button_ctr", (data.metrics as Record<string, unknown>).final_button_ctr as number)}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ BLOCK: body area ═══ */}
      {!isContainer && !isTerminal && (
        <div className="border-t border-[#F0F0F4] pl-5 pr-3 py-3 space-y-2">
          {data.type === "headline" && (
            data.content.text ? (
              <p className="text-[16px] text-[#1C1C1E] font-medium leading-snug line-clamp-3">
                &ldquo;{String(data.content.text)}&rdquo;
              </p>
            ) : (
              <p className="text-[12px] text-[#AFAFB5] italic">Sem headline definida</p>
            )
          )}
          {data.type === "copy_block" && (
            data.content.body ? (
              <p className="text-[13px] text-[#4A4A52] leading-relaxed line-clamp-3">
                {String(data.content.body).slice(0, 140)}{String(data.content.body).length > 140 ? "..." : ""}
              </p>
            ) : (
              <p className="text-[12px] text-[#AFAFB5] italic">Sem conteudo</p>
            )
          )}
          {data.type === "button" && (
            <div
              className="px-4 py-2.5 rounded-lg text-center font-semibold text-[12px]"
              style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}25` }}
            >
              {data.content.label ? String(data.content.label) : "Button"}
            </div>
          )}
          {data.type === "quiz_question" && <QuizQuestionBody data={data} />}
          {data.type === "button_answer" && <ButtonAnswerBody data={data} />}
          {data.type === "text_answer" && <TextAnswerBody data={data} />}
          {blockMetric && (
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className="text-[11px] font-mono tabular-nums text-[#6B6B73] bg-[#F5F5F7] rounded-lg px-2.5 py-1 cursor-default"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  const key = getFirstMetricKey(data);
                  if (key) setEditingMetric({ nodeId: data.id, key });
                }}
              >
                {editingMetric?.nodeId === data.id ? (
                  <InlineMetricInput
                    value={String((data.metrics as Record<string, unknown>)[editingMetric.key] ?? "")}
                    onSave={(v) => { data.onUpdateMetric?.(data.id, editingMetric.key, v); setEditingMetric(null); }}
                    onCancel={() => setEditingMetric(null)}
                  />
                ) : blockMetric}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══ TERMINAL: body area ═══ */}
      {isTerminal && (
        <div className="border-t border-[#F0F0F4] pl-5 pr-3 py-3">
          {blockMetric ? (
            <span
              className="text-[14px] font-mono font-bold tabular-nums rounded-lg px-3 py-1.5 inline-block"
              style={{ background: `${meta.color}12`, color: meta.color }}
            >
              {blockMetric}
            </span>
          ) : (
            <p className="text-[12px] text-[#AFAFB5] italic">Sem metricas</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ Quiz Question Body ═══ */

function QuizQuestionBody({ data }: { data: BaseNodeData }) {
  const qType = normalizeQType((data.content.question_type as string) ?? "open");
  const question = (data.content.question as string) ?? "";
  const propsOptions = (data.content.options as Array<{ id: string; label: string }>) ?? [];
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>(propsOptions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const propsSyncKey = propsOptions.map((o) => `${o.id}:${o.label}`).join(",");
  useEffect(() => {
    setOptions((data.content.options as Array<{ id: string; label: string }>) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsSyncKey]);

  const saveOption = (optId: string, newLabel: string) => {
    const updated = options.map((o) => o.id === optId ? { ...o, label: newLabel } : o);
    setOptions(updated);
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    setEditingId(null);
  };

  const addOption = () => {
    const id = crypto.randomUUID();
    const updated = [...options, { id, label: "" }];
    setOptions(updated);
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    setEditingId(id);
    setEditVal("");
  };

  const removeOption = (optId: string) => {
    const updated = options.filter((o) => o.id !== optId);
    setOptions(updated);
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    data.onDeleteEdgesByHandle?.(data.id, `option-${optId}`);
  };

  const { label: typeLabel, Icon: TypeIcon } = Q_TYPE_META[qType];

  return (
    <div className="space-y-2">
      {question ? (
        <p className="text-[14px] text-[#1C1C1E]/90 leading-snug line-clamp-2">{question}</p>
      ) : (
        <p className="text-[12px] text-[#AFAFB5] italic">Sem pergunta definida</p>
      )}

      <div className="flex items-center gap-1 py-0.5">
        <TypeIcon size={10} strokeWidth={1.5} className="text-[#C084FC]/70" />
        <span className="text-[9px] uppercase tracking-[0.12em] text-[#C084FC]/70">{typeLabel}</span>
      </div>

      {qType === "button" && (
        <div className="space-y-1 pt-0.5">
          {options.length > 0 ? options.map((opt) => (
            <div key={opt.id} className="group/opt flex items-center gap-1.5 relative">
              {editingId === opt.id ? (
                <input
                  autoFocus
                  className="flex-1 bg-[#F5F5F7] border border-[#C084FC]/40 rounded-lg px-2.5 py-1.5 text-[12px] text-[#1C1C1E] outline-none"
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.stopPropagation(); saveOption(opt.id, editVal); }
                    if (e.key === "Escape") { e.stopPropagation(); setEditingId(null); }
                  }}
                  onBlur={() => saveOption(opt.id, editVal)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div
                  className="flex-1 bg-[#F5F5F7] rounded-lg px-2.5 py-1.5 text-[12px] text-[#4A4A52] cursor-text hover:bg-[#EBEBEF] transition-colors truncate"
                  onClick={(e) => { e.stopPropagation(); setEditingId(opt.id); setEditVal(opt.label); }}
                >
                  {opt.label || <span className="text-[#AFAFB5] italic">Sem texto</span>}
                </div>
              )}
              <button
                className="p-0.5 rounded text-[#C0C0C8] hover:text-red-400 opacity-0 group-hover/opt:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); removeOption(opt.id); }}
              >
                <X size={11} strokeWidth={2} />
              </button>
              {/* Visible connector dot per option */}
              <Handle
                id={`option-${opt.id}`}
                type="source"
                position={Position.Right}
                className="option-handle"
              />
            </div>
          )) : (
            <p className="text-[11px] text-[#AFAFB5] italic">Nenhuma opcao</p>
          )}
          <button
            className="flex items-center gap-1 py-0.5 text-[11px] text-[#8A8A8E] hover:text-[#C084FC] transition-colors"
            onClick={(e) => { e.stopPropagation(); addOption(); }}
          >
            <Plus size={11} strokeWidth={2} /> adicionar opcao
          </button>
        </div>
      )}

      {qType === "open" && (
        <div className="px-2.5 py-1.5 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] text-[11px] text-[#8A8A8E] italic">
          Resposta aberta...
        </div>
      )}

      {qType === "scale" && (
        <div className="flex items-center gap-1 px-1 py-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div key={n} className="flex-1 h-1.5 rounded-full" style={{ background: `rgba(192,132,252,${0.1 + n * 0.1})` }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ Button Answer Body ═══ */

function ButtonAnswerBody({ data }: { data: BaseNodeData }) {
  const propsOptions = (data.content.options as Array<{ id: string; label: string }>) ?? [];
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>(propsOptions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const propsSyncKey = propsOptions.map((o) => `${o.id}:${o.label}`).join(",");
  useEffect(() => {
    setOptions((data.content.options as Array<{ id: string; label: string }>) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsSyncKey]);

  const saveOption = (optId: string, newLabel: string) => {
    const updated = options.map((o) => o.id === optId ? { ...o, label: newLabel } : o);
    setOptions(updated);
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    setEditingId(null);
  };

  const addOption = () => {
    const id = crypto.randomUUID();
    const updated = [...options, { id, label: "" }];
    setOptions(updated);
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    setEditingId(id);
    setEditVal("");
  };

  const removeOption = (optId: string) => {
    const updated = options.filter((o) => o.id !== optId);
    setOptions(updated);
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    data.onDeleteEdgesByHandle?.(data.id, `option-${optId}`);
  };

  return (
    <div className="space-y-1.5">
      {options.length > 0 ? (
        options.map((opt) => (
          <div key={opt.id} className="group/opt flex items-center gap-1.5 relative">
            {editingId === opt.id ? (
              <input
                autoFocus
                className="flex-1 bg-[#F5F5F7] border border-amber-400/40 rounded-lg px-2.5 py-1.5 text-[12px] text-[#1C1C1E] outline-none"
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.stopPropagation(); saveOption(opt.id, editVal); }
                  if (e.key === "Escape") { e.stopPropagation(); setEditingId(null); }
                }}
                onBlur={() => saveOption(opt.id, editVal)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className="flex-1 bg-[#F5F5F7] rounded-lg px-2.5 py-1.5 text-[12px] text-[#4A4A52] cursor-text hover:bg-[#EBEBEF] transition-colors truncate"
                onClick={(e) => { e.stopPropagation(); setEditingId(opt.id); setEditVal(opt.label); }}
              >
                {opt.label || <span className="text-[#AFAFB5] italic">Sem texto</span>}
              </div>
            )}
            <button
              className="p-0.5 rounded text-[#C0C0C8] hover:text-red-400 opacity-0 group-hover/opt:opacity-100 transition-opacity flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); removeOption(opt.id); }}
            >
              <X size={11} strokeWidth={2} />
            </button>
            {/* Visible connector dot per option */}
            <Handle
              id={`option-${opt.id}`}
              type="source"
              position={Position.Right}
              className="option-handle"
            />
          </div>
        ))
      ) : (
        <p className="text-[11px] text-[#AFAFB5] italic">Nenhuma opcao · clique em + para adicionar</p>
      )}
      <button
        className="flex items-center gap-1 py-1 text-[11px] text-[#8A8A8E] hover:text-amber-500 transition-colors"
        onClick={(e) => { e.stopPropagation(); addOption(); }}
      >
        <Plus size={11} strokeWidth={2} />
        adicionar opcao
      </button>
    </div>
  );
}

/* ═══ Text Answer Body ═══ */

function TextAnswerBody({ data }: { data: BaseNodeData }) {
  const label = (data.content.label as string) ?? "";
  const placeholder = (data.content.placeholder as string) ?? "";
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(label);

  const save = () => {
    data.onUpdateContent?.(data.id, { ...data.content, label: editVal });
    setEditing(false);
  };

  return (
    <div className="space-y-1.5">
      {editing ? (
        <input
          autoFocus
          className="w-full bg-[#F5F5F7] border border-amber-400/40 rounded-lg px-2.5 py-1.5 text-[12px] text-[#1C1C1E] outline-none"
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.stopPropagation(); save(); }
            if (e.key === "Escape") { e.stopPropagation(); setEditing(false); }
          }}
          onBlur={save}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="bg-[#F5F5F7] rounded-lg px-2.5 py-1.5 text-[12px] text-[#4A4A52] cursor-text hover:bg-[#EBEBEF] transition-colors"
          onClick={(e) => { e.stopPropagation(); setEditing(true); setEditVal(label); }}
        >
          {label || <span className="text-[#AFAFB5] italic">Clique para definir label</span>}
        </div>
      )}
      {placeholder && (
        <p className="text-[10px] text-[#8A8A8E] px-1">placeholder: &quot;{placeholder}&quot;</p>
      )}
    </div>
  );
}

export const BaseNode = memo(BaseNodeComponent);
