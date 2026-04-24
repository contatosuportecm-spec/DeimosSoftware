import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { scrapeAndSaveSnapshot } from "@/lib/meta";
import { OfferStatus } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos

export async function GET(req: NextRequest) {
  // Valida o CRON_SECRET
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Busca todas as ofertas ativas com page_id
  const { data: offers, error } = await supabase
    .from("offers")
    .select("id, page_id, country, status")
    .neq("status", "archived")
    .not("page_id", "is", null);

  if (error) {
    console.error("[cron/daily-scrape]", error);
    return NextResponse.json({ error: "Erro ao buscar ofertas" }, { status: 500 });
  }

  if (!offers?.length) {
    return NextResponse.json({ scraped: 0, errors: 0, message: "Nenhuma oferta ativa" });
  }

  let scraped = 0;
  let errors  = 0;
  const log: Array<{ id: string; status: "ok" | "error"; error?: string }> = [];

  // Sequencial para não saturar a Meta API (rate limits)
  for (const offer of offers) {
    try {
      await scrapeAndSaveSnapshot(
        offer.id,
        offer.page_id!,
        offer.country,
        offer.status as OfferStatus,
        supabase
      );
      scraped++;
      log.push({ id: offer.id, status: "ok" });
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      log.push({ id: offer.id, status: "error", error: msg });
      console.error(`[daily-scrape] offer ${offer.id}:`, err);
    }
  }

  return NextResponse.json({ scraped, errors, log });
}
