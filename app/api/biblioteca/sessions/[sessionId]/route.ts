import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { sessionId: string } }) {
  const supabase = createServerClient();
  const { data: messages, error } = await supabase
    .from("book_messages")
    .select("id, role, content, created_at")
    .eq("session_id", params.sessionId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const body = await req.json();
  const supabase = createServerClient();
  const { error } = await supabase
    .from("book_sessions")
    .update(body)
    .eq("id", params.sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { sessionId: string } }) {
  const supabase = createServerClient();
  // Delete messages first then session
  await supabase.from("book_messages").delete().eq("session_id", params.sessionId);
  const { error } = await supabase.from("book_sessions").delete().eq("id", params.sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
