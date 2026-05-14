import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { chunkText } from "@/lib/chunks";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Re-chunk all existing books with the improved chunking algorithm. */
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: books } = await supabase
      .from("books")
      .select("id, title, full_text, chunk_count")
      .eq("status", "ready")
      .neq("title", "_system");

    if (!books || books.length === 0) {
      return NextResponse.json({ message: "Nenhum livro para re-chunkar" });
    }

    const results: { id: string; title: string; oldChunks: number; newChunks: number }[] = [];

    for (const book of books) {
      if (!book.full_text || book.full_text.trim().length < 50) continue;

      // Delete old chunks
      await supabase.from("book_chunks").delete().eq("book_id", book.id);

      // Re-chunk with new algorithm (1500 chars, 300 overlap)
      const chunks = chunkText(book.full_text);

      // Insert new chunks
      for (let i = 0; i < chunks.length; i += 50) {
        const batch = chunks.slice(i, i + 50).map((content, idx) => ({
          book_id: book.id,
          chunk_index: i + idx,
          content,
        }));
        await supabase.from("book_chunks").insert(batch);
      }

      // Update chunk count
      await supabase.from("books").update({ chunk_count: chunks.length }).eq("id", book.id);

      results.push({
        id: book.id,
        title: book.title,
        oldChunks: book.chunk_count,
        newChunks: chunks.length,
      });
    }

    return NextResponse.json({ rechunked: results.length, results });
  } catch (err) {
    console.error("[rechunk]", err);
    return NextResponse.json({ error: "Erro ao re-chunkar" }, { status: 500 });
  }
}
