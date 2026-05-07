import { ForgeModel } from "@/types/forge";

export const FORGE_MODELS: ForgeModel[] = [
  // ═══ IMAGE ═══════════════════════════════════════════════════════════════
  {
    id: "nano-banana-2",
    provider_id: "muapi",
    name: "Nano Banana 2",
    category: "image",
    endpoint: "nano-banana-2",
    description: "Geração rápida com alta qualidade. Suporte a múltiplos aspect ratios e resoluções até 4K.",
    inputs: {
      aspect_ratios: ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9", "auto"],
      default_aspect_ratio: "auto",
      resolutions: ["1k", "2k", "4k"],
      default_resolution: "2k",
      has_prompt: true,
    },
  },
  {
    id: "gpt-image-2",
    provider_id: "muapi",
    name: "GPT Image 2",
    category: "image",
    endpoint: "gpt-image-2-text-to-image",
    description: "Motor de imagem da OpenAI. Textos em imagem perfeitos, fotorrealismo, até 4K.",
    inputs: {
      aspect_ratios: ["auto", "1:1", "16:9", "9:16", "4:3", "3:4"],
      default_aspect_ratio: "auto",
      resolutions: ["1K", "2K", "4K"],
      default_resolution: "2K",
      has_prompt: true,
    },
  },

  // ═══ VIDEO ═══════════════════════════════════════════════════════════════
  {
    id: "seedance-v2.0-t2v",
    provider_id: "muapi",
    name: "Seedance 2.0",
    category: "video",
    endpoint: "seedance-v2.0-t2v",
    description: "Geração de vídeo text-to-video com qualidade cinematográfica. Até 15s.",
    inputs: {
      aspect_ratios: ["16:9", "9:16", "4:3", "3:4"],
      default_aspect_ratio: "16:9",
      durations: [5, 10, 15],
      default_duration: 5,
      qualities: ["high", "basic"],
      default_quality: "basic",
      has_prompt: true,
    },
  },
  {
    id: "veo3-text-to-video",
    provider_id: "muapi",
    name: "Veo 3",
    category: "video",
    endpoint: "veo3-text-to-video",
    description: "Google Veo 3 — geração de vídeo de última geração com áudio nativo.",
    inputs: {
      aspect_ratios: ["16:9", "9:16"],
      default_aspect_ratio: "16:9",
      has_prompt: true,
    },
  },
  {
    id: "motion-controls",
    provider_id: "muapi",
    name: "Kling Motion Control",
    category: "video",
    endpoint: "generate_wan_ai_effects",
    description: "Transforme uma imagem em vídeo com efeitos cinematográficos: 360° Orbit, Dolly Zoom, Crane Shot e mais.",
    inputs: {
      aspect_ratios: ["16:9", "9:16", "1:1"],
      default_aspect_ratio: "16:9",
      resolutions: ["480p", "720p"],
      default_resolution: "480p",
      qualities: ["high", "basic"],
      default_quality: "basic",
      effects: [
        "360 Orbit", "Arc Shot", "Car Chase", "Car Mount Cam",
        "Crash Zoom In", "Crash Zoom Out", "Crane Down", "Crane Overhead",
        "Crane Punch-In", "Crane Up", "Dolly In", "Dolly Left",
        "Dolly Out", "Dolly Right", "Dolly Zoom In", "Dolly Zoom Out",
        "Dutch Angle", "Fast Dolly Zoom In", "Fast Dolly Zoom Out",
        "Fisheye Lens", "Focus Shift", "FPV Drone Cam", "Handheld Cam",
        "Head Tracking", "Hero Run", "Human Timelapse", "Landscape Timelapse",
        "Lazy Susan", "Lens Flare", "Matrix Shot", "Motion Blur",
        "Object POV", "Overhead", "Snorricam", "Tilt Down", "Tilt Up",
        "Whip Pan", "Wiggle", "Zoom In", "Zoom Out",
      ],
      default_effect: "360 Orbit",
      supports_image_upload: true,
      image_field: "image_url",
      has_prompt: true,
    },
  },

  // ═══ LIPSYNC ═════════════════════════════════════════════════════════════
  {
    id: "ltx-2.3-lipsync",
    provider_id: "muapi",
    name: "LTX 2.3 Lipsync",
    category: "lipsync",
    endpoint: "ltx-2.3-lipsync",
    description: "Lipsync de alta qualidade. Imagem + áudio → vídeo falando com sincronia labial precisa.",
    inputs: {
      resolutions: ["480p", "720p", "1080p"],
      default_resolution: "720p",
      supports_image_upload: true,
      supports_audio_upload: true,
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
