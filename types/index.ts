// ═══ Database types ═══

export type OfferStatus = "new" | "monitoring" | "scaling" | "stable" | "dying" | "archived";
export type KnowledgeType = "hook" | "angle" | "mechanism" | "script" | "reference" | "pattern";
export type ChatRole = "user" | "assistant" | "system";

export type ScalingPattern = "lateral" | "vertical" | "budget" | "creative_flood" | "mixed" | "unknown";
export type OfferDecision = "test" | "keep_watching" | "archive";

export interface Offer {
  id: string;
  name: string;
  niche: string;
  source: string;
  library_url?: string;
  page_url?: string;
  vsl_url?: string;
  status: OfferStatus;
  score: number;
  notes?: string;
  country: string;
  page_id?: string;
  // Market Strength Score
  market_strength: number;
  volume_score: number;
  growth_score: number;
  consistency_score: number;
  recency_score: number;
  scaling_pattern: ScalingPattern;
  // Decisão pós-observação
  decision?: OfferDecision | null;
  decision_at?: string | null;
  observation_days: number;
  // Discovery
  discovered_keyword?: string | null;
  dr_score: number;
  created_at: string;
  updated_at: string;
}

export interface OfferSnapshot {
  id: string;
  offer_id: string;
  date: string;
  active_ads_count: number;
  creative_count?: number | null;
  duplicate_count?: number | null;
}

export interface Niche {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  color: string;
  system_prompt?: string;
  is_active: boolean;
}

export interface NicheKnowledge {
  id: string;
  niche_id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  tags: string[];
}

export interface ChatSession {
  id: string;
  niche_id: string;
  title?: string;
  created_at: string;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

// ═══ Module registry ═══

export interface Module {
  id: string;
  name: string;
  icon: string;
  path: string;
  status: "active" | "coming" | "future";
}

// ═══ Spy types ═══

export type Country = "BR" | "USA" | "Latam";

export const COUNTRY_CODES: Record<Country, string[]> = {
  BR:    ["BR"],
  USA:   ["US"],
  Latam: ["BR", "MX", "CO", "AR", "CL", "PE"],
};

export const COUNTRY_LABELS: Record<Country, string> = {
  BR:    "Brasil",
  USA:   "EUA",
  Latam: "Latam",
};

// Offer com últimos 5 snapshots embutidos (join feito na API)
export interface OfferWithSnapshots extends Offer {
  snapshots: OfferSnapshot[]; // ordenados por date ASC, máx 5
}

export interface ScrapeResult {
  offer_id: string;
  active_ads_count: number;
  date: string;
}
