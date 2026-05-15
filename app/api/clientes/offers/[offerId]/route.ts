import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function DELETE(_: NextRequest, { params }: { params: { offerId: string } }) {
  const supabase = createServerClient();
  const { error } = await supabase.from("persona_offers").delete().eq("id", params.offerId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { offerId: string } }) {
  const body = await req.json();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("persona_offers")
    .update(body)
    .eq("id", params.offerId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
