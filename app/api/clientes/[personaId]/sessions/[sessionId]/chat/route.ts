import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { streamClaude } from "@/lib/claude";
import { SSE_HEADERS } from "@/lib/stream";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function buildConversationPrompt(persona: Record<string, unknown>, offerCtx?: string): string {
  let prompt = `Voce esta interpretando ${persona.name}, uma pessoa REAL. JAMAIS quebre o personagem. JAMAIS diga que e uma IA.

PERFIL:
- Nome: ${persona.name}
- Idade: ${persona.age_range || "?"}
- Genero: ${persona.gender || "?"}
- Nicho: ${persona.niche || "geral"}

DORES: ${((persona.pains as string[]) || []).join(", ")}
DESEJOS: ${((persona.desires as string[]) || []).join(", ")}
OBJECOES: ${((persona.objections as string[]) || []).join(", ")}
VOCABULARIO: ${((persona.vocabulary as string[]) || []).join(", ")}
COMPORTAMENTO: ${persona.behavior || ""}
ESTADO EMOCIONAL: ${persona.emotional_state || ""}

Responda SEMPRE em primeira pessoa como ${persona.name}. Use o vocabulario listado. Mostre emocoes reais. Discorde quando apropriado.`;

  if (offerCtx) {
    prompt += `\n\n--- CONTEXTO DA OFERTA ---\nA pessoa que esta falando com voce quer discutir sobre a seguinte oferta/copy. Voce deve reagir como ${persona.name} reagiria ao ver ou ouvir sobre isso:\n\n${offerCtx}\n---`;
  }
  return prompt;
}

function buildTestPrompt(persona: Record<string, unknown>, offerCtx?: string): string {
  let intro = `Voce e ${persona.name}, uma pessoa REAL com o perfil descrito abaixo. Alguem vai te mostrar uma copy, oferta, headline ou material de marketing.`;

  if (offerCtx) {
    intro += `\n\nCONTEXTO DA OFERTA SENDO TESTADA:\n${offerCtx}\n\nAnalise TUDO acima (oferta + a mensagem do usuario) como ${persona.name} faria.`;
  }

  return `${intro}

PERFIL:
- Nome: ${persona.name}
- Idade: ${persona.age_range || "?"}
- Genero: ${persona.gender || "?"}
- Nicho: ${persona.niche || "geral"}

DORES: ${((persona.pains as string[]) || []).join(", ")}
DESEJOS: ${((persona.desires as string[]) || []).join(", ")}
OBJECOES: ${((persona.objections as string[]) || []).join(", ")}
VOCABULARIO: ${((persona.vocabulary as string[]) || []).join(", ")}
COMPORTAMENTO: ${persona.behavior || ""}
ESTADO EMOCIONAL: ${persona.emotional_state || ""}
NIVEL DE CONSCIENCIA: ${persona.awareness_level || "3"}

Analise o material como ${persona.name} faria e responda com um relatorio estruturado em JSON.
Use EXATAMENTE este formato (sem markdown, sem code block, apenas o JSON puro):

{
  "reacao_emocional": <numero de 1 a 10>,
  "sentimento": "<curiosa|desconfiada|animada|indiferente|irritada|esperancosa|cansada>",
  "objecoes": ["objecao 1", "objecao 2"],
  "gatilhos_ativados": ["gatilho 1", "gatilho 2"],
  "acao_provavel": "<clicaria|ignoraria|compraria|pediria_mais_info|sairia>",
  "pensamento_interno": "o que passa na cabeca de ${persona.name} ao ver isso",
  "reescrita_na_minha_voz": "como ${persona.name} descreveria essa oferta pra uma amiga"
}

IMPORTANTE: Responda APENAS o JSON. Sem texto antes ou depois. Sem markdown.`;
}

