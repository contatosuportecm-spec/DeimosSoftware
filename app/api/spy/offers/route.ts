import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { extractPageId, scrapeAndSaveSnapshot } from "@/lib/meta";
import { Country, OfferWithSnapshots, OfferSnapshot, OfferTag } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/spy/offers — retorna todas as ofertas com últimos 5 snapshots
export async function GET() {
  try {
    const supabase = createServerClient();

    // 1. Busca todas as ofertas
    const { data: offers, error: offersErr } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (offersErr) throw offersErr;
    if (!offers?.length) return NextResponse.json([]);

    // 2. Busca snapshots de todas as ofertas de uma vez
    const offerIds = offers.map((o) => o.id);
    const { data: allSnaps, error: snapsErr } = await supabase
      .from("offer_snapshots")
      .select("*")
      .in("offer_id", offerIds)
      .order("date", { ascending: true });

    if (snapsErr) throw snapsErr;

    // 3. Agrupa snapshots por offer_id (últimos 5)
    const snapsByOffer: Record<string, OfferSnapshot[]> = {};
    for (const snap of allSnaps ?? []) {
      if (!snapsByOffer[snap.offer_id]) snapsByOffer[snap.offer_id] = [];
      snapsByOffer[snap.offer_id].push(snap as OfferSnapshot);
    }

    // Mantém apenas os últimos 5 de cada oferta
    for (const id of offerIds) {
      const snaps = snapsByOffer[id] ?? [];
      snapsByOffer[id] = snaps.slice(-5);
    }

    // 4. Monta o resultado
    const result: OfferWithSnapshots[] = offers.map((offer) => ({
      ...offer,
      snapshots: snapsByOffer[offer.id] ?? [],
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/spy/offers GET]", err);
    return NextResponse.json({ error: "Erro ao buscar ofertas" }, { status: 500 });
  }
}

// POST /api/spy/offers — cria oferta e dispara scrape inicial
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name: string;
      library_url: string;
      country: Country;
      niche?: string;
      tag?: OfferTag | null;
    };

    const { name, library_url, country, niche = "geral", tag = null } = body;

    if (!name || !library_url || !country) {
      return NextResponse.json({ error: "name, library_url e country são obrigatórios" }, { status: 400 });
    }

    // Extrai page_id da URL
    const page_id = extractPageId(library_url);
    if (!page_id) {
      return NextResponse.json(
        { error: "URL inválida — view_all_page_id não encontrado. Use um link direto da Meta Ads Library." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Cria a oferta
    const { data: offer, error: insertErr } = await supabase
      .from("offers")
      .insert({
        name,
        library_url,
        country,
        page_id,
        niche,
        source: "meta_library",
        status: "new",
        ...(tag ? { tag } : {}),
      })
      .select()
      .single();

    if (insertErr || !offer) throw insertErr;

    // Dispara scrape inicial (sem HTTP interno)
    try {
      await scrapeAndSaveSnapshot(offer.id, page_id, country, "new", supabase);
    } catch (scrapeErr) {
      // Não falha o cadastro se o scrape falhar — usuário pode forçar manualmente depois
      console.error("[spy/offers POST] scrape inicial falhou:", scrapeErr);
    }

    // Retorna a oferta com snapshots
    const { data: snaps } = await supabase
      .from("offer_snapshots")
      .select("*")
      .eq("offer_id", offer.id)
      .order("date", { ascending: true })
      .limit(5);

    const result: OfferWithSnapshots = {
      ...offer,
      snapshots: (snaps ?? []) as OfferSnapshot[],
    };

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[api/spy/offers POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar oferta" },
      { status: 500 }
    );
  }
}
