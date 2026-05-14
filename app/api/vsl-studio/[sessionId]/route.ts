import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { sessionId: string } }) {
  const supabase = createServerClient();
  const { data: session, error: sErr } = await supabase.from("vsl_sessions").select("*").eq("id", params.sessionId).single();
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 404 });
  const { data: messages } = await supabase.from("vsl_messages").select("*").eq("session_id", params.sessionId).order("created_at", { ascending: true });
  return NextResponse.json({ session, messages: messages || [] });
}