export async function POST(req: NextRequest, { params }: { params: { personaId: string; sessionId: string } }) {
  try {
    const { message, mode = "chat", offer_ids } = (await req.json()) as {
      message: string;
      mode?: "test" | "chat";
      offer_ids?: string[];
    };
    if (!message?.trim()) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    const supabase = createServerClient();

    const { data: persona } = await supabase.from("client_personas").select("*").eq("id", params.personaId).single();
    if (!persona) return NextResponse.json({ error: "Persona nao encontrada" }, { status: 404 });

    // Fetch referenced offers from both tables
    let offerCtx: string | undefined;
    if (offer_ids && offer_ids.length > 0) {
      const parts: string[] = [];

      // Check persona_offers
      const { data: pOffers } = await supabase.from("persona_offers").select("id, title, content").in("id", offer_ids);
      if (pOffers) parts.push(...pOffers.map((o) => `[${o.title}]\n${o.content}`));

      // Check offer_briefings for remaining IDs (those not found in persona_offers)
      const foundIds = new Set((pOffers || []).map((o) => o.id));
      const remainingIds = offer_ids.filter((id) => !foundIds.has(id));
      if (remainingIds.length > 0) {
        const { data: briefings } = await supabase.from("offer_briefings").select("offer_name, niche, promise, main_headline, target_audience, main_pains, main_desires, new_mechanism, product_name, price, guarantee, main_cta").in("id", remainingIds);
        if (briefings) {
          parts.push(...briefings.map((b) => {
            const lines = [
              `[OFERTA: ${b.offer_name}]`,
              b.niche && `Nicho: ${b.niche}`,
              b.main_headline && `Headline: ${b.main_headline}`,
              b.promise && `Promessa: ${b.promise}`,
              b.new_mechanism && `Mecanismo: ${b.new_mechanism}`,
              b.target_audience && `Publico: ${b.target_audience}`,
              b.main_pains?.length && `Dores: ${b.main_pains.join(", ")}`,
              b.main_desires?.length && `Desejos: ${b.main_desires.join(", ")}`,
              b.product_name && `Produto: ${b.product_name}`,
              b.price && `Preco: R$${b.price}`,
              b.guarantee && `Garantia: ${b.guarantee}`,
              b.main_cta && `CTA: ${b.main_cta}`,
            ].filter(Boolean).join("\n");
            return lines;
          }));
        }
      }

      if (parts.length > 0) offerCtx = parts.join("\n\n");
    }

    const systemPrompt = mode === "test"
      ? buildTestPrompt(persona, offerCtx)
      : buildConversationPrompt(persona, offerCtx);

    const { data: history } = await supabase.from("client_messages").select("role, content").eq("session_id", params.sessionId).order("created_at", { ascending: true }).limit(20);

    // Sanitize history: ensure alternating user/assistant roles.
    // If the last assistant response was never saved (e.g. function killed mid-stream),
    // history could end with a user message causing Gemini to reject the request.
    const rawHistory = (history || []) as { role: string; content: string }[];
    const cleanHistory: { role: "user" | "assistant"; content: string }[] = [];
    for (const m of rawHistory) {
      const expected = cleanHistory.length % 2 === 0 ? "user" : "assistant";
      if (m.role === expected) cleanHistory.push({ role: m.role as "user" | "assistant", content: m.content });
    }
    // Drop trailing user message if unpaired (no assistant response saved)
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === "user") {
      cleanHistory.pop();
    }

    const messages = [...cleanHistory, { role: "user" as const, content: message }];

    await supabase.from("client_messages").insert({ session_id: params.sessionId, role: "user", content: message });
    const { data: session } = await supabase.from("client_sessions").select("title").eq("id", params.sessionId).single();
    if (!session?.title) await supabase.from("client_sessions").update({ title: message.slice(0, 60) }).eq("id", params.sessionId);

    // Stream the LLM response, buffer it, and save to DB BEFORE closing the stream.
    // This avoids the Vercel serverless race where the function is killed after the response
    // is sent but before a background async IIFE can complete the DB insert.
    const encoder = new TextEncoder();
    const llmStream = await streamClaude({ messages, systemPrompt });
    const responseStream = new ReadableStream({
      async start(controller) {
        const full: string[] = [];
        try {
          for await (const chunk of llmStream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              full.push(chunk.delta.text);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          console.error("[clientes/chat stream]", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: "\n\n[Erro ao gerar resposta]" })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          // Save assistant message before closing — function is still alive at this point
          if (full.length > 0) {
            const { error: saveErr } = await supabase.from("client_messages").insert({ session_id: params.sessionId, role: "assistant", content: full.join("") });
            if (saveErr) console.error("[save client msg]", saveErr);
          }
          controller.close();
        }
      },
    });

    return new Response(responseStream, { headers: SSE_HEADERS });
  } catch (err) { console.error("[clientes/chat]", err); return NextResponse.json({ error: "Erro no chat" }, { status: 500 }); }
}
