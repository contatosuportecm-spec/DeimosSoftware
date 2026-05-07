export type ForgeCategory = "image" | "video" | "lipsync";
export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

export interface ForgeProvider {
  id: string;
  name: string;
  base_url: string;
  auth_header: string;
  auth_prefix: string;
  is_active: boolean;
}

export interface ForgeModel {
  id: string;
  provider_id: string;
  name: string;
  category: ForgeCategory;
  endpoint: string;
  description?: string;
  inputs: ForgeModelInputs;
}

export interface ForgeModelInputs {
  aspect_ratios?: string[];
  default_aspect_ratio?: string;
  resolutions?: string[];
  default_resolution?: string;
  durations?: number[];
  default_duration?: number;
  qualities?: string[];
  default_quality?: string;
  effects?: string[];
  default_effect?: string;
  supports_image_upload?: boolean;
  supports_audio_upload?: boolean;
  image_field?: string;
  has_prompt?: boolean;
}

export interface ForgeGeneration {
  id: string;
  model_id: string;
  provider_id: string;
  category: ForgeCategory;
  prompt: string | null;
  params: Record<string, unknown>;
  status: GenerationStatus;
  result_url: string | null;
  thumbnail_url: string | null;
  error: string | null;
  request_id: string | null;
  offer_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface GenerateRequest {
  model_id: string;
  prompt?: string;
  aspect_ratio?: string;
  resolution?: string;
  duration?: number;
  quality?: string;
  effect?: string;
  image_url?: string;
  audio_url?: string;
  offer_id?: string;
}
