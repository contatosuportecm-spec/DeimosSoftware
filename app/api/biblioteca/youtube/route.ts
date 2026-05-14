import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { chunkText } from "@/lib/chunks";
import { YoutubeTranscript } from "youtube-transcript";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

async function transcribeVideo(videoId: string): Promise<string> {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  return transcript.map((t) => t.text).join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Support both { urls: [...] } and legacy { url: "..." }
    const urls: string[] = body.urls || (body.url ? [body.url] : []);
    const title = ((body.title as string) || "").trim();
    const author = ((body.author as string) || "").trim() || null;

    if (urls.length === 0) return NextResponse.json({ error: "Nenhum link fornecido" }, { status: 400 });

    // Validate all URLs
    const videoIds: { id: string; url: string }[] = [];
    for (const url of urls) {
      const vid = extractVideoId(url.trim());
      if (!vid) return NextResponse.json({ error: `URL invalida: ${url}` }, { status: 400 });
      videoIds.push({ id: vid, url: url.trim() });
    }

    // Transcribe all videos
    const transcriptions: string[] = [];
    const failedUrls: string[] = [];

    for (const { id, url } of videoIds) {
      try {
        const text = await transcribeVideo(id);
        if (text && text.trim().length > 10) {
          if (videoIds.length > 1) {
            transcriptions.push(`=== Video: ${url} ===\n\n${text}`);
          } else {
            transcriptions.push(text);
          }
        } else {
          failedUrls.push(url);
        }
      } catch {
        failedUrls.push(url);
      }
    }

    if (transcriptions.length === 0) {
      return NextResponse.json(
        { error: `Nenhum video teve transcricao disponivel.${failedUrls.length > 0 ? ` Falhou: ${failedUrls.join(", ")}` : ""}` },
        { status: 400 }
      );
    }

    const fullText = transcriptions.join("\n\n\n");

    const supabase = createServerClient();
    const id = crypto.randomUUID();
    const chunks = chunkText(fullText, 1000, 200);

    const defaultTitle = videoIds.length === 1
      ? `YouTube: ${videoIds[0].id}`
      : `YouTube: ${videoIds.length} videos`;

    // Try with source_type first, fallback without
    const insertData: Record<string, unknown> = {
      id,
      title: title || defaultTitle,
      author,
      file_url: "",
      file_name: videoIds.map((v) => `youtube-${v.id}`).join(","),
      file_size: null,
      full_text: fullText,
      chunk_count: chunks.length,
      status: "ready",
    };

    let { data: book, error: bookError } = await supabase
      .from("books")
      .insert({ ...insertData, source_type: "youtube", source_url: videoIds.map((v) => v.url).join("\n") })
      .select()
      .single();

    if (bookError?.message?.includes("source_type")) {
      const result = await supabase.from("books").insert(insertData).select().single();
      book = result.data;
      bookError = result.error;
    }

    if (bookError) return NextResponse.json({ error: bookError.message }, { status: 500 });

    for (let i = 0; i < chunks.length; i += 50) {
      const batch = chunks.slice(i, i + 50).map((content, idx) => ({
        book_id: id,
        chunk_index: i + idx,
        content,
      }));
      await supabase.from("book_chunks").insert(batch);
    }

    const result: Record<string, unknown> = { ...book };
    if (failedUrls.length > 0) {
      result.warning = `${failedUrls.length} video(s) sem transcricao: ${failedUrls.join(", ")}`;
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[biblioteca/youtube]", err);
    return NextResponse.json({ error: "Erro ao processar videos" }, { status: 500 });
  }
}
