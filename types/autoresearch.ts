export type ElementType = "headline" | "cta" | "hook" | "mechanism" | "quiz_hook";
export type CampaignStatus = "active" | "paused" | "completed" | "error";
export type RoundStatus = "generating" | "pending_approval" | "deploying" | "measuring" | "decided" | "error";
export type RoundDecision = "promoted" | "kept" | "error";

/* ── Slot ── */
export interface VideoSlot {
  video_id: string;
  label: string;
}

/* ── Round variant (one per slot) ── */
export interface RoundVariant {
  slot_index: number;
  video_id: string;
  headline: string;
  hypothesis: string;
  role: "control" | "challenger";
  strategy?: "predictability" | "scale";
}

/* ── Round result (one per slot after measuring) ── */
export interface SlotResult {
  slot_index: number;
  video_id: string;
  play_rate: number;
  sessions: number;
  unique_views: number;
}

/* ── Campaign ── */
export interface AutoresearchCampaign {
  id: string;
  briefing_id: string | null;
  name: string;
  element_type: ElementType;
  status: CampaignStatus;
  slots: VideoSlot[];
  slot_count: number;
  vturb_video_id: string | null;
  vturb_api_key: string | null;
  deploy_repo: string;
  deploy_branch: string;
  deploy_file_path: string;
  min_sessions: number | null;
  max_rounds: number | null;
  iteration_minutes: number;
  require_approval: boolean;
  simulate_mode: boolean;  // virtual: deploy_repo === "simulate"
  copywriter_id: string;
  current_value: string | null;
  baseline_play_rate: number | null;
  best_play_rate: number | null;
  iteration_count: number;
  created_at: string;
  updated_at: string;
}

/* ── Round (was "iteration") ── */
export interface AutoresearchRound {
  id: string;
  campaign_id: string;
  iteration_number: number;
  variants: RoundVariant[] | null;
  slot_results: SlotResult[] | null;
  winner_slot: number | null;
  variant_value: string | null;
  hypothesis: string | null;
  previous_value: string | null;
  previous_play_rate: number | null;
  play_rate: number | null;
  sessions_collected: number;
  unique_views: number;
  measured_at: string | null;
  status: RoundStatus;
  decision: RoundDecision | null;
  decision_reason: string | null;
  copywriter_used: string | null;
  wiki_pages_used: string[] | null;
  deploy_started_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutoresearchMeasurement {
  id: string;
  iteration_id: string;
  sessions: number;
  play_rate: number | null;
  unique_views: number;
  raw_response: Record<string, unknown> | null;
  created_at: string;
}

export interface CampaignWithRounds extends AutoresearchCampaign {
  rounds: AutoresearchRound[];
}

export interface CreateCampaignInput {
  name: string;
  briefing_id?: string;
  element_type?: ElementType;
  slots?: VideoSlot[];
  vturb_api_key?: string;
  deploy_repo?: string;
  deploy_branch?: string;
  deploy_file_path?: string;
  min_sessions?: number;
  max_rounds?: number;
  iteration_minutes?: number;
  require_approval?: boolean;
  simulate_mode?: boolean;  // virtual — sets deploy_repo to "simulate"
  copywriter_id?: string;
  current_value?: string;
  baseline_play_rate?: number;
}
