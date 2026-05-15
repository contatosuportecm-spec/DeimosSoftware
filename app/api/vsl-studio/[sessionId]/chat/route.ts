import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createSSEStream, SSE_HEADERS } from "@/lib/stream";
import { getRelevantChunks } from "@/lib/chunks";
import { COPYWRITERS } from "@/lib/copywriters";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { message, offer_ids } = (await req.json()) as { message: string; offer_ids?: string[] };
    if (!message?.trim()) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    const supabase = createServerClient();

    // Fetch referenced offers
    let offerCtx = "";
    if (offer_ids && offer_ids.length > 0) {
      const { data: pOffers } = await supabase.from("persona_offers").select("title, content").in("id", offer_ids);
      const { data: briefings } = await supabase.from("offer_briefings").select("offer_name, niche, promise, main_headline, target_audience, main_pains, main_desires, new_mechanism, product_name, price, guarantee, main_cta").in("id", offer_ids);
      const parts: string[] = [];
      if (pOffers) parts.push(...pOffers.map((o) => `[${o.title}]\n${o.content}`));
      if (briefings) parts.push(...briefings.map((b) => [`[OFERTA: ${b.offer_name}]`, b.main_headline && `Headline: ${b.main_headline}`, b.promise && `Promessa: ${b.promise}`, b.new_mechanism && `Mecanismo: ${b.new_mechanism}`, b.target_audience && `Publico: ${b.target_audience}`, b.main_pains?.length && `Dores: ${b.main_pains.join(", ")}`, b.main_desires?.length && `Desejos: ${b.main_desires.join(", ")}`, b.product_name && `Produto: ${b.product_name}`, b.price && `Preco: R$${b.price}`, b.guarantee && `Garantia: ${b.guarantee}`, b.main_cta && `CTA: ${b.main_cta}`].filter(Boolean).join("\n")));
      if (parts.length > 0) offerCtx = `\n\n--- CONTEXTO DA OFERTA ---\n${parts.join("\n\n")}\n---`;
    }

    const { data: session } = await supabase.from("vsl_sessions").select("*").eq("id", params.sessionId).single();
    if (!session) return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 });

    let systemPrompt: string;
    if (session.context_kind === "copywriter") {
      const cw = COPYWRITERS.find((c) => c.id === session.context_id);
      if (!cw) return NextResponse.json({ error: "Copywriter nao encontrado" }, { status: 404 });
      systemPrompt = `${cw.systemPrompt}\n\nVoce esta ajudando a escrever copy de VSL em portugues brasileiro. Seja pratico, direto, aplique seus principios.${offerCtx}`;
    } else {
      const { data: book } = await supabase.from("books").select("title, author").eq("id", session.context_id).single();
      const { data: chunks } = await supabase.from("book_chunks").select("chunk_index, content").eq("book_id", session.context_id).order("chunk_index");
      const relevant = chunks?.length ? getRelevantChunks(chunks, message, 6).join("\n\n---\n\n") : "Sem conteudo.";
      systemPrompt = `Voce e um copywriter de VSL com profundo conhecimento do livro "${book?.title || ""}".${book?.author ? ` Autor: ${book.author}.` : ""}\nUse frameworks e principios do livro. Responda em portugues.\n\n=== LIVRO ===\n${relevant}\n=== FIM ===${offerCtx}`;
    }

    const { data: history } = await supabase.from("vsl_messages").select("role, content").eq("session_id", params.sessionId).order("created_at", { ascending: true }).limit(10);
    const messages = [...(history || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })), { role: "user" as const, content: message }];

    await supabase.from("vsl_messages").insert({ session_id: params.sessionId, role: "user", content: message });
    if (!session.title) await supabase.from("vsl_sessions").update({ title: message.slice(0, 60) }).eq("id", params.sessionId);

    const stream = await createSSEStream({ messages, systemPrompt });
    const [streamForClient, streamForSave] = stream.tee();
    const reader = streamForSave.getReader(); const decoder = new TextDecoder(); const full: string[] = [];
    (async () => { try { while (true) { const { done, value } = await reader.read(); if (done) break; for (const l of decoder.decode(value).split("\n")) { if (!l.startsWith("data: ")) continue; const d = l.slice(6); if (d === "[DONE]") continue; try { full.push(JSON.parse(d).text); } catch {} } } if (full.length > 0) await supabase.from("vsl_messages").insert({ session_id: params.sessionId, role: "assistant", content: full.join("") }); } catch (e) { console.error("[save vsl msg]", e); } })();

    return new Response(streamForClient, { headers: SSE_HEADERS });
  } catch (err) { console.error("[vsl-studio/chat]", err); return NextResponse.json({ error: "Erro no chat" }, { status: 500 }); }
}
