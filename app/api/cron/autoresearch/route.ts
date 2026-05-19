import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { advanceCampaign } from "@/lib/autoresearch/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// GET /api/cron/autoresearch — tick loop
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  const { data: campaigns, error } = await supabase
    .from("autoresearch_campaigns")
    .select("id, name")
    .eq("status", "active");

  if (error) {
    console.error("[cron/autoresearch]", error);
    return NextResponse.json({ error: "Erro ao buscar campanhas" }, { status: 500 });
  }

  if (!campaigns?.length) {
    return NextResponse.json({ processed: 0, message: "Nenhuma campanha ativa" });
  }

  const results: Array<{ id: string; name: string; action: string; detail?: string }> = [];

  for (const camp of campaigns) {
    try {
      const result = await advanceCampaign(camp.id);
      results.push({ id: camp.id, name: camp.name, ...result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: camp.id, name: camp.name, action: "error", detail: msg });
      console.error(`[cron/autoresearch] campaign ${camp.id}:`, err);
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
