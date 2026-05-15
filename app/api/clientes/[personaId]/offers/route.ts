import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { personaId: string } }) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("persona_offers")
    .select("*")
    .eq("persona_id", params.personaId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest, { params }: { params: { personaId: string } }) {
  const { title, content, last_report } = (await req.json()) as {
    title: string;
    content: string;
    last_report?: Record<string, unknown>;
  };
  if (!title?.trim() || !content?.trim())
    return NextResponse.json({ error: "Titulo e conteudo obrigatorios" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("persona_offers")
    .insert({
      persona_id: params.personaId,
      title: title.trim(),
      content: content.trim(),
      last_report: last_report || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
