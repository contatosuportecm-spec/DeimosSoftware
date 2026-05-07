"use client";

import { cn } from "@/lib/utils";

interface AspectRatioPickerProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

const AR_SHAPES: Record<string, { w: number; h: number }> = {
  "1:1": { w: 16, h: 16 },
  "16:9": { w: 20, h: 12 },
  "9:16": { w: 12, h: 20 },
  "4:3": { w: 18, h: 14 },
  "3:4": { w: 14, h: 18 },
  "3:2": { w: 18, h: 12 },
  "2:3": { w: 12, h: 18 },
  "5:4": { w: 18, h: 15 },
  "4:5": { w: 15, h: 18 },
  "21:9": { w: 22, h: 10 },
  auto: { w: 16, h: 16 },
};

export default function AspectRatioPicker({ options, selected, onSelect }: AspectRatioPickerProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map((ar) => {
        const shape = AR_SHAPES[ar] || { w: 16, h: 16 };
        const isActive = ar === selected;

        return (
          <button
            key={ar}
            onClick={() => onSelect(ar)}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1.5 rounded-md transition-all",
              isActive
                ? "bg-gold/15 border border-gold/30"
                : "bg-bg-3 border border-transparent hover:border-border"
            )}
          >
            <div
              className={cn(
                "rounded-sm border transition-colors",
                isActive ? "border-gold bg-gold/20" : "border-text-muted/30 bg-bg-4"
              )}
              style={{ width: shape.w, height: shape.h }}
            />
            <span className={cn(
              "text-[9px] font-mono",
              isActive ? "text-gold" : "text-text-muted"
            )}>
              {ar}
            </span>
          </button>
        );
      })}
    </div>
  );
}
