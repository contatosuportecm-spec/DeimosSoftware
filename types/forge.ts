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

export interface ForgeModelVariant {
  endpoint: string;
  image_field: string;
  image_as_array?: boolean; // se true, manda imagem como array (e.g. images_list)
  // Campos do schema base que NÃO são aceitos por essa variante.
  // Ex: seedance-pro-i2v aceita resolution+duration mas não aspect_ratio.
  omit_when_image?: Array<"aspect_ratio" | "resolution" | "duration" | "quality" | "effect">;
}

export interface ForgeModel {
  id: string;
  provider_id: string;
  name: string;
  category: ForgeCategory;
  endpoint: string; // endpoint padrão (sem imagem ou T2V)
  // Variante usada quando o usuário envia uma imagem.
  // Permite combinar T2V/I2V (ou T2I/I2I) num único modelo da UI.
  endpoint_with_image?: ForgeModelVariant;
  description?: string;
  inputs: ForgeModelInputs;
}

export interface ForgeModelInputs {
  // Aspect ratio
  aspect_ratios?: string[];
  default_aspect_ratio?: string;
  // Resolução
  resolutions?: string[];
  default_resolution?: string;
  // Duração (vídeo)
  durations?: number[];
  default_duration?: number;
  // Qualidade
  qualities?: string[];
  default_quality?: string;
  // Efeitos (Wan AI Effects)
  effects?: string[];
  default_effect?: string;
  // Inputs binários
  supports_image_upload?: boolean;
  supports_audio_upload?: boolean;
  image_required?: boolean;
  multi_image?: boolean;
  audio_required?: boolean;
  image_field?: string;
  // Prompt
  has_prompt?: boolean;
  prompt_required?: boolean;
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
  image_urls?: string[];
  audio_url?: string;
  offer_id?: string;
}
