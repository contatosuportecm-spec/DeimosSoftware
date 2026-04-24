"use client";

import { cn } from "@/lib/utils";
import { ScanSearch } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 px-6 rounded-lg border border-border bg-bg-3 text-center",
        className
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-bg-4 border border-border flex items-center justify-center mb-5">
        <ScanSearch size={18} strokeWidth={1.5} className="text-text-muted" />
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-1.5 tracking-wide">{title}</h3>
      {description && (
        <p className="text-xs text-text-muted max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button size="sm" onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  );
}
