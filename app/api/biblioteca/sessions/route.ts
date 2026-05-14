import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = createServerClient();

  // Try with pinned column
  let { data, error } = await supabase
    .from("book_sessions")
    .select("id, title, pinned, created_at, last_message_at")
    .order("pinned", { ascending: false, nullsFirst: false })
    .order("last_message_at", { ascending: false })
    .limit(50);

  // Fallback without pinned if column doesn't exist
  if (error?.message?.includes("pinned")) {
    const result = await supabase
      .from("book_sessions")
      .select("id, title, created_at, last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(50);
    data = (result.data || []).map((s) => ({ ...s, pinned: false }));
    error = result.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  const supabase = createServerClient();

  // Try without book_id first (if migration ran)
  const { data, error } = await supabase
    .from("book_sessions")
    .insert({})
    .select()
    .single();

  if (!error) return NextResponse.json(data);

  // Fallback: book_id still NOT NULL
  if (error.message.includes("not-null")) {
    const { data: books } = await supabase.from("books").select("id").limit(1);
    const bookId = books?.[0]?.id;

    if (bookId) {
      const { data: d2, error: e2 } = await supabase
        .from("book_sessions")
        .insert({ book_id: bookId })
        .select()
        .single();
      if (!e2) return NextResponse.json(d2);
    }

    // Last resort: placeholder book
    const { data: placeholder } = await supabase
      .from("books")
      .insert({ title: "_system", file_url: "", file_name: "_", status: "ready", chunk_count: 0 })
      .select("id")
      .single();

    if (placeholder) {
      const { data: d3, error: e3 } = await supabase
        .from("book_sessions")
        .insert({ book_id: placeholder.id })
        .select()
        .single();
      if (!e3) return NextResponse.json(d3);
    }
  }

  return NextResponse.json({ error: error.message }, { status: 500 });
}
