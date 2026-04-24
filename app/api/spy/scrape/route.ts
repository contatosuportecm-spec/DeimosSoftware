import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { scrapeAndSaveSnapshot } from "@/lib/meta";
import { OfferStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { offer_id } = await req.json() as { offer_id: string };

    if (!offer_id) {
      return NextResponse.json({ error: "offer_id obrigatório" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: offer, error: offerErr } = await supabase
      .from("offers")
      .select("id, page_id, country, status")
      .eq("id", offer_id)
      .single();

    if (offerErr || !offer) {
      return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });
    }

    if (!offer.page_id) {
      return NextResponse.json({ error: "Oferta sem page_id — adicione um link da biblioteca válido" }, { status: 400 });
    }

    const result = await scrapeAndSaveSnapshot(
      offer.id,
      offer.page_id,
      offer.country,
      offer.status as OfferStatus,
      supabase
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/spy/scrape]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao scrape" },
      { status: 500 }
    );
  }
}
