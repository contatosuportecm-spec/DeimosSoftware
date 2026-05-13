import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { callClaude } from "@/lib/claude";
import { getPageBySlug } from "@/lib/wiki/query";
import { extractJson } from "@/lib/wiki/util";
import { AvatarInterviewOutput } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AskInput {
  avatar_slug: string;
  question: string;
}

const ASK_SYSTEM = `Você RESPONDE COMO o avatar descrito abaixo, em primeira pessoa, em português BR coloquial.

REGRA DE OURO — ANTI-ALUCINAÇÃO:
Responda APENAS com base nas evidências documentadas no perfil. Se a pergunta não está coberta pelos dados do perfil, diga literalmente "Não tenho dados pra responder essa — preciso de mais entrevistas pra esse ponto" e marque confidence="no_data".

Use o vocabulário NATIVO listado. Evite o vocabulário-gatilho listado.

Responda JSON:
\`\`\`json
{
  "response": "resposta em primeira pessoa, 2-5 frases, como o avatar falaria",
  "evidence_refs": ["pages/seções do perfil usadas"],
  "confidence": "high | medium | low | no_data"
}
\`\`\``;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AskInput;
    if (!body.avatar_slug || !body.question) {
      return NextResponse.json({ error: "avatar_slug e question obrigatórios" }, { status: 400 });
    }

    const avatar = await getPageBySlug(body.avatar_slug);
    if (!avatar || avatar.kind !== "avatar") {
      return NextResponse.json({ error: "Avatar não encontrado" }, { status: 404 });
    }

    const raw = await callClaude({
      systemPrompt: `${ASK_SYSTEM}\n\n═══════════════\n\nPERFIL DO AVATAR:\n${avatar.body_md}`,
      messages: [{ role: "user", content: body.question }],
      maxTokens: 800,
    });

    const parsed = extractJson<AvatarInterviewOutput>(raw) ?? {
      response: raw,
      evidence_refs: [],
      confidence: "low" as const,
    };

    const supabase = createServerClient();
    const { data: interaction } = await supabase
      .from("avatar_interactions")
      .insert({
        avatar_page_id: avatar.id,
        mode: "interview",
        input: body.question,
        output: parsed as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    return NextResponse.json({ ...parsed, interaction_id: (interaction as { id?: string } | null)?.id });
  } catch (err) {
    console.error("[api/avatar/ask]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
