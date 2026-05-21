"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  FileText, Play, HelpCircle, MessageCircle, CreditCard,
  CheckCircle, XCircle, ChevronDown, ChevronRight, Plus,
  GripVertical, Trash2, Pencil, ExternalLink, type LucideIcon,
} from "lucide-react";
import type { FunnelStage, SubItem, StageType } from "@/types/funnels";
import { STAGE_META } from "@/types/funnels";

const ICON_MAP: Record<string, LucideIcon> = {
  FileText, Play, HelpCircle, MessageCircle, CreditCard, CheckCircle, XCircle,
};

interface StageCardProps {
  stage: FunnelStage;
  isSelected: boolean;
  onClick: () => void;
  onUpdate: (stage: FunnelStage) => void;
}

export default function StageCard({ stage, isSelected, onClick, onUpdate }: StageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const meta = STAGE_META[stage.type];
  const Icon = ICON_MAP[meta.icon] ?? FileText;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const addChild = useCallback(() => {
    const newItem: SubItem = {
      id: `${stage.type}-${Date.now()}`,
      label: "New item",
      status: "draft",
    };
    onUpdate({ ...stage, children: [...stage.children, newItem] });
  }, [stage, onUpdate]);

  const removeChild = useCallback((childId: string) => {
    onUpdate({ ...stage, children: stage.children.filter((c) => c.id !== childId) });
  }, [stage, onUpdate]);

  const startEditChild = (child: SubItem) => {
    setEditingChild(child.id);
    setEditValue(child.label);
  };

  const saveEditChild = () => {
    if (!editingChild) return;
    onUpdate({
      ...stage,
      children: stage.children.map((c) =>
        c.id === editingChild ? { ...c, label: editValue } : c
      ),
    });
    setEditingChild(null);
  };

  const toggleChildStatus = (childId: string) => {
    onUpdate({
      ...stage,
      children: stage.children.map((c) =>
        c.id === childId
          ? { ...c, status: c.status === "active" ? "draft" : "active" }
          : c
      ),
    });
  };

  const statusColor = (s?: string) => {
    if (s === "active") return "bg-emerald-400";
    if (s === "disabled") return "bg-red-400";
    return "bg-amber-400";
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border transition-all duration-200 cursor-pointer",
        "bg-[#0D0D0F]/90 backdrop-blur-sm",
        isSelected
          ? "border-opacity-40 shadow-lg"
          : "border-white/[0.08] hover:border-white/[0.14] hover:shadow-md hover:-translate-y-px"
      )}
      style={isSelected ? { borderColor: `${meta.color}66` } : undefined}
    >
      {/* Color accent bar */}
      <div
        className="h-[3px] rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}44)` }}
      />

      {/* Main row */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
            style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}
          >
            <Icon size={20} strokeWidth={1.5} style={{ color: meta.color }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] text-text-primary font-semibold">
              {stage.label}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {meta.description}
              {stage.url && (
                <a
                  href={stage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-gold hover:text-gold-hover inline-flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={9} strokeWidth={1.5} />
                  link
                </a>
              )}
            </p>
          </div>

          {/* Metrics */}
          {stage.metrics && (stage.metrics.visitors || stage.metrics.conversions) && (
            <div className="hidden sm:flex items-center gap-4 mr-2">
              {stage.metrics.visitors != null && (
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Visits</p>
                  <p className="text-[13px] font-mono text-text-primary">
                    {stage.metrics.visitors.toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              {stage.metrics.rate != null && (
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Conv</p>
                  <p className="text-[13px] font-mono text-emerald-400">
                    {stage.metrics.rate.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Expand toggle */}
          <button
            onClick={toggleExpand}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
              expanded
                ? "bg-white/[0.08] text-text-primary"
                : "text-text-muted hover:bg-white/[0.05] hover:text-text-secondary"
            )}
          >
            {expanded
              ? <ChevronDown size={16} strokeWidth={1.5} />
              : <ChevronRight size={16} strokeWidth={1.5} />
            }
          </button>

          {/* Children count badge */}
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: `${meta.color}15`, color: meta.color }}
          >
            {stage.children.length}
          </span>
        </div>
      </div>

      {/* Expanded children */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-5 py-3 space-y-1 animate-[fadeIn_150ms_ease-out]">
          <p className="text-[9px] uppercase tracking-[0.18em] text-text-muted/60 mb-2 font-medium">
            Sub-estrutura
          </p>

          {stage.children.map((child, idx) => (
            <div
              key={child.id}
              className="group/item flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              {/* Status dot */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleChildStatus(child.id); }}
                className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", statusColor(child.status))}
                title={child.status}
              />

              {/* Index */}
              <span className="text-[10px] font-mono text-text-muted/50 w-4 text-right shrink-0">
                {idx + 1}
              </span>

              {/* Label */}
              {editingChild === child.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEditChild}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditChild();
                    if (e.key === "Escape") setEditingChild(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent border-b border-gold/40 px-1 py-0.5 text-[12px] text-text-primary outline-none"
                />
              ) : (
                <span
                  className={cn(
                    "flex-1 text-[12px] cursor-text",
                    child.status === "active" ? "text-text-primary" : "text-text-muted"
                  )}
                  onDoubleClick={(e) => { e.stopPropagation(); startEditChild(child); }}
                >
                  {child.label}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); startEditChild(child); }}
                  className="p-1 rounded text-text-muted hover:text-text-secondary transition-colors"
                >
                  <Pencil size={10} strokeWidth={1.5} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeChild(child.id); }}
                  className="p-1 rounded text-text-muted hover:text-danger transition-colors"
                >
                  <Trash2 size={10} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}

          {/* Add child */}
          <button
            onClick={(e) => { e.stopPropagation(); addChild(); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] text-text-muted hover:text-text-secondary hover:bg-white/[0.03] transition-colors"
          >
            <Plus size={12} strokeWidth={1.5} />
            Adicionar item
          </button>
        </div>
      )}
    </div>
  );
}
