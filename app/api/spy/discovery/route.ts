import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/spy/discovery — retorna últimos discovery runs
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("discovery_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(5);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[api/spy/discovery GET]", err);
    return NextResponse.json({ error: "Erro ao buscar runs" }, { status: 500 });
  }
}

// POST /api/spy/discovery — dispara discovery via Railway collector
export async function POST() {
  const collectorUrl = process.env.RAILWAY_COLLECTOR_URL;

  if (!collectorUrl) {
    return NextResponse.json(
      { error: "RAILWAY_COLLECTOR_URL não configurado. Discovery roda via Python/Playwright." },
      { status: 501 }
    );
  }

  try {
    const res = await fetch(collectorUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "BR" }),
    });
    const data = await res.json();
    return NextResponse.json({ status: "triggered", ...data });
  } catch (err) {
    console.error("[api/spy/discovery POST]", err);
    return NextResponse.json(
      { error: "Falha ao disparar collector" },
      { status: 502 }
    );
  }
}
