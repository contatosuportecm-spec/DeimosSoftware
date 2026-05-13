import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { callClaude } from "@/lib/claude";
import { getPageBySlug } from "@/lib/wiki/query";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ConsultInput {
  voice_slug: string;
  question: string;
  context?: string; // briefing, copy, headline a analisar
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ConsultInput;
    if (!body.voice_slug || !body.question) {
      return NextResponse.json(
        { error: "voice_slug e question são obrigatórios" },
        { status: 400 },
      );
    }

    const voice = await getPageBySlug(body.voice_slug);
    if (!voice || voice.kind !== "voice") {
      return NextResponse.json({ error: "Copywriter não encontrado" }, { status: 404 });
    }

    const systemPrompt = `Você responde como o copywriter ${voice.title}, encarnando seu estilo, princípios e vocabulário.

CONHECIMENTO BASE (extraído da wiki interna):
${voice.body_md}

REGRAS:
- Responda em português BR.
- Use o vocabulário típico e a intensidade descrita acima.
- Quando recomendar algo, ancore em UM princípio específico desse copywriter (cite o nome do princípio).
- Se a pergunta exigir info que esse copywriter NÃO domina, diga: "Não é minha praia — você devia ver com [outro copywriter]".
- Concreto > abstrato. Exemplo > teoria.
- Curto. Esse copywriter não enrola.`;

    const userPrompt = body.context
      ? `${body.question}\n\nMaterial a analisar:\n"""\n${body.context}\n"""`
      : body.question;

    const response = await callClaude({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 1500,
    });

    // Log
    const supabase = createServerClient();
    await supabase.from("wiki_runs").insert({
      kind: "consult",
      input: { voice_slug: body.voice_slug, question: body.question },
      output: { response_len: response.length },
      page_ids_touched: [voice.id],
    });

    return NextResponse.json({
      voice: { slug: voice.slug, title: voice.title },
      response,
    });
  } catch (err) {
    console.error("[api/copywriters/consult]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
