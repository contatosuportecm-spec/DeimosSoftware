import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// PATCH /api/spy/keywords/:id — toggle ativo/inativo
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as { is_active?: boolean; category?: string };
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("spy_keywords")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/spy/keywords PATCH]", err);
    return NextResponse.json({ error: "Erro ao atualizar keyword" }, { status: 500 });
  }
}

// DELETE /api/spy/keywords/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("spy_keywords")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/spy/keywords DELETE]", err);
    return NextResponse.json({ error: "Erro ao deletar keyword" }, { status: 500 });
  }
}
