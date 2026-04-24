import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/discovery
 *
 * Discovery roda via Python (Playwright) no Railway como cron job.
 * Este endpoint é um fallback/trigger que pode ser usado para
 * disparar o collector via Railway API se configurado.
 *
 * O collector Python salva diretamente no Supabase,
 * então o Deimos já enxerga as ofertas descobertas automaticamente.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Se RAILWAY_COLLECTOR_URL estiver configurado, dispara o collector
  const collectorUrl = process.env.RAILWAY_COLLECTOR_URL;
  if (collectorUrl) {
    try {
      const res = await fetch(collectorUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "BR" }),
      });
      const data = await res.json();
      return NextResponse.json({ status: "triggered", ...data });
    } catch (err) {
      console.error("[cron/discovery] trigger failed:", err);
      return NextResponse.json(
        { error: "Falha ao disparar collector", detail: String(err) },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({
    status: "skipped",
    message: "Discovery roda via Python/Playwright no Railway. Configure RAILWAY_COLLECTOR_URL para trigger automático.",
  });
}
