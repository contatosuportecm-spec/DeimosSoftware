import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getForgeModel } from "@/lib/forge/models";
import { getProviderKey, submitGeneration } from "@/lib/forge/provider-router";
import { GenerateRequest, ForgeModel, ForgeModelVariant } from "@/types/forge";

export const dynamic = "force-dynamic";

interface BuiltPayload {
  payload: Record<string, unknown>;
  endpoint: string;
  errors: string[];
}

function buildPayload(model: ForgeModel, body: GenerateRequest): BuiltPayload {
  const errors: string[] = [];
  const payload: Record<string, unknown> = {};
  const inputs = model.inputs;

  // Decide qual endpoint usar: variant com imagem ou base.
  const usingImageVariant = !!(body.image_url && model.endpoint_with_image);
  const variant: ForgeModelVariant | undefined = usingImageVariant ? model.endpoint_with_image : undefined;
  const endpoint = variant?.endpoint || model.endpoint;
  const omit = new Set(variant?.omit_when_image || []);

  // Prompt
  if (inputs.has_prompt) {
    if (body.prompt && body.prompt.trim().length > 0) {
      payload.prompt = body.prompt.trim();
    } else if (inputs.prompt_required) {
      errors.push("Prompt é obrigatório para este modelo");
    }
  }

  // Aspect ratio
  if (inputs.aspect_ratios && inputs.aspect_ratios.length > 0 && !omit.has("aspect_ratio")) {
    const value = body.aspect_ratio || inputs.default_aspect_ratio;
    if (value && inputs.aspect_ratios.includes(value)) {
      payload.aspect_ratio = value;
    } else if (value) {
      errors.push(`Aspect ratio inválido: "${value}". Permitidos: ${inputs.aspect_ratios.join(", ")}`);
    }
  }

  // Resolution
  if (inputs.resolutions && inputs.resolutions.length > 0 && !omit.has("resolution")) {
    const value = body.resolution || inputs.default_resolution;
    if (value && inputs.resolutions.includes(value)) {
      payload.resolution = value;
    } else if (value) {
      errors.push(`Resolução inválida: "${value}". Permitidos: ${inputs.resolutions.join(", ")}`);
    }
  }

  // Duration
  if (inputs.durations && inputs.durations.length > 0 && !omit.has("duration")) {
    const value = body.duration || inputs.default_duration;
    if (value && inputs.durations.includes(value)) {
      payload.duration = value;
    } else if (value) {
      errors.push(`Duração inválida: ${value}s. Permitidos: ${inputs.durations.join(", ")}s`);
    }
  }

  // Quality
  if (inputs.qualities && inputs.qualities.length > 0 && !omit.has("quality")) {
    const value = body.quality || inputs.default_quality;
    if (value && inputs.qualities.includes(value)) {
      payload.quality = value;
    } else if (value) {
      errors.push(`Qualidade inválida: "${value}". Permitidos: ${inputs.qualities.join(", ")}`);
    }
  }

  // Effect — Muapi usa o campo "name" em ai-video-effects
  if (inputs.effects && inputs.effects.length > 0 && !omit.has("effect")) {
    const value = body.effect || inputs.default_effect;
    if (value && inputs.effects.includes(value)) {
      payload.name = value;
    } else if (value) {
      errors.push(`Efeito inválido: "${value}"`);
    }
  }

  // Image upload
  if (inputs.supports_image_upload) {
    const urls = body.image_urls?.length ? body.image_urls : body.image_url ? [body.image_url] : [];
    if (urls.length > 0) {
      const field = variant?.image_field || inputs.image_field || "image_url";
      const asArray = variant?.image_as_array === true;
      payload[field] = asArray ? urls : urls[0];
    } else if (inputs.image_required) {
      errors.push("Imagem é obrigatória para este modelo");
    }
  }

  // Audio upload
  if (inputs.supports_audio_upload) {
    if (body.audio_url) {
      payload.audio_url = body.audio_url;
    } else if (inputs.audio_required) {
      errors.push("Áudio é obrigatório para este modelo");
    }
  }

  return { payload, endpoint, errors };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequest;
    const { model_id, offer_id } = body;

    if (!model_id) {
      return NextResponse.json({ error: "model_id é obrigatório" }, { status: 400 });
    }

    const model = getForgeModel(model_id);
    if (!model) {
      return NextResponse.json({ error: `Modelo não encontrado: ${model_id}` }, { status: 404 });
    }

    const { payload, endpoint, errors } = buildPayload(model, body);

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(" · "), code: "VALIDATION_ERROR", details: errors },
        { status: 400 },
      );
    }

    const apiKey = await getProviderKey(model.provider_id);
    const { requestId } = await submitGeneration(model.provider_id, endpoint, payload, apiKey);

    const supabase = createServerClient();
    const { data: generation, error } = await supabase
      .from("forge_generations")
      .insert({
        model_id,
        provider_id: model.provider_id,
        category: model.category,
        prompt: body.prompt || null,
        params: { ...payload, _endpoint: endpoint },
        status: requestId.startsWith("direct:") ? "completed" : "pending",
        result_url: requestId.startsWith("direct:") ? requestId.slice(7) : null,
        request_id: requestId.startsWith("direct:") ? null : requestId,
        offer_id: offer_id || null,
        completed_at: requestId.startsWith("direct:") ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error("[forge/generate] DB error:", error);
      return NextResponse.json({ error: "Falha ao salvar geração" }, { status: 500 });
    }

    return NextResponse.json(generation);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[forge/generate]", message);

    if (message.includes("API key not configured")) {
      return NextResponse.json({ error: message, code: "NO_API_KEY" }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
