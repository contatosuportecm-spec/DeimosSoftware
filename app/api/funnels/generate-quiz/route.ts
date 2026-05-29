import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SYSTEM_PROMPT = `Você é um especialista em criação de quizzes de direct response (estilo Noom / Typeform) para funis de venda.
Recebe um texto livre — tópicos, rascunhos ou ideias de perguntas — e devolve perguntas de quiz prontas, em português, na voz do público.

Para cada pergunta escolha o tipo mais adequado:
- "button": múltipla escolha. Forneça de 2 a 6 opções curtas, claras e mutuamente exclusivas.
- "scale": concordância/intensidade de 1 a 5. Sem opções. Formule como afirmação a concordar (ex: "Quão você concorda: 'frase literal do público'").
- "open": resposta aberta. Sem opções.

Regras:
- Mantenha a ordem e a lógica do texto recebido.
- Perguntas curtas, diretas, na linguagem do público.
- Não invente seções que não estejam no texto.
- Quebre tópicos compostos em perguntas separadas quando fizer sentido.

Retorne APENAS um JSON válido, sem markdown, exatamente neste formato:
{"questions":[{"question":"texto da pergunta","question_type":"button|scale|open","options":["opção 1","opção 2"]}]}
O campo "options" deve ser [] quando o tipo não for "button".`;

interface GeneratedQuestion {
  question: string;
  question_type: "open" | "button" | "scale";
  options: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: "Texto muito curto (mín. 20 caracteres)" }, { status: 400 });
    }

    const response = await callClaude({
      messages: [{ role: "user", content: text }],
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 8000,
      temperature: 0.7,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("IA não retornou JSON válido");

    const parsed = JSON.parse(jsonMatch[0]) as {
      questions?: Array<{ question?: string; question_type?: string; options?: unknown }>;
    };

    const questions: GeneratedQuestion[] = (parsed.questions ?? [])
      .filter((q) => q && typeof q.question === "string" && q.question.trim().length > 0)
      .map((q) => {
        const type = ["button", "scale", "open"].includes(q.question_type ?? "")
          ? (q.question_type as GeneratedQuestion["question_type"])
          : "open";
        const options =
          type === "button" && Array.isArray(q.options)
            ? q.options.filter((o): o is string => typeof o === "string" && o.trim().length > 0).map((o) => o.trim())
            : [];
        return { question: (q.question as string).trim(), question_type: type, options };
      });

    if (questions.length === 0) throw new Error("Nenhuma pergunta gerada a partir do texto");

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[funnels/generate-quiz]", err);
    const msg = err instanceof Error ? err.message : "Erro ao gerar perguntas";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
