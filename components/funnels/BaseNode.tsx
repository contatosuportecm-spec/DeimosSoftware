// @ts-nocheck — reactflow Handle/NodeProps compat with @types/react 18.3
"use client";

import { memo, useCallback, useState, useEffect } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Maximize2, Trash2, Type, Square, Plus, BarChart2, X, AlignLeft, ToggleLeft, Sliders } from "lucide-react";
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
    playrate_media: "PR medio", retention_media: "RT medio", ctr_botoes: "CTR",
    ctr_medio: "CTR medio", open_rate_medio: "AB medio", click_rate_medio: "CL medio",
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
    if (typeof m.playrate === "number") return `PR med ${fmtValue("playrate", m.playrate)}`;
    if (typeof m.initialization_rate === "number") return `Init ${fmtValue("initialization_rate", m.initialization_rate)}`;
    if (typeof m.ctr === "number") return `CTR med ${fmtValue("ctr", m.ctr)}`;
    if (typeof m.open_rate === "number") return `AB med ${fmtValue("open_rate", m.open_rate)}`;
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

/* ── Inline metric editor ── */

function InlineMetricInput({ value, onSave, onCancel }: { value: string; onSave: (v: number | null) => void; onCancel: () => void }) {
  const [val, setVal] = useState(value);
  return (
    <input
      autoFocus
      type="number"
      className="w-[52px] bg-[#0d1117] border border-[#FF8A1F]/40 rounded-md px-1.5 py-0.5 text-[10px] text-white font-mono tabular-nums outline-none text-right"
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

/* ── Category labels for child groups ── */

const CATEGORY_MAP: Record<string, string> = {
  headline: "BLOCOS",
  copy_block: "BLOCOS",
  button: "ACAO",
  quiz_question: "PERGUNTAS",
  button_answer: "RESPOSTAS",
  text_answer: "RESPOSTAS",
};

const CATEGORY_ORDER = ["BLOCOS", "ACAO", "PERGUNTAS", "RESPOSTAS"];

function groupChildren(children: ChildSummary[]): { label: string; items: ChildSummary[] }[] {
  const map: Record<string, ChildSummary[]> = {};
  for (const child of children) {
    const cat = CATEGORY_MAP[child.type] ?? "BLOCOS";
    if (!map[cat]) map[cat] = [];
    map[cat].push(child);
  }
  return CATEGORY_ORDER
    .filter((cat) => map[cat]?.length)
    .map((cat) => ({ label: cat, items: map[cat] }));
}

/** Find the child with the best (highest) numeric metric value */
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

  const cardWidth = isContainer ? 300 : (meta.cardWidth ?? 240);

  // Children for display
  const displayChildren = data.type === "quiz" ? children.filter((c) => c.type === "quiz_question") : children;
  const showOverflow = displayChildren.length > MAX_SUBLINES;
  const visibleChildren = showOverflow ? displayChildren.slice(0, MAX_SUBLINES - 1) : displayChildren;
  const overflowCount = displayChildren.length - visibleChildren.length;

  // Aggregated
  const agg = data.aggregatedMetrics;
  const hasAgg = agg && Object.values(agg).some((v) => typeof v === "number");
  const blockMetric = !isContainer ? getBlockHeaderMetric(data) : "";

  // Best performing child
  const bestChildId = getBestChildId(displayChildren);

  // Group children
  const childGroups = groupChildren(visibleChildren);

  return (
    <div
      className={cn(
        "group relative rounded-xl",
        "bg-[#0f1219]/90 backdrop-blur-sm",
        "border",
        dragging
          ? "shadow-[0_8px_40px_rgba(0,0,0,0.6)] border-white/30 cursor-grabbing"
          : "cursor-grab",
        !dragging && (selected
          ? "border-[#FF8A1F]/50 shadow-[0_0_0_1px_rgba(255,138,31,0.15),0_4px_24px_rgba(0,0,0,0.4)]"
          : "border-[#1e2230] hover:border-[#2a3040] shadow-[0_2px_12px_rgba(0,0,0,0.3)]")
      )}
      style={{ width: cardWidth, willChange: dragging ? "transform" : undefined, transition: dragging ? "none" : "border-color 150ms ease, box-shadow 150ms ease" }}
      onDoubleClick={(e) => { e.stopPropagation(); if (showDrillDown) data.onDrillDown?.(data.id); }}
    >
      {/* ── Handles ── */}
      {data.type === "quiz_question" ? (
        <>
          {/* Quiz question: target on left, per-option source handles on right for button type */}
          <Handle id="target" type="target" position={Position.Left} className="funnel-handle !-left-[6px]" />
          {(() => {
            const qType = normalizeQType((data.content.question_type as string) ?? "open");
            const opts = (data.content.options as Array<{id:string;label:string}>) ?? [];
            if (qType === "button" && opts.length > 0) {
              // header(56) + border+pad(13) + question-2lines(38) + type-badge(22) + gap(8) = 137
              return opts.map((opt, i) => (
                <Handle
                  key={opt.id}
                  id={`option-${opt.id}`}
                  type="source"
                  position={Position.Right}
                  style={{ top: `${137 + i * 34 + 17}px` }}
                  className="funnel-handle !-right-[6px]"
                />
              ));
            }
            return <Handle id="source" type="source" position={Position.Right} className="funnel-handle !-right-[6px]" />;
          })()}
        </>
      ) : data.type === "button_answer" ? (
        <>
          {/* Button answer: target on left, dynamic option handles on right */}
          <Handle id="target" type="target" position={Position.Left} className="funnel-handle !-left-[6px]" />
          {((data.content.options as Array<{id:string;label:string}>) ?? []).map((opt, i) => {
            const top = 44 + 8 + i * 36 + 18;
            return (
              <Handle
                key={opt.id}
                id={`option-${opt.id}`}
                type="source"
                position={Position.Right}
                style={{ top: `${top}px` }}
                className="funnel-handle !-right-[6px]"
              />
            );
          })}
        </>
      ) : data.type === "text_answer" ? (
        <>
          <Handle id="target" type="target" position={Position.Left} className="funnel-handle !-left-[6px]" />
          <Handle id="source" type="source" position={Position.Right} className="funnel-handle !-right-[6px]" />
        </>
      ) : (
        <>
          <Handle id="top-target" type="target" position={Position.Top} className="funnel-handle !-top-[6px]" />
          <Handle id="top-source" type="source" position={Position.Top} className="funnel-handle !-top-[6px]" />
          <Handle id="right-target" type="target" position={Position.Right} className="funnel-handle !-right-[6px]" />
          <Handle id="right-source" type="source" position={Position.Right} className="funnel-handle !-right-[6px]" />
          <Handle id="bottom-target" type="target" position={Position.Bottom} className="funnel-handle !-bottom-[6px]" />
          <Handle id="bottom-source" type="source" position={Position.Bottom} className="funnel-handle !-bottom-[6px]" />
          <Handle id="left-target" type="target" position={Position.Left} className="funnel-handle !-left-[6px]" />
          <Handle id="left-source" type="source" position={Position.Left} className="funnel-handle !-left-[6px]" />
        </>
      )}

      {/* ── Quick-add ── */}
      <button
        className="absolute -right-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FF6B00] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-[0_2px_12px_rgba(255,107,0,0.3)] hover:scale-110 hover:shadow-[0_2px_20px_rgba(255,107,0,0.5)]"
        onClick={(e) => { e.stopPropagation(); data.onQuickAdd?.(data.id); }}
        title="Criar proximo no conectado"
      >
        <Plus size={13} strokeWidth={2.5} />
      </button>

      {/* ═══ HEADER ═══ */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
        {/* Icon badge */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}
        >
          <Icon size={16} strokeWidth={1.5} style={{ color: meta.color }} />
        </div>
        {/* Type + Title */}
        <div className="flex-1 min-w-0">
          <span className="text-[9px] uppercase tracking-[0.15em] font-medium block" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <p className="text-[15px] font-semibold text-white leading-tight truncate">
            {data.label}
          </p>
        </div>
        {/* Actions — visible on hover */}
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {showDrillDown && (
            <button
              onClick={(e) => { e.stopPropagation(); data.onDrillDown?.(data.id); }}
              className="p-1 rounded-md text-[#4a4a5a] hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Abrir"
            >
              <Maximize2 size={13} strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); data.onDelete?.(data.id); }}
            className="p-1 rounded-md text-[#4a4a5a] hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Excluir"
          >
            <Trash2 size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ═══ CONTAINER: children sub-lines ═══ */}
      {isContainer && (
        <>
          {displayChildren.length > 0 ? (
            <div className="px-4 pb-1">
              {childGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[8px] uppercase tracking-[0.2em] text-[#4a4a5a] mt-2.5 mb-1">{group.label}</p>
                  {group.items.map((child) => {
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
                          "flex items-center gap-2 h-[28px] rounded-md px-1.5 -mx-1.5 cursor-pointer transition-colors",
                          isBest ? "bg-nova/[0.06] hover:bg-nova/[0.1]" : "hover:bg-white/[0.03]"
                        )}
                        onClick={(e) => { e.stopPropagation(); data.onSelectChild?.(child.id); }}
                        onDoubleClick={(e) => { e.stopPropagation(); data.onDrillDown?.(data.id); }}
                      >
                        {ChildIcon && <ChildIcon size={12} strokeWidth={1.5} style={{ color: childMeta.color }} className="flex-shrink-0" />}
                        <span className={cn("text-[12px] truncate flex-1", isBest ? "text-white font-medium" : "text-[#c0c0cc]")}>{child.label}</span>
                        {/* Status dot */}
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", hasMet ? (isBest ? "bg-nova" : "bg-emerald-400") : "bg-[#2a2a35]")} />
                        {/* Metric pill */}
                        {metricStr ? (
                          <span
                            className={cn(
                              "text-[10px] font-mono tabular-nums rounded-md px-1.5 py-0.5 flex-shrink-0 cursor-default",
                              isBest ? "text-nova bg-nova/10 font-semibold" : "text-[#8899bb] bg-[#151a25]"
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
                </div>
              ))}
              {showOverflow && (
                <button
                  className="text-[11px] text-[#FF8A1F] hover:text-[#FFa040] mt-1 mb-1 transition-colors"
                  onClick={(e) => { e.stopPropagation(); data.onDrillDown?.(data.id); }}
                >
                  + {overflowCount} mais
                </button>
              )}
            </div>
          ) : (
            <div
              className="px-4 pb-3 pt-1 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); data.onDrillDown?.(data.id); }}
            >
              <span className="text-[12px] text-[#4a4a5a] italic">vazio — clique para abrir</span>
            </div>
          )}

          {/* ── Footer: aggregated metrics ── */}
          {(hasAgg || data.type === "quiz") && (
            <div className="border-t border-[#1a1e2a] px-4 py-2 flex items-center gap-2">
              <BarChart2 size={11} strokeWidth={1.5} className="text-[#4a4a5a] flex-shrink-0" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {hasAgg && Object.entries(agg).map(([key, val]) => {
                  if (typeof val !== "number") return null;
                  return (
                    <span key={key} className="text-[10px] font-mono tabular-nums text-[#6a6a7a]">
                      {fmtLabel(key)} {fmtValue(key, val)}
                    </span>
                  );
                })}
                {data.type === "quiz" && typeof (data.metrics as Record<string, unknown>).initialization_rate === "number" && (
                  <span className="text-[10px] font-mono tabular-nums text-[#6a6a7a]">
                    Init {fmtValue("initialization_rate", (data.metrics as Record<string, unknown>).initialization_rate as number)}
                  </span>
                )}
                {data.type === "quiz" && typeof (data.metrics as Record<string, unknown>).final_button_ctr === "number" && (
                  <span className="text-[10px] font-mono tabular-nums text-[#6a6a7a]">
                    CTR final {fmtValue("final_button_ctr", (data.metrics as Record<string, unknown>).final_button_ctr as number)}
                  </span>
                )}
                {/* Separator dots between values */}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ BLOCK: body area ═══ */}
      {!isContainer && !isTerminal && (
        <div className="border-t border-[#1a1e2a] px-4 py-3 space-y-2">
          {/* Content — prominent */}
          {data.type === "headline" && (
            data.content.text ? (
              <p className="text-[14px] text-white/90 font-medium leading-snug line-clamp-3">
                &ldquo;{String(data.content.text)}&rdquo;
              </p>
            ) : (
              <p className="text-[12px] text-[#3a3a4a] italic">Sem headline definida</p>
            )
          )}
          {data.type === "copy_block" && (
            data.content.body ? (
              <p className="text-[12px] text-[#b0b0c0] leading-relaxed line-clamp-3">
                {String(data.content.body).slice(0, 120)}{String(data.content.body).length > 120 ? "..." : ""}
              </p>
            ) : (
              <p className="text-[12px] text-[#3a3a4a] italic">Sem conteudo</p>
            )
          )}
          {data.type === "button" && (
            <div className="px-4 py-2 rounded-lg bg-[#1a1e28] border border-[#252a38] text-center">
              <span className="text-[12px] text-white font-semibold">{data.content.label ? String(data.content.label) : "Button"}</span>
            </div>
          )}
          {data.type === "quiz_question" && (
            <QuizQuestionBody data={data} />
          )}
          {/* ── Button Answer: options with individual handles ── */}
          {data.type === "button_answer" && (
            <ButtonAnswerBody data={data} />
          )}
          {/* ── Text Answer: single label field ── */}
          {data.type === "text_answer" && (
            <TextAnswerBody data={data} />
          )}
          {/* Metric — prominent pill below content */}
          {blockMetric && (
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className="text-[11px] font-mono tabular-nums text-[#8899bb] bg-[#0d1117] border border-[#1a1e2a] rounded-lg px-2.5 py-1 cursor-default"
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
        <div className="border-t border-[#1a1e2a] px-4 py-3">
          {blockMetric ? (
            <span className="text-[11px] font-mono tabular-nums text-[#8899bb] bg-[#0d1117] border border-[#1a1e2a] rounded-lg px-2.5 py-1">{blockMetric}</span>
          ) : (
            <p className="text-[12px] text-[#3a3a4a] italic">Sem metricas</p>
          )}
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

  // Sync when options are added/removed externally
  const propsIdsKey = propsOptions.map((o) => o.id).join(",");
  useEffect(() => {
    setOptions((data.content.options as Array<{ id: string; label: string }>) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsIdsKey]);

  const saveOption = (optId: string, newLabel: string) => {
    const updated = options.map((o) => o.id === optId ? { ...o, label: newLabel } : o);
    setOptions(updated);
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    setEditingId(null);
  };

  const addOption = () => {
    const id = crypto.randomUUID();
    const updated = [...options, { id, label: "" }];
    setOptions(updated); // immediate visual update
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    setEditingId(id);
    setEditVal("");
  };

  const removeOption = (optId: string) => {
    const updated = options.filter((o) => o.id !== optId);
    setOptions(updated); // immediate visual update
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    data.onDeleteEdgesByHandle?.(data.id, `option-${optId}`);
  };

  return (
    <div className="space-y-1.5">
      {options.length > 0 ? (
        options.map((opt) => (
          <div key={opt.id} className="group/opt flex items-center gap-1.5 px-1">
            {editingId === opt.id ? (
              <input
                autoFocus
                className="flex-1 bg-[#1a1a20] border border-[#FF8A1F]/30 rounded-md px-2.5 py-1.5 text-[12px] text-white outline-none"
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
                className="flex-1 bg-[#1a1a20] rounded-md px-2.5 py-1.5 text-[12px] text-[#c0c0cc] cursor-text hover:bg-[#1e1e28] transition-colors truncate"
                onClick={(e) => { e.stopPropagation(); setEditingId(opt.id); setEditVal(opt.label); }}
              >
                {opt.label || <span className="text-[#3a3a4a] italic">Sem texto</span>}
              </div>
            )}
            <button
              className="p-0.5 rounded text-[#3a3a4a] hover:text-red-400 opacity-0 group-hover/opt:opacity-100 transition-opacity flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); removeOption(opt.id); }}
            >
              <X size={11} strokeWidth={2} />
            </button>
          </div>
        ))
      ) : (
        <p className="text-[11px] text-[#3a3a4a] italic px-1">Nenhuma opcao · clique em + para adicionar</p>
      )}
      <button
        className="flex items-center gap-1 px-1 py-1 text-[11px] text-[#5a5a6a] hover:text-nova transition-colors"
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
          className="w-full bg-[#1a1a20] border border-[#FF8A1F]/30 rounded-md px-2.5 py-1.5 text-[12px] text-white outline-none"
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
          className="bg-[#1a1a20] rounded-md px-2.5 py-1.5 text-[12px] text-[#c0c0cc] cursor-text hover:bg-[#1e1e28] transition-colors"
          onClick={(e) => { e.stopPropagation(); setEditing(true); setEditVal(label); }}
        >
          {label || <span className="text-[#3a3a4a] italic">Clique para definir label</span>}
        </div>
      )}
      {placeholder && (
        <p className="text-[10px] text-[#4a4a5a] px-1">placeholder: &quot;{placeholder}&quot;</p>
      )}
    </div>
  );
}

/* ── normalizeQType: backward compat for old "single"/"multi" values ── */

function normalizeQType(v: string): "open" | "button" | "scale" {
  if (v === "single" || v === "multi" || v === "button") return "button";
  if (v === "scale") return "scale";
  return "open";
}

const Q_TYPE_META: Record<"open" | "button" | "scale", { label: string; Icon: typeof AlignLeft }> = {
  open:   { label: "Aberta",  Icon: AlignLeft },
  button: { label: "Botão",   Icon: ToggleLeft },
  scale:  { label: "Escala",  Icon: Sliders },
};

/* ═══ Quiz Question Body ═══ */

function QuizQuestionBody({ data }: { data: BaseNodeData }) {
  const qType = normalizeQType((data.content.question_type as string) ?? "open");
  const question = (data.content.question as string) ?? "";
  const propsOptions = (data.content.options as Array<{ id: string; label: string }>) ?? [];
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>(propsOptions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  // Sync when options are added/removed externally (e.g. from the inspector)
  const propsIdsKey = propsOptions.map((o) => o.id).join(",");
  useEffect(() => {
    setOptions((data.content.options as Array<{ id: string; label: string }>) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsIdsKey]);

  const saveOption = (optId: string, newLabel: string) => {
    const updated = options.map((o) => o.id === optId ? { ...o, label: newLabel } : o);
    setOptions(updated);
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    setEditingId(null);
  };

  const addOption = () => {
    const id = crypto.randomUUID();
    const updated = [...options, { id, label: "" }];
    setOptions(updated); // immediate visual update
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    setEditingId(id);
    setEditVal("");
  };

  const removeOption = (optId: string) => {
    const updated = options.filter((o) => o.id !== optId);
    setOptions(updated); // immediate visual update
    data.onUpdateContent?.(data.id, { ...data.content, options: updated });
    data.onDeleteEdgesByHandle?.(data.id, `option-${optId}`);
  };

  const { label: typeLabel, Icon: TypeIcon } = Q_TYPE_META[qType];

  return (
    <div className="space-y-2">
      {/* Question text */}
      {question ? (
        <p className="text-[13px] text-white/85 leading-snug line-clamp-2">{question}</p>
      ) : (
        <p className="text-[12px] text-[#3a3a4a] italic">Sem pergunta definida</p>
      )}

      {/* Type badge */}
      <div className="flex items-center gap-1 py-0.5">
        <TypeIcon size={10} strokeWidth={1.5} className="text-[#C084FC]/60" />
        <span className="text-[9px] uppercase tracking-[0.12em] text-[#C084FC]/60">{typeLabel}</span>
      </div>

      {/* Button options with per-option handles */}
      {qType === "button" && (
        <div className="space-y-1 pt-0.5">
          {options.length > 0 ? options.map((opt) => (
            <div key={opt.id} className="group/opt flex items-center gap-1.5 px-1">
              {editingId === opt.id ? (
                <input
                  autoFocus
                  className="flex-1 bg-[#1a1a20] border border-[#C084FC]/30 rounded-md px-2.5 py-1.5 text-[12px] text-white outline-none"
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
                  className="flex-1 bg-[#1a1a20] rounded-md px-2.5 py-1.5 text-[12px] text-[#c0c0cc] cursor-text hover:bg-[#1e1e28] transition-colors truncate"
                  onClick={(e) => { e.stopPropagation(); setEditingId(opt.id); setEditVal(opt.label); }}
                >
                  {opt.label || <span className="text-[#3a3a4a] italic">Sem texto</span>}
                </div>
              )}
              <button
                className="p-0.5 rounded text-[#3a3a4a] hover:text-red-400 opacity-0 group-hover/opt:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); removeOption(opt.id); }}
              >
                <X size={11} strokeWidth={2} />
              </button>
            </div>
          )) : (
            <p className="text-[11px] text-[#3a3a4a] italic px-1">Nenhuma opção · clique em + para adicionar</p>
          )}
          <button
            className="flex items-center gap-1 px-1 py-0.5 text-[11px] text-[#5a5a6a] hover:text-[#C084FC] transition-colors"
            onClick={(e) => { e.stopPropagation(); addOption(); }}
          >
            <Plus size={11} strokeWidth={2} /> adicionar opção
          </button>
        </div>
      )}

      {/* Open type indicator */}
      {qType === "open" && (
        <div className="px-2.5 py-1.5 rounded-md bg-[#1a1a20] border border-[#252a38] text-[11px] text-[#4a4a5a] italic">
          Resposta aberta...
        </div>
      )}

      {/* Scale type indicator */}
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

export const BaseNode = memo(BaseNodeComponent);
