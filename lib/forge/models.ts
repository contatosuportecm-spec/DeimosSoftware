import { ForgeModel } from "@/types/forge";

// Catálogo de modelos do Forge.
// Preços extraídos do dashboard oficial muapi.ai (2026-05-09) — valores pós-desconto.
// Schemas auditados contra schema_data.json oficial onde existe; modelos novos
// (sd-2-vip-*, kling-v3.0-pro-motion-control, gpt-image-2, nano-banana-2) usam
// schema inferido do parente mais próximo na mesma família.
//
// Modelos com `endpoint_with_image` aceitam imagem opcional: sem imagem usam
// o endpoint base (T2I/T2V), com imagem trocam pro endpoint da variante (I2I/I2V).

export const FORGE_MODELS: ForgeModel[] = [
  // ═══ IMAGE ═══════════════════════════════════════════════════════════════

  {
    id: "nano-banana-2",
    provider_id: "muapi",
    name: "Nano Banana 2",
    category: "image",
    endpoint: "nano-banana-2",
    endpoint_with_image: {
      endpoint: "nano-banana-2-edit",
      image_field: "images_list",
      image_as_array: true,
      pricing: { base_usd: 0.060 },
    },
    description: "Google Gemini 3.1 Flash Image — modelo mais avançado da Google. Sem imagem gera do zero, com imagem edita preservando estilo.",
    inputs: {
      aspect_ratios: ["1:1", "3:4", "4:3", "9:16", "16:9", "3:2", "2:3", "5:4", "4:5", "21:9"],
      default_aspect_ratio: "1:1",
      resolutions: ["1k", "2k", "4k"],
      default_resolution: "1k",
      supports_image_upload: true,
      multi_image: true,
      image_field: "images_list",
      has_prompt: true,
      prompt_required: true,
    },
    pricing: { base_usd: 0.060 },
  },

  {
    id: "gpt-image-2-text-to-image",
    provider_id: "muapi",
    name: "GPT Image 2",
    category: "image",
    endpoint: "gpt-image-2-text-to-image",
    endpoint_with_image: {
      endpoint: "gpt-image-2-image-to-image",
      image_field: "images_list",
      image_as_array: true,
      pricing: { base_usd: 0.090 },
    },
    description: "OpenAI GPT Image 2 — fotorrealismo de ponta, prompts até 20.000 caracteres, edição com até 16 imagens de referência.",
    inputs: {
      aspect_ratios: ["1:1", "2:3", "3:2"],
      default_aspect_ratio: "1:1",
      qualities: ["low", "medium", "high"],
      default_quality: "medium",
      supports_image_upload: true,
      image_field: "images_list",
      has_prompt: true,
      prompt_required: true,
    },
    pricing: { base_usd: 0.090 },
  },

  // ═══ VIDEO ═══════════════════════════════════════════════════════════════

  {
    id: "seedance-vip",
    provider_id: "muapi",
    name: "Seedance 2 VIP",
    category: "video",
    endpoint: "sd-2-vip-text-to-video",
    endpoint_with_image: {
      endpoint: "sd-2-vip-image-to-video",
      image_field: "image_url",
      pricing: { base_usd: 1.500 },
    },
    description: "Seedance 2 VIP (ByteDance) — text/image-to-video com áudio nativo, 4-15s, qualidade premium.",
    inputs: {
      aspect_ratios: ["16:9", "9:16", "1:1"],
      default_aspect_ratio: "16:9",
      durations: [5, 10, 15],
      default_duration: 5,
      supports_image_upload: true,
      image_field: "image_url",
      has_prompt: true,
      prompt_required: true,
    },
    pricing: { base_usd: 1.500 },
  },

  {
    id: "seedance-2.0-omni",
    provider_id: "muapi",
    name: "Seedance 2.0 Omni",
    category: "video",
    endpoint: "seedance-2.0-omni-reference",
    description: "Seedance 2.0 Omni-Reference — combina até 9 imagens, 3 vídeos e 3 áudios numa geração. O mais multimodal.",
    inputs: {
      aspect_ratios: ["16:9", "9:16", "1:1"],
      default_aspect_ratio: "16:9",
      durations: [5, 10, 15],
      default_duration: 5,
      qualities: ["basic", "high"],
      default_quality: "basic",
      supports_image_upload: true,
      multi_image: true,
      image_field: "images_list",
      supports_audio_upload: true,
      audio_field: "audio_files",
      supports_video_upload: true,
      video_field: "video_files",
      has_prompt: true,
      prompt_required: true,
    },
    pricing: { base_usd: 1.500 },
  },

  {
    id: "sd-2-vip-first-last-frame",
    provider_id: "muapi",
    name: "Seedance First & Last Frame",
    category: "video",
    endpoint: "sd-2-vip-first-last-frame",
    description: "Seedance VIP — gera transição cinematográfica entre 2 imagens (frame inicial → frame final). Perfeito pra storytelling visual.",
    inputs: {
      aspect_ratios: ["16:9", "9:16", "1:1"],
      default_aspect_ratio: "16:9",
      durations: [5, 10],
      default_duration: 5,
      supports_image_upload: true,
      supports_last_image: true,
      image_required: true,
      last_image_required: true,
      image_field: "image_url",
      has_prompt: true,
      prompt_required: true,
    },
    pricing: { base_usd: 1.500 },
  },

  {
    id: "veo3.1-text-to-video",
    provider_id: "muapi",
    name: "Veo 3.1",
    category: "video",
    endpoint: "veo3.1-text-to-video",
    endpoint_with_image: {
      endpoint: "veo3.1-image-to-video",
      image_field: "image_url",
      pricing: { base_usd: 2.500 },
    },
    description: "Google Veo 3.1 — vídeos de 8s, 1080p, áudio nativo. Sem imagem gera do zero, com imagem anima preservando composição.",
    inputs: {
      aspect_ratios: ["16:9", "9:16"],
      default_aspect_ratio: "16:9",
      durations: [8],
      default_duration: 8,
      resolutions: ["1080p"],
      default_resolution: "1080p",
      supports_image_upload: true,
      supports_last_image: true, // Veo3.1 I2V aceita last_image opcional pra transição
      image_field: "image_url",
      has_prompt: true,
      prompt_required: true,
    },
    pricing: { base_usd: 2.500 },
  },

  {
    id: "kling-v3.0-pro-motion-control",
    provider_id: "muapi",
    name: "Kling Motion Control",
    category: "video",
    endpoint: "kling-v3.0-pro-motion-control",
    description: "Kling 3.0 Pro Motion Control — aplica o movimento de um vídeo de referência a uma imagem-sujeito. Controle preciso de câmera e ação.",
    inputs: {
      supports_image_upload: true,
      supports_video_upload: true,
      image_required: true,
      video_required: true,
      image_field: "image_url",
      has_prompt: true,
      prompt_required: true,
    },
    pricing: { base_usd: 0.160 },
  },

  {
    id: "ai-video-effects",
    provider_id: "muapi",
    name: "AI Video Effects",
    category: "video",
    endpoint: "generate_wan_ai_effects",
    description: "Wan2.1 14B I2V — transforme uma imagem em vídeo com 64 efeitos cinematográficos (Hulk Transformation, Cakeify, Kamehameha…).",
    inputs: {
      aspect_ratios: ["16:9", "9:16", "1:1"],
      default_aspect_ratio: "16:9",
      resolutions: ["480p", "720p"],
      default_resolution: "480p",
      durations: [5, 10],
      default_duration: 5,
      qualities: ["medium", "high"],
      default_quality: "medium",
      effects: [
        "360 Rotation", "Abandoned Places", "Angry", "Animal Documentary", "Assassin It",
        "Baby It", "Boxing", "Bride It", "Cakeify", "Cartoon Jaw Drop", "Cats", "Crush It",
        "Crying", "Cyberpunk 2077", "Deflate It", "Disney Princess It", "Dogs", "Eye Close-Up",
        "Fantasy Landscapes", "Film Noir", "Fire", "Glamor", "Goblin", "Gun Reveal", "Hug Jesus",
        "Hulk Transformation", "Inflate It", "Jungle It", "Jumpscare", "Kamehameha",
        "Kiss Cam", "Kissing", "Lego", "Laughing", "Little Planet", "Live Wallpaper",
        "Looping Pixel Art", "Melt It", "Mona Lisa It", "Museum It", "Muscle Show Off",
        "Orc", "Pixar", "Pirate Captain", "POV Driving", "Princess It", "Puppy It",
        "Robotic Face Reveal", "Samurai It", "Sharingan Eyes", "Skyrim Fus-Ro-Dah",
        "Snow White It", "Squish It", "Steamboat Willie", "Super Saiyan Transformation",
        "Tsunami", "Ultra Wide", "VHS Footage", "VIP It", "Warrior It", "Wind Blast",
        "Younger Self Selfie", "Zen It", "Zoom Call",
      ],
      default_effect: "Cakeify",
      supports_image_upload: true,
      image_required: true,
      image_field: "image_url",
      has_prompt: true,
      prompt_required: true,
    },
    pricing: {
      base_usd: 0.10,
      resolution_mult: { "480p": 1, "720p": 1.5 },
      duration_mult: { 5: 1, 10: 2 },
      quality_mult: { medium: 1, high: 1.6 },
      approx: true,
    },
  },

  // ═══ LIPSYNC ═════════════════════════════════════════════════════════════

  {
    id: "ltx-2-19b-lipsync",
    provider_id: "muapi",
    name: "LTX 2 Lipsync",
    category: "lipsync",
    endpoint: "ltx-2-19b-lipsync",
    description: "Lipsync de alta qualidade. Imagem + áudio → vídeo falando com sincronia labial precisa.",
    inputs: {
      resolutions: ["480p", "720p", "1080p"],
      default_resolution: "720p",
      supports_image_upload: true,
      supports_audio_upload: true,
      audio_required: true,
      image_field: "image_url",
      has_prompt: true,
    },
    pricing: {
      base_usd: 0.10,
      resolution_mult: { "480p": 1, "720p": 2, "1080p": 4 },
      approx: true,
    },
  },
];

export function getForgeModel(id: string): ForgeModel | undefined {
  return FORGE_MODELS.find((m) => m.id === id);
}

export function getForgeModelsByCategory(category: ForgeModel["category"]): ForgeModel[] {
  return FORGE_MODELS.filter((m) => m.category === category);
}
