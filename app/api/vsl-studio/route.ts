import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("vsl_sessions").select("*").order("last_message_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
}

export async function POST(req: NextRequest) {
  try {
    const { context_kind, context_id, title } = (await req.json()) as { context_kind: "copywriter" | "book"; context_id: string; title?: string };
    if (!context_kind || !context_id) return NextResponse.json({ error: "context_kind e context_id obrigatorios" }, { status: 400 });
    const supabase = createServerClient();
    const { data, error } = await supabase.from("vsl_sessions").insert({ context_kind, context_id, title: title || null }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) { console.error("[vsl-studio]", err); return NextResponse.json({ error: "Erro ao criar sessao" }, { status: 500 }); }
}
