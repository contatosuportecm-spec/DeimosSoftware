export type ElementType = "headline" | "cta" | "hook" | "mechanism" | "quiz_hook";
export type CampaignStatus = "active" | "paused" | "completed" | "error";
export type IterationStatus = "generating" | "pending_approval" | "deploying" | "measuring" | "decided" | "error";
export type IterationDecision = "keep" | "revert" | "skipped" | "error";

export interface AutoresearchCampaign {
  id: string;
  briefing_id: string | null;
  name: string;
  element_type: ElementType;
  status: CampaignStatus;
  vturb_video_id: string;
  vturb_api_key: string | null;
  deploy_repo: string;
  deploy_branch: string;
  deploy_file_path: string;
  min_sessions: number;
  min_improvement_pct: number;
  max_iterations: number;
  iteration_hours: number;
  require_approval: boolean;
  simulate_mode: boolean;
  copywriter_id: string;
  current_value: string | null;
  baseline_play_rate: number | null;
  best_play_rate: number | null;
  iteration_count: number;
  created_at: string;
  updated_at: string;
}

export interface AutoresearchIteration {
  id: string;
  campaign_id: string;
  iteration_number: number;
  variant_value: string | null;
  hypothesis: string | null;
  previous_value: string | null;
  previous_play_rate: number | null;
  play_rate: number | null;
  sessions_collected: number;
  unique_views: number;
  measured_at: string | null;
  status: IterationStatus;
  decision: IterationDecision | null;
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

export interface CampaignWithIterations extends AutoresearchCampaign {
  iterations: AutoresearchIteration[];
}

export interface CreateCampaignInput {
  name: string;
  briefing_id?: string;
  element_type?: ElementType;
  vturb_video_id: string;
  vturb_api_key?: string;
  deploy_repo: string;
  deploy_branch?: string;
  deploy_file_path: string;
  min_sessions?: number;
  min_improvement_pct?: number;
  max_iterations?: number;
  iteration_hours?: number;
  require_approval?: boolean;
  simulate_mode?: boolean;
  copywriter_id?: string;
  current_value?: string;
  baseline_play_rate?: number;
}
