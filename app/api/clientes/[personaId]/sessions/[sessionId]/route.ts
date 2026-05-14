import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { personaId: string; sessionId: string } }) {
  const supabase = createServerClient();
  const { data: messages, error } = await supabase
    .from("client_messages")
    .select("id, role, content, created_at")
    .eq("session_id", params.sessionId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_: NextRequest, { params }: { params: { personaId: string; sessionId: string } }) {
  const supabase = createServerClient();
  await supabase.from("client_messages").delete().eq("session_id", params.sessionId);
  const { error } = await supabase.from("client_sessions").delete().eq("id", params.sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
