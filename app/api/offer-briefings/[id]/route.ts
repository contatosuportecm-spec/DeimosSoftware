import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/offer-briefings/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("offer_briefings")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/offer-briefings/[id] GET]", err);
    return NextResponse.json({ error: "Briefing nao encontrado" }, { status: 404 });
  }
}

// PATCH /api/offer-briefings/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("offer_briefings")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/offer-briefings/[id] PATCH]", err);
    return NextResponse.json({ error: "Erro ao atualizar briefing" }, { status: 500 });
  }
}

// DELETE /api/offer-briefings/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("offer_briefings").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/offer-briefings/[id] DELETE]", err);
    return NextResponse.json({ error: "Erro ao deletar briefing" }, { status: 500 });
  }
}
