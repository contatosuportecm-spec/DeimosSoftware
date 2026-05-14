import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createSSEStream, SSE_HEADERS } from "@/lib/stream";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function buildConversationPrompt(persona: Record<string, unknown>): string {
  return `Voce esta interpretando ${persona.name}, uma pessoa REAL. JAMAIS quebre o personagem. JAMAIS diga que e uma IA.

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
}

function buildTestPrompt(persona: Record<string, unknown>): string {
  return `Voce e ${persona.name}, uma pessoa REAL com o perfil descrito abaixo. Alguem vai te mostrar uma copy, oferta, headline ou material de marketing.

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
    const { message, mode = "chat" } = (await req.json()) as { message: string; mode?: "test" | "chat" };
    if (!message?.trim()) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    const supabase = createServerClient();

    const { data: persona } = await supabase.from("client_personas").select("*").eq("id", params.personaId).single();
    if (!persona) return NextResponse.json({ error: "Persona nao encontrada" }, { status: 404 });

    const systemPrompt = mode === "test" ? buildTestPrompt(persona) : buildConversationPrompt(persona);

    const { data: history } = await supabase.from("client_messages").select("role, content").eq("session_id", params.sessionId).order("created_at", { ascending: true }).limit(10);
    const messages = [...(history || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })), { role: "user" as const, content: message }];

    await supabase.from("client_messages").insert({ session_id: params.sessionId, role: "user", content: message });
    const { data: session } = await supabase.from("client_sessions").select("title").eq("id", params.sessionId).single();
    if (!session?.title) await supabase.from("client_sessions").update({ title: message.slice(0, 60) }).eq("id", params.sessionId);

    const stream = await createSSEStream({ messages, systemPrompt });
    const [streamForClient, streamForSave] = stream.tee();
    const reader = streamForSave.getReader(); const decoder = new TextDecoder(); const full: string[] = [];
    (async () => { try { while (true) { const { done, value } = await reader.read(); if (done) break; for (const l of decoder.decode(value).split("\n")) { if (!l.startsWith("data: ")) continue; const d = l.slice(6); if (d === "[DONE]") continue; try { full.push(JSON.parse(d).text); } catch {} } } if (full.length > 0) await supabase.from("client_messages").insert({ session_id: params.sessionId, role: "assistant", content: full.join("") }); } catch (e) { console.error("[save client msg]", e); } })();

    return new Response(streamForClient, { headers: SSE_HEADERS });
  } catch (err) { console.error("[clientes/chat]", err); return NextResponse.json({ error: "Erro no chat" }, { status: 500 }); }
}
