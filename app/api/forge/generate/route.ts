import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getForgeModel } from "@/lib/forge/models";
import { getProviderKey, submitGeneration } from "@/lib/forge/provider-router";
import { GenerateRequest } from "@/types/forge";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequest;
    const { model_id, prompt, aspect_ratio, resolution, duration, quality, effect, image_url, audio_url, offer_id } = body;

    if (!model_id) {
      return NextResponse.json({ error: "model_id is required" }, { status: 400 });
    }

    const model = getForgeModel(model_id);
    if (!model) {
      return NextResponse.json({ error: `Model not found: ${model_id}` }, { status: 404 });
    }

    // Get API key for this provider
    const apiKey = await getProviderKey(model.provider_id);

    // Build payload based on model category
    const payload: Record<string, unknown> = {};

    if (prompt) payload.prompt = prompt;
    if (aspect_ratio) payload.aspect_ratio = aspect_ratio;
    if (resolution) payload.resolution = resolution;
    if (duration) payload.duration = duration;
    if (quality) payload.quality = quality;
    if (effect) payload.name = effect; // Muapi uses "name" for effect type
    if (image_url) payload[model.inputs.image_field || "image_url"] = image_url;
    if (audio_url) payload.audio_url = audio_url;

    // Submit to provider
    const { requestId } = await submitGeneration(model.provider_id, model_id, payload, apiKey);

    // Save generation to DB
    const supabase = createServerClient();
    const { data: generation, error } = await supabase
      .from("forge_generations")
      .insert({
        model_id,
        provider_id: model.provider_id,
        category: model.category,
        prompt: prompt || null,
        params: { aspect_ratio, resolution, duration, quality, effect, image_url, audio_url },
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
      return NextResponse.json({ error: "Failed to save generation" }, { status: 500 });
    }

    return NextResponse.json(generation);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[forge/generate]", message);

    // Return user-friendly error for missing API key
    if (message.includes("API key not configured")) {
      return NextResponse.json({ error: message, code: "NO_API_KEY" }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
