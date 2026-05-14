import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { personaId: string } }) {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("client_sessions").select("*").eq("persona_id", params.personaId).order("last_message_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
}

export async function POST(_: NextRequest, { params }: { params: { personaId: string } }) {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("client_sessions").insert({ persona_id: params.personaId }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
