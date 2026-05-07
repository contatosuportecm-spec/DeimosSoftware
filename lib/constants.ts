import { Module } from "@/types";

export const MODULES: Module[] = [
  { id: "dashboard", name: "Dashboard", icon: "Home", path: "/dashboard", status: "active" },
  { id: "spy", name: "Spy", icon: "Radar", path: "/spy", status: "active" },
  { id: "creatives", name: "Criativos", icon: "Brain", path: "/creatives", status: "active" },
  { id: "products", name: "Produtos", icon: "Package", path: "/products", status: "active" },
  { id: "compass", name: "Compass", icon: "Chart", path: "/compass", status: "coming" },
  { id: "vault", name: "Vault", icon: "Wallet", path: "/vault", status: "coming" },
  { id: "forge", name: "Forge", icon: "Zap", path: "/forge", status: "active" },
  { id: "factory", name: "Factory", icon: "Layers", path: "/factory", status: "future" },
  { id: "builder", name: "Builder", icon: "Layout", path: "/builder", status: "future" },
  { id: "pilot", name: "Pilot", icon: "Send", path: "/pilot", status: "future" },
];

export const STATUS_COLORS = {
  scaling: { label: "Escalando", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  stable: { label: "Estável", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  dying: { label: "Morrendo", color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  new: { label: "Nova", color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  monitoring: { label: "Monitorando", color: "#A1A1AA", bg: "rgba(161,161,170,0.12)" },
  archived: { label: "Arquivada", color: "#52525B", bg: "rgba(82,82,91,0.12)" },
};

export const SCALING_PATTERN_LABELS: Record<string, { label: string; icon: string }> = {
  lateral:        { label: "Lateral",  icon: "GitBranch" },
  vertical:       { label: "Vertical", icon: "ArrowUpRight" },
  budget:         { label: "Budget",   icon: "DollarSign" },
  creative_flood: { label: "Criativo", icon: "Copy" },
  mixed:          { label: "Misto",    icon: "Shuffle" },
  unknown:        { label: "",         icon: "" },
};
