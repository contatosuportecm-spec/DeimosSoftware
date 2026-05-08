"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ForgeModel } from "@/types/forge";
import { ChevronDown, Image, Video, Mic } from "lucide-react";

interface ModelPickerProps {
  models: ForgeModel[];
  selected: string;
  onSelect: (id: string) => void;
}

const CATEGORY_ICONS = {
  image: Image,
  video: Video,
  lipsync: Mic,
};

export default function ModelPicker({ models, selected, onSelect }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = models.find((m) => m.id === selected);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const Icon = current ? CATEGORY_ICONS[current.category] : Image;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 md:py-2 rounded-lg bg-bg-3 border border-border hover:border-border-strong transition-colors text-xs min-w-0"
      >
        <Icon size={13} strokeWidth={1.5} className="text-gold" />
        <span className="text-text-primary font-medium truncate">{current?.name || "Selecionar modelo"}</span>
        <ChevronDown size={12} className={cn("text-text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-[calc(100vw-2rem)] sm:w-64 z-50 rounded-lg border border-border bg-bg-2 shadow-2xl py-1 max-h-64 overflow-y-auto">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2.5 flex flex-col gap-0.5 transition-colors",
                model.id === selected
                  ? "bg-gold/10 border-l-2 border-gold"
                  : "hover:bg-bg-3 border-l-2 border-transparent"
              )}
            >
              <span className="text-xs font-medium text-text-primary">{model.name}</span>
              {model.description && (
                <span className="text-[10px] text-text-muted line-clamp-1">{model.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
