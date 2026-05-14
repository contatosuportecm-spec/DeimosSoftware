import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("client_personas").select("id, name, age_range, gender, niche, pains, desires, objections, vocabulary, behavior, emotional_state, awareness_level, avatar_color, status, created_at, updated_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
}
