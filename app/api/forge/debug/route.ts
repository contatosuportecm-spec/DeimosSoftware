import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getProviderKey } from "@/lib/forge/provider-router";

export const dynamic = "force-dynamic";

// GET /api/forge/debug?id=<generation_id>
// Returns the raw Muapi response so we can inspect the actual JSON shape.
// Remove after diagnosing the polling issue.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createServerClient();
  const { data: gen, error } = await supabase
    .from("forge_generations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !gen) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!gen.request_id) {
    return NextResponse.json({ generation: gen, note: "no request_id stored" });
  }

  try {
    const apiKey = await getProviderKey(gen.provider_id);
    const url = `https://api.muapi.ai/api/v1/predictions/${gen.request_id}/result`;

    const r = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    });

    const text = await r.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    return NextResponse.json({
      generation: {
        id: gen.id,
        status: gen.status,
        request_id: gen.request_id,
        result_url: gen.result_url,
        model_id: gen.model_id,
      },
      muapi: {
        endpoint: url,
        http_status: r.status,
        raw_text: text.slice(0, 4000),
        parsed,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
