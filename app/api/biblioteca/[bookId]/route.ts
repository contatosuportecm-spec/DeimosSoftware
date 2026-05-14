import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { bookId: string } }) {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("books").select("id, title, author, chunk_count, status, error_msg, created_at").eq("id", params.bookId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: { bookId: string } }) {
  const supabase = createServerClient();

  // Delete chunks first (in case CASCADE isn't working)
  await supabase.from("book_messages").delete().in(
    "session_id",
    (await supabase.from("book_sessions").select("id").eq("book_id", params.bookId)).data?.map(s => s.id) || []
  );
  await supabase.from("book_sessions").delete().eq("book_id", params.bookId);
  await supabase.from("book_chunks").delete().eq("book_id", params.bookId);

  const { error, count } = await supabase.from("books").delete().eq("id", params.bookId).select();
  console.log(`[DELETE book] id=${params.bookId} error=${error?.message || "none"} count=${count}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
