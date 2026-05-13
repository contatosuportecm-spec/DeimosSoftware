import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { callClaude } from "@/lib/claude";
import { getPageBySlug } from "@/lib/wiki/query";
import { extractJson } from "@/lib/wiki/util";
import { AvatarTestCopyOutput } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface TestCopyInput {
  avatar_slug: string;
  copy: string;
}

const TEST_SYSTEM = `Você SIMULA a reação do avatar descrito a uma copy/headline/anúncio.

REGRAS:
1. Sua simulação é baseada EXCLUSIVAMENTE nos dados documentados do perfil.
2. Não invente reação que não está sustentada por evidência do perfil.
3. Seja honesto: se a copy bater nas dores certas, marque interest alto; se não, baixo.
4. trigger_words_hit: liste palavras DA COPY que estão no "Vocabulário-gatilho (EVITAR)" do perfil.
5. objections_raised: liste objeções DO PERFIL que a copy NÃO antecipa.

Responda JSON:
\`\`\`json
{
  "interest": 0-10,
  "objections_raised": ["..."],
  "trigger_words_hit": ["..."],
  "next_likely_action": "click | scroll | leave | share | objection",
  "rewrite_in_avatar_voice": "(opcional) versão da copy reescrita usando o vocabulário nativo do avatar",
  "reasoning": "1-2 frases explicando o veredicto"
}
\`\`\``;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TestCopyInput;
    if (!body.avatar_slug || !body.copy) {
      return NextResponse.json({ error: "avatar_slug e copy obrigatórios" }, { status: 400 });
    }

    const avatar = await getPageBySlug(body.avatar_slug);
    if (!avatar || avatar.kind !== "avatar") {
      return NextResponse.json({ error: "Avatar não encontrado" }, { status: 404 });
    }

    const raw = await callClaude({
      systemPrompt: `${TEST_SYSTEM}\n\n═══════════════\n\nPERFIL DO AVATAR:\n${avatar.body_md}`,
      messages: [
        {
          role: "user",
          content: `Reaja a essa copy:\n"""\n${body.copy}\n"""`,
        },
      ],
      maxTokens: 1500,
    });

    const parsed = extractJson<AvatarTestCopyOutput>(raw) ?? {
      interest: 5,
      objections_raised: [],
      trigger_words_hit: [],
      next_likely_action: "scroll" as const,
      reasoning: "Falha em parsear resposta da LLM",
    };

    const supabase = createServerClient();
    const { data: interaction } = await supabase
      .from("avatar_interactions")
      .insert({
        avatar_page_id: avatar.id,
        mode: "test_copy",
        input: body.copy,
        output: parsed as unknown as Record<string, unknown>,
        reaction_score: parsed.interest,
      })
      .select()
      .single();

    return NextResponse.json({ ...parsed, interaction_id: (interaction as { id?: string } | null)?.id });
  } catch (err) {
    console.error("[api/avatar/test-copy]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
