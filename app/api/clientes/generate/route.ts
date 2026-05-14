import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { callClaude } from "@/lib/claude";
import { extractPdfText } from "@/lib/pdf";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SYSTEM_PROMPT = `Voce e um especialista em psicologia do consumidor e marketing de resposta direta.
Analise o estudo de publico abaixo e extraia uma persona de comprador estruturada.
Retorne um JSON valido com EXATAMENTE estes campos:
{"name":"nome ficticio","age_range":"ex: 38-52","gender":"feminino|masculino|misto","niche":"nicho","pains":["dor1","dor2","dor3","dor4","dor5"],"desires":["desejo1","desejo2","desejo3","desejo4"],"objections":["objecao1","objecao2","objecao3"],"vocabulary":["palavra/frase que usam"],"behavior":"paragrafo sobre comportamento","emotional_state":"perfil emocional","awareness_level":"1-5 Schwartz"}
Retorne APENAS o JSON, sem markdown.`;

async function generatePersona(studyText: string) {
  const response = await callClaude({ messages: [{ role: "user", content: studyText }], systemPrompt: SYSTEM_PROMPT });
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("IA nao retornou JSON valido");

  const p = JSON.parse(jsonMatch[0]);
  const supabase = createServerClient();
  const { data, error } = await supabase.from("client_personas").insert({
    name: p.name, age_range: p.age_range, gender: p.gender, niche: p.niche,
    pains: p.pains || [], desires: p.desires || [], objections: p.objections || [], vocabulary: p.vocabulary || [],
    behavior: p.behavior, emotional_state: p.emotional_state, awareness_level: String(p.awareness_level),
    study_text: studyText, status: "ready",
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let studyText: string;

    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData();
      const file = fd.get("file") as File | null;
      const pastedText = (fd.get("studyText") as string) || "";

      if (file && file.size > 0) {
        const name = file.name.toLowerCase();
        let extracted: string;

        if (name.endsWith(".pdf")) {
          const buf = Buffer.from(await file.arrayBuffer());
          extracted = await extractPdfText(buf);
        } else if (name.endsWith(".md") || name.endsWith(".txt")) {
          extracted = await file.text();
        } else {
          return NextResponse.json({ error: "Formato nao suportado. Envie PDF, MD ou TXT." }, { status: 400 });
        }

        if (!extracted || extracted.trim().length < 30) {
          return NextResponse.json({ error: "Nao foi possivel extrair texto do arquivo" }, { status: 400 });
        }
        studyText = extracted;
      } else if (pastedText.trim().length >= 50) {
        studyText = pastedText;
      } else {
        return NextResponse.json({ error: "Envie um arquivo ou cole texto (min 50 chars)" }, { status: 400 });
      }
    } else {
      const { studyText: text } = (await req.json()) as { studyText: string };
      if (!text || text.trim().length < 50)
        return NextResponse.json({ error: "Texto muito curto (min 50 chars)" }, { status: 400 });
      studyText = text;
    }

    const data = await generatePersona(studyText);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[clientes/generate]", err);
    const msg = err instanceof Error ? err.message : "Erro ao gerar persona";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
