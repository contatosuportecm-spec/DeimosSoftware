import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = createServerClient();

  // Try with source_type fields first
  let { data, error } = await supabase
    .from("books")
    .select("id, title, author, chunk_count, status, error_msg, source_type, source_url, created_at")
    .neq("title", "_system")
    .order("created_at", { ascending: false });

  // Fallback without source_type if columns don't exist yet
  if (error?.message?.includes("source_type")) {
    const result = await supabase
      .from("books")
      .select("id, title, author, chunk_count, status, error_msg, created_at")
      .neq("title", "_system")
      .order("created_at", { ascending: false });
    data = (result.data || []).map((b) => ({ ...b, source_type: "pdf", source_url: null }));
    error = result.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
