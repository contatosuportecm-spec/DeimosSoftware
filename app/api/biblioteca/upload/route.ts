import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { chunkText } from "@/lib/chunks";
import { extractPdfText } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = ((formData.get("title") as string) || "").trim();
    const author = ((formData.get("author") as string) || "").trim() || null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Envie um arquivo PDF valido" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fullText = await extractPdfText(buffer);

    if (!fullText || fullText.trim().length < 50) {
      return NextResponse.json({ error: "PDF sem texto extraivel" }, { status: 400 });
    }

    const supabase = createServerClient();
    const id = crypto.randomUUID();
    const chunks = chunkText(fullText);

    const { data: book, error: bookError } = await supabase
      .from("books")
      .insert({
        id,
        title: title || file.name.replace(/\.pdf$/i, ""),
        author,
        file_url: "",
        file_name: file.name,
        file_size: file.size,
        full_text: fullText,
        chunk_count: chunks.length,
        status: "ready",
      })
      .select()
      .single();

    if (bookError) {
      return NextResponse.json({ error: bookError.message }, { status: 500 });
    }

    for (let i = 0; i < chunks.length; i += 50) {
      const batch = chunks.slice(i, i + 50).map((content, idx) => ({
        book_id: id,
        chunk_index: i + idx,
        content,
      }));
      await supabase.from("book_chunks").insert(batch);
    }

    return NextResponse.json(book);
  } catch (err) {
    console.error("[biblioteca/upload]", err);
    return NextResponse.json({ error: "Erro ao processar upload" }, { status: 500 });
  }
}
