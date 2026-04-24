import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { OfferStatus } from "@/types";

export const dynamic = "force-dynamic";

// PATCH /api/spy/offers/[id] — atualiza status (ex: arquivar)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as { status?: OfferStatus };
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("offers")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/spy/offers/[id] PATCH]", err);
    return NextResponse.json({ error: "Erro ao atualizar oferta" }, { status: 500 });
  }
}

// DELETE /api/spy/offers/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("offers").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/spy/offers/[id] DELETE]", err);
    return NextResponse.json({ error: "Erro ao deletar oferta" }, { status: 500 });
  }
}
