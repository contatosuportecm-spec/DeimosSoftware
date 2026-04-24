import { cn } from "@/lib/utils";
import { OfferStatus } from "@/types";
import { STATUS_COLORS } from "@/lib/constants";

interface BadgeProps {
  status: OfferStatus;
  className?: string;
}

export default function Badge({ status, className }: BadgeProps) {
  const config = STATUS_COLORS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-[0.12em]",
        className
      )}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

interface GenericBadgeProps {
  label: string;
  color?: string;
  bg?: string;
  className?: string;
}

export function GenericBadge({ label, color = "#6B6B73", bg = "rgba(107,107,115,0.12)", className }: GenericBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider",
        className
      )}
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}
