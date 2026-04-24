import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  gold?: boolean;
  className?: string;
}

export default function StatCard({ label, value, change, changeType = "neutral", gold, className }: StatCardProps) {
  const changeColors = {
    positive: "text-success",
    negative: "text-danger",
    neutral: "text-text-muted",
  };

  return (
    <div
      className={cn(
        "rounded-lg bg-bg-3 p-5 border transition-all",
        gold ? "border-border-gold" : "border-border",
        className
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mb-3">{label}</p>
      <p className={cn("text-2xl font-mono font-medium", gold ? "text-gold" : "text-text-primary")}>
        {value}
      </p>
      {change && (
        <p className={cn("text-[11px] mt-2 font-mono", changeColors[changeType])}>{change}</p>
      )}
    </div>
  );
}
