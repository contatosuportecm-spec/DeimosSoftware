import { callClaude } from "@/lib/claude";
import { createServerClient } from "@/lib/supabase";
import { OfferBriefing, VslDraft, VslSections } from "@/types";
import { extractJson } from "@/lib/wiki/util";
import {
  briefingToPromptInput,
  bundleToPromptContext,
  buildVslContext,
} from "./context";

const GENERATE_SYSTEM = `Você é o melhor copywriter de direct response brasileiro. Sua tarefa é gerar uma VSL completa em português BR, encarnando o blend de estilos de copywriters fornecido.

REGRAS DURAS:
1. A VSL TEM 6 SEÇÕES MARCADAS: hook, lead, mechanism, offer, guarantee, cta.
2. Você DEVE usar os frameworks/mecanismos/patterns fornecidos. Não invente coisa nova quando há ferramenta provada.
3. RESPEITE 100% as regras de compliance da seção "COMPLIANCE — LEIA ANTES DE ESCREVER".
4. Pré-diagnostique o NÍVEL DE CONSCIÊNCIA (Schwartz) do avatar e ajuste o tom.
5. Specificity sempre: números, datas, fontes. Vague mata.
6. Cada frase puxa a próxima (slippery slide).
7. Português coloquial brasileiro. Sem rebuscar.
8. Não invente claims, estudos ou números que não estão no briefing ou nas páginas.

FORMATO DE SAÍDA — JSON apenas:

\`\`\`json
{
  "consciousness_level_detected": 1-5,
  "framework_used": "halbert-lead-structure | sugarman-slippery-slide | etc",
  "sections": {
    "hook": "...",
    "lead": "...",
    "mechanism": "...",
    "offer": "...",
    "guarantee": "...",
    "cta": "..."
  },
  "rationale": "1-2 parágrafos curtos explicando suas escolhas estratégicas"
}
\`\`\``;

export interface GenerateInput {
  briefingId?: string;
  briefing: OfferBriefing;
  style_blend: Record<string, number>;
}

export async function generateVsl(input: GenerateInput): Promise<VslDraft> {
  const supabase = createServerClient();
  const bundle = await buildVslContext(input.briefing, input.style_blend);
  const context = bundleToPromptContext(bundle, input.style_blend);
  const briefingText = briefingToPromptInput(input.briefing);

  const raw = await callClaude({
    systemPrompt: GENERATE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${context}\n\n═══════════════\n\n${briefingText}\n\nGere a VSL.`,
      },
    ],
    maxTokens: 6000,
  });

  type ParsedShape = {
    consciousness_level_detected?: number;
    framework_used?: string;
    sections?: VslSections;
    rationale?: string;
  };
  const parsed = extractJson<ParsedShape>(raw);
  if (!parsed?.sections) {
    throw new Error("LLM não retornou JSON com sections");
  }

  const sections = parsed.sections;
  const generated_copy = [
    sections.hook,
    sections.lead,
    sections.mechanism,
    sections.offer,
    sections.guarantee,
    sections.cta,
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const { data, error } = await supabase
    .from("vsl_drafts")
    .insert({
      briefing_id: input.briefingId ?? null,
      mode: "generate",
      style_blend: input.style_blend,
      generated_copy,
      sections,
      scores: {},
      verdict: null,
      improvements: [],
      used_pages: bundle.all_used_ids,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  return data as unknown as VslDraft;
}
