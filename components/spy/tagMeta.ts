import { Eye, Star, Bookmark, type LucideIcon } from "lucide-react";
import { OfferTag } from "@/types";

/** Fonte única de verdade para nomenclatura, ícone e cor das tags de oferta. */
export const TAG_META: Record<OfferTag, { label: string; icon: LucideIcon; color: string }> = {
  atencao:      { label: "Atenção",      icon: Eye,      color: "#F4C430" }, // amber · ficar de olho
  interessante: { label: "Interessante", icon: Star,     color: "#FF8A1F" }, // ember · promissora
  acompanhar:   { label: "Acompanhar",   icon: Bookmark, color: "#5B8CFF" }, // ai-blue · seguir
};

export const TAG_ORDER: OfferTag[] = ["atencao", "interessante", "acompanhar"];
