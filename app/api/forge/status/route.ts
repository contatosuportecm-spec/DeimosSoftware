import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getProviderKey, pollGeneration } from "@/lib/forge/provider-router";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: generation, error } = await supabase
    .from("forge_generations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !generation) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  // Already terminal state
  if (generation.status === "completed" || generation.status === "failed") {
    return NextResponse.json(generation);
  }

  // Poll the provider
  if (!generation.request_id) {
    return NextResponse.json(generation);
  }

  try {
    const apiKey = await getProviderKey(generation.provider_id);
    const result = await pollGeneration(generation.provider_id, generation.request_id, apiKey);

    if (result.status === "completed" && result.url) {
      const { data: updated } = await supabase
        .from("forge_generations")
        .update({
          status: "completed",
          result_url: result.url,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      return NextResponse.json(updated);
    }

    if (result.status === "failed") {
      const { data: updated } = await supabase
        .from("forge_generations")
        .update({
          status: "failed",
          error: result.error || "Generation failed",
        })
        .eq("id", id)
        .select()
        .single();

      return NextResponse.json(updated);
    }

    // Still processing — update status if needed
    if (generation.status !== "processing") {
      await supabase
        .from("forge_generations")
        .update({ status: "processing" })
        .eq("id", id);
    }

    return NextResponse.json({ ...generation, status: "processing" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Poll error";
    console.error("[forge/status]", message);
    return NextResponse.json({ ...generation, status: "processing" });
  }
}
