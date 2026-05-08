import { ForgeModel } from "@/types/forge";

// Schemas auditados contra schema_data.json oficial do muapi.ai (267 modelos).
// Sem valores "auto" nem parâmetros inventados — só o que cada endpoint aceita.
// Última auditoria: 2026-05-08.
//
// Modelos com `endpoint_with_image` aceitam imagem opcional: sem imagem usam
// o endpoint base (T2I/T2V), com imagem trocam pro endpoint da variante (I2I/I2V).

export const FORGE_MODELS: ForgeModel[] = [
  // ═══ IMAGE ═══════════════════════════════════════════════════════════════

  {
    id: "nano-banana-pro",
    provider_id: "muapi",
    name: "Nano Banana 2",
    category: "image",
    endpoint: "nano-banana-pro",
    endpoint_with_image: {
      endpoint: "nano-banana-pro-edit",
      image_field: "images_list",
      image_as_array: true,
    },
    description: "Google DeepMind — sem imagem gera do zero (T2I), com imagem edita preservando estilo.",
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
  },

  {
    id: "gpt-image-1.5",
    provider_id: "muapi",
    name: "GPT Image 1.5",
    category: "image",
    endpoint: "gpt-image-1.5",
    description: "Motor de imagem da OpenAI — texto em imagem perfeito, fotorrealismo de ponta.",
    inputs: {
      aspect_ratios: ["1:1", "2:3", "3:2"],
      default_aspect_ratio: "1:1",
      qualities: ["low", "medium", "high"],
      default_quality: "medium",
      has_prompt: true,
      prompt_required: true,
    },
  },

  // ═══ VIDEO ═══════════════════════════════════════════════════════════════

  {
    id: "seedance-v2.0-t2v",
    provider_id: "muapi",
    name: "Seedance 2.0",
    category: "video",
    endpoint: "seedance-v2.0-t2v",
    description: "Seedance 2.0 (ByteDance) — text-to-video com áudio nativo. Único da família com seleção de qualidade.",
    inputs: {
      aspect_ratios: ["16:9", "9:16", "1:1"],
      default_aspect_ratio: "16:9",
      durations: [5, 10, 15],
      default_duration: 5,
      qualities: ["basic", "high"],
      default_quality: "basic",
      has_prompt: true,
      prompt_required: true,
    },
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
  },

  {
    id: "seedance-pro",
    provider_id: "muapi",
    name: "Seedance Pro",
    category: "video",
    endpoint: "seedance-pro-t2v",
    endpoint_with_image: {
      endpoint: "seedance-pro-i2v",
      image_field: "image_url",
      omit_when_image: ["aspect_ratio"],
    },
    description: "Seedance Pro — sem imagem gera do zero (T2V), com imagem anima a foto. Aspects amplos e até 1080p.",
    inputs: {
      aspect_ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"],
      default_aspect_ratio: "16:9",
      resolutions: ["480p", "720p", "1080p"],
      default_resolution: "480p",
      durations: [5, 10],
      default_duration: 5,
      supports_image_upload: true,
      image_field: "image_url",
      has_prompt: true,
      prompt_required: true,
    },
  },

  {
    id: "veo3-text-to-video",
    provider_id: "muapi",
    name: "Veo 3",
    category: "video",
    endpoint: "veo3-text-to-video",
    endpoint_with_image: {
      endpoint: "veo3-image-to-video",
      image_field: "images_list",
      image_as_array: true,
    },
    description: "Google Veo 3 — sem imagem gera do zero (T2V), com imagem anima a foto preservando composição.",
    inputs: {
      aspect_ratios: ["16:9", "9:16"],
      default_aspect_ratio: "16:9",
      supports_image_upload: true,
      image_field: "images_list",
      has_prompt: true,
      prompt_required: true,
    },
  },

  {
    id: "ai-video-effects",
    provider_id: "muapi",
    name: "AI Video Effects",
    category: "video",
    endpoint: "generate_wan_ai_effects",
    description: "Wan2.1 14B I2V — transforme uma imagem em vídeo com 64 efeitos cinematográficos.",
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
  },
];

export function getForgeModel(id: string): ForgeModel | undefined {
  return FORGE_MODELS.find((m) => m.id === id);
}

export function getForgeModelsByCategory(category: ForgeModel["category"]): ForgeModel[] {
  return FORGE_MODELS.filter((m) => m.category === category);
}
