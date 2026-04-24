import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createServerClient } from "@/lib/supabase";
import { Offer } from "@/types";

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/offers GET]", error);
    return NextResponse.json({ error: "Erro ao buscar ofertas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<Offer>;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("offers")
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[api/offers POST]", error);
    return NextResponse.json({ error: "Erro ao criar oferta" }, { status: 500 });
  }
}
