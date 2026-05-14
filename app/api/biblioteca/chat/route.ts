import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getRelevantChunks } from "@/lib/chunks";
import { createSSEStream, SSE_HEADERS } from "@/lib/stream";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_CONTEXT_CHARS = 120_000; // ~30K tokens — safe for Gemini 2.5 Pro

interface BookMeta {
  id: string;
  title: string;
  author: string | null;
  source_type: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = body.sessionId as string;
    const message = body.message as string;
    // Support both single bookId and array bookIds
    const bookIds: string[] = body.bookIds
      || (body.bookId ? [body.bookId] : []);

    if (!message?.trim()) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    if (!sessionId) return NextResponse.json({ error: "sessionId obrigatorio" }, { status: 400 });

    const supabase = createServerClient();
    let systemPrompt: string;

    if (bookIds.length > 0) {
      // Fetch all selected books metadata
      const { data: booksData } = await supabase
        .from("books")
        .select("id, title, author, source_type")
        .in("id", bookIds);

      const books: BookMeta[] = booksData || [];
      if (books.length === 0) {
        return NextResponse.json({ error: "Documentos nao encontrados" }, { status: 404 });
      }

      // Fetch all chunks for selected books
      const { data: allChunks } = await supabase
        .from("book_chunks")
        .select("book_id, chunk_index, content")
        .in("book_id", bookIds)
        .order("chunk_index");

      if (!allChunks || allChunks.length === 0) {
        systemPrompt = "Voce e um assistente da plataforma DEIMOS. Os documentos selecionados nao tem conteudo processado. Responda em portugues.";
      } else {
        // Calculate total size
        const totalChars = allChunks.reduce((sum, c) => sum + c.content.length, 0);
        let documentContext: string;

        if (totalChars <= MAX_CONTEXT_CHARS) {
          // Everything fits — pass all content grouped by document
          const sections: string[] = [];
          for (const book of books) {
            const bookChunks = allChunks
              .filter((c) => c.book_id === book.id)
              .sort((a, b) => a.chunk_index - b.chunk_index);
            const label = book.source_type === "youtube" ? "YouTube" : "PDF";
            sections.push(
              `--- DOCUMENTO: "${book.title}"${book.author ? ` (${book.author})` : ""} [${label}] ---\n\n${bookChunks.map((c) => c.content).join("\n\n")}`
            );
          }
          documentContext = sections.join("\n\n\n");
        } else {
          // Too large — use smart retrieval per document
          const chunksPerDoc = Math.max(8, Math.floor(20 / books.length));
          const sections: string[] = [];
          for (const book of books) {
            const bookChunks = allChunks
              .filter((c) => c.book_id === book.id)
              .sort((a, b) => a.chunk_index - b.chunk_index);
            const relevant = getRelevantChunks(
              bookChunks.map((c) => ({ chunk_index: c.chunk_index, content: c.content })),
              message,
              chunksPerDoc
            );
            const label = book.source_type === "youtube" ? "YouTube" : "PDF";
            sections.push(
              `--- DOCUMENTO: "${book.title}"${book.author ? ` (${book.author})` : ""} [${label}] ---\n\n${relevant.join("\n\n")}`
            );
          }
          documentContext = sections.join("\n\n\n");
        }

        const docList = books.map((b) => `• "${b.title}"${b.author ? ` — ${b.author}` : ""} [${b.source_type === "youtube" ? "YouTube" : "PDF"}]`).join("\n");
        const multiDoc = books.length > 1;

        systemPrompt = `Voce e um assistente de inteligencia da plataforma DEIMOS, especializado em analise profunda de documentos.

${multiDoc ? `DOCUMENTOS ATIVOS (${books.length}):` : "DOCUMENTO ATIVO:"}
${docList}

INSTRUCOES CRITICAS:
1. Responda EXCLUSIVAMENTE com base no conteudo dos documentos fornecidos abaixo. Nao invente, nao extrapole, nao use conhecimento externo.
2. Quando citar algo, use aspas e IDENTIFIQUE de qual documento veio: "conforme [nome do documento]".
${multiDoc ? `3. Quando o usuario perguntar algo que aparece em mais de um documento, COMPARE e CONTRASTE as perspectivas de cada um.
4. Se a informacao esta em um documento mas nao em outro, diga claramente qual documento aborda e qual nao aborda.` : `3. Se a informacao pedida NAO estiver no conteudo, diga: "Essa informacao nao foi encontrada nos trechos analisados. Tente reformular com palavras diferentes."`}
${multiDoc ? "5" : "4"}. Conteudo de YouTube pode ter erros de legendagem — interprete o contexto.
${multiDoc ? "6" : "5"}. Seja preciso, detalhado e pratico. Conecte conceitos entre documentos quando relevante.
${multiDoc ? "7" : "6"}. Responda SEMPRE em portugues brasileiro.
${multiDoc ? "8" : "7"}. Se pedirem lista, extraia APENAS o que esta explicito nos documentos.

=== CONTEUDO DOS DOCUMENTOS ===
${documentContext}
=== FIM DO CONTEUDO ===`;
      }
    } else {
      systemPrompt = `Voce e um assistente de inteligencia da plataforma DEIMOS.
O usuario esta na BIBLIOTECA — modulo para conversar com documentos (PDFs e videos YouTube).
Nenhum documento selecionado. Sugira selecionar documentos no seletor abaixo do chat.
Responda em portugues brasileiro.`;
    }

    // Conversation history
    const { data: history } = await supabase
      .from("book_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(12);

    const messages = [
      ...(history || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: message },
    ];

    await supabase.from("book_messages").insert({ session_id: sessionId, role: "user", content: message });

    const { data: session } = await supabase.from("book_sessions").select("title").eq("id", sessionId).single();
    if (!session?.title) {
      await supabase.from("book_sessions").update({ title: message.slice(0, 60) }).eq("id", sessionId);
    }

    const stream = await createSSEStream({ messages, systemPrompt, temperature: 0.4 });
    const [streamForClient, streamForSave] = stream.tee();

    const reader = streamForSave.getReader();
    const decoder = new TextDecoder();
    const full: string[] = [];
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const l of decoder.decode(value).split("\n")) {
            if (!l.startsWith("data: ")) continue;
            const d = l.slice(6);
            if (d === "[DONE]") continue;
            try { full.push(JSON.parse(d).text); } catch {}
          }
        }
        if (full.length > 0) {
          await supabase.from("book_messages").insert({ session_id: sessionId, role: "assistant", content: full.join("") });
        }
      } catch (e) { console.error("[save book msg]", e); }
    })();

    return new Response(streamForClient, { headers: SSE_HEADERS });
  } catch (err) {
    console.error("[biblioteca/chat]", err);
    return NextResponse.json({ error: "Erro no chat" }, { status: 500 });
  }
}
