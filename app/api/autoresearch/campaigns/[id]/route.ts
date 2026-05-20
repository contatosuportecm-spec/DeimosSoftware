import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/autoresearch/campaigns/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    const { data: campaign, error } = await supabase
      .from("autoresearch_campaigns")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) throw error;

    const { data: rounds } = await supabase
      .from("autoresearch_iterations")
      .select("*")
      .eq("campaign_id", params.id)
      .order("iteration_number", { ascending: true });

    return NextResponse.json({ ...campaign, rounds: rounds ?? [] });
  } catch (err) {
    console.error("[api/autoresearch/campaigns/[id] GET]", err);
    return NextResponse.json({ error: "Campanha nao encontrada" }, { status: 404 });
  }
}

// PATCH /api/autoresearch/campaigns/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("autoresearch_campaigns")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/autoresearch/campaigns/[id] PATCH]", err);
    return NextResponse.json({ error: "Erro ao atualizar campanha" }, { status: 500 });
  }
}

// DELETE /api/autoresearch/campaigns/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("autoresearch_campaigns").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/autoresearch/campaigns/[id] DELETE]", err);
    return NextResponse.json({ error: "Erro ao deletar campanha" }, { status: 500 });
  }
}
