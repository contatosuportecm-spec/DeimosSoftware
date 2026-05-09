import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { scrapeAndSaveSnapshot } from "@/lib/meta";
import { OfferStatus } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Roda o scrape de TODAS as ofertas ativas — versão chamável da UI.
 *
 * Gateada pra NODE_ENV=development por segurança: Playwright só roda
 * com Chromium local instalado (next dev), não em deploy serverless.
 */
export async function POST() {
  if (process.env.NODE_ENV !== "development" && process.env.ALLOW_LOCAL_SCRAPE !== "true") {
    return NextResponse.json(
      {
        error:
          "Esta rota só roda em desenvolvimento local (next dev). " +
          "Em produção use o cron /api/cron/daily-scrape ou rode `npm run scrape`.",
      },
      { status: 403 },
    );
  }

  const supabase = createServerClient();

  const { data: offers, error } = await supabase
    .from("offers")
    .select("id, name, page_id, country, status")
    .neq("status", "archived")
    .not("page_id", "is", null);

  if (error) {
    console.error("[spy/scrape-all]", error);
    return NextResponse.json({ error: "Erro ao buscar ofertas" }, { status: 500 });
  }

  if (!offers?.length) {
    return NextResponse.json({ scraped: 0, errors: 0, total: 0, log: [] });
  }

  const log: Array<{ id: string; name: string; status: "ok" | "error"; count?: number; error?: string }> = [];
  let scraped = 0;
  let errors = 0;

  for (const offer of offers) {
    try {
      const { count } = await scrapeAndSaveSnapshot(
        offer.id,
        offer.page_id!,
        offer.country,
        offer.status as OfferStatus,
        supabase,
      );
      scraped++;
      log.push({ id: offer.id, name: offer.name, status: "ok", count });
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      log.push({ id: offer.id, name: offer.name, status: "error", error: msg });
      console.error(`[spy/scrape-all] offer ${offer.id}:`, err);
    }
  }

  return NextResponse.json({ scraped, errors, total: offers.length, log });
}
