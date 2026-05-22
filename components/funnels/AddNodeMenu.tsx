"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { NODE_TYPE_META, ALLOWED_CHILDREN, ROOT_TYPES, type FunnelNodeType } from "@/types/funnels";
import { cn } from "@/lib/utils";

interface AddNodeMenuProps {
  onAdd: (type: FunnelNodeType, position?: { x: number; y: number }) => void;
  parentType?: FunnelNodeType | null;
  externalOpen?: { x: number; y: number } | null;
  onExternalClose?: () => void;
}

export default function AddNodeMenu({ onAdd, parentType, externalOpen, onExternalClose }: AddNodeMenuProps) {
  const [fabOpen, setFabOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOpen = fabOpen || !!externalOpen;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setFabOpen(false);
        onExternalClose?.();
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [isOpen, onExternalClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setFabOpen(false); onExternalClose?.(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onExternalClose]);

  // Context-aware type filtering
  const availableTypes: FunnelNodeType[] = parentType
    ? (ALLOWED_CHILDREN[parentType] ?? [])
    : ROOT_TYPES;

  // Hide button if no types available
  if (availableTypes.length === 0) return null;

  const handleSelect = useCallback((type: FunnelNodeType) => {
    if (externalOpen) {
      onAdd(type, externalOpen);
      onExternalClose?.();
    } else {
      onAdd(type);
      setFabOpen(false);
    }
  }, [externalOpen, onAdd, onExternalClose]);

  // Group label
  const groupLabel = parentType
    ? `Dentro de ${NODE_TYPE_META[parentType]?.label ?? parentType}`
    : "Elementos do funil";

  const menuContent = (
    <div className="w-56 bg-[#0B0B0C]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl py-2 max-h-[400px] overflow-y-auto">
      <p className="px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-text-muted">
        {groupLabel}
      </p>
      {availableTypes.map((type) => {
        const meta = NODE_TYPE_META[type];
        const TypeIcon = meta.icon;
        return (
          <button
            key={type}
            onClick={() => handleSelect(type)}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[12px] text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-colors"
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}
            >
              <TypeIcon size={13} strokeWidth={1.5} style={{ color: meta.color }} />
            </div>
            {meta.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {externalOpen && (
        <div ref={menuRef} className="fixed z-50" style={{ left: externalOpen.x, top: externalOpen.y }}>
          {menuContent}
        </div>
      )}

      {!externalOpen && (
        <div ref={!externalOpen ? menuRef : undefined} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          {fabOpen && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
              {menuContent}
            </div>
          )}

          <button
            onClick={() => setFabOpen(!fabOpen)}
            className={cn(
              "flex items-center gap-2 rounded-[9px] border px-5 py-2.5 text-xs font-bold tracking-wide",
              "transition-[background,box-shadow,transform] duration-400 active:scale-[0.96]",
              fabOpen
                ? "bg-[#FF6B00] text-black border-transparent shadow-[0_0_18px_rgba(255,107,0,0.35)]"
                : "bg-[#FF6B00] text-black border-transparent shadow-[0_0_18px_rgba(255,107,0,0.35)] hover:bg-[#FF7A1A] hover:shadow-[0_0_32px_rgba(255,107,0,0.55),0_0_10px_rgba(255,107,0,0.35)]"
            )}
          >
            <Plus size={14} strokeWidth={2.5} className={cn(fabOpen && "rotate-45", "transition-transform duration-200")} />
            {fabOpen ? "Fechar" : "Novo No"}
          </button>
        </div>
      )}
    </>
  );
}
