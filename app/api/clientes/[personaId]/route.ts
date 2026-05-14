import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { personaId: string } }) {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("client_personas").select("*").eq("id", params.personaId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: { personaId: string } }) {
  const supabase = createServerClient();
  const { error } = await supabase.from("client_personas").delete().eq("id", params.personaId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
