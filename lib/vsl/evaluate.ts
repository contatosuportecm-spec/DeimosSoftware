import { callClaude } from "@/lib/claude";
import { createServerClient } from "@/lib/supabase";
import {
  OfferBriefing, VslDraft, VslDraftVerdict, VslImprovement, VslScores, VslSections,
} from "@/types";
import { extractJson } from "@/lib/wiki/util";
import {
  briefingToPromptInput,
  bundleToPromptContext,
  buildVslContext,
} from "./context";

const EVALUATE_SYSTEM = `Você é um avaliador sênior de VSL de direct response. Sua tarefa é AUDITAR uma copy existente.

REGRAS DURAS DE AVALIAÇÃO:

1. **Identifique seções**: divida a copy em hook, lead, mechanism, offer, guarantee, cta. Se faltar alguma, marque ausente.

2. **Aplique scores 0-100** em 5 dimensões:
   - clareza: leitor entende em 1 leitura?
   - gancho: a abertura prende quem está scrollando?
   - prova: há proof points, especificidade, credibilidade?
   - urgencia: motivo pra agir AGORA, não depois?
   - compliance: respeita as regras das páginas "claims" fornecidas?

3. **DECISION GATE — CRÍTICO**:
   Você só pode sugerir melhoria se DUAS condições forem verdadeiras:
   a) Score absoluto < 75 numa dimensão; OU score overall < 75
   b) Você consegue articular um REWRITE específico com **delta esperado ≥ 15 pontos** naquela dimensão

   Se a copy está acima de 80 overall e nenhuma dimensão abaixo de 75, sua veredicto é "approved" e improvements = [].

   NÃO INVENTE PROBLEMA SÓ PRA TER O QUE FALAR. Se está bom, está bom.

4. **Veredicto**:
   - "approved" → overall ≥ 80 e nenhuma dim < 75
   - "needs_polish" → overall 60-79, ou 1-2 dimensões abaixo
   - "needs_rewrite" → overall < 60, ou 3+ dimensões abaixo

5. **Improvements** (lista — pode ser vazia):
   Cada item:
   - section: qual seção mexer
   - current_excerpt: trecho atual (≤ 200 chars)
   - suggestion: trecho proposto
   - reason: razão CURTA (1 frase) ancorada em algum framework/voice fornecido
   - expected_delta: 0-100, quanto deve subir aquela dimensão

FORMATO DE SAÍDA — JSON apenas:

\`\`\`json
{
  "sections": { "hook": "...", "lead": "...", "mechanism": "...", "offer": "...", "guarantee": "...", "cta": "..." },
  "scores": {
    "clareza": 78,
    "gancho": 65,
    "prova": 60,
    "urgencia": 70,
    "compliance": 85,
    "overall": 71
  },
  "verdict": "approved | needs_polish | needs_rewrite",
  "improvements": [
    {
      "section": "gancho",
      "current_excerpt": "...",
      "suggestion": "...",
      "reason": "Padrão de descoberta acidental (Halbert) puxa mais quem está em consciência nível 4",
      "expected_delta": 22
    }
  ],
  "rationale": "1-2 parágrafos sobre o estado geral da copy e por que esse veredicto"
}
\`\`\``;

export interface EvaluateInput {
  briefingId?: string;
  briefing: OfferBriefing | null;
  source_copy: string;
  style_blend?: Record<string, number>;
}

export async function evaluateVsl(input: EvaluateInput): Promise<VslDraft> {
  const supabase = createServerClient();
  const blend = input.style_blend ?? {};
  const bundle = await buildVslContext(input.briefing, blend);
  const context = bundleToPromptContext(bundle, blend);
  const briefingText = input.briefing ? briefingToPromptInput(input.briefing) : "(sem briefing fornecido)";

  const raw = await callClaude({
    systemPrompt: EVALUATE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${context}\n\n═══════════════\n\nBRIEFING:\n${briefingText}\n\n═══════════════\n\nCOPY A AUDITAR:\n"""\n${input.source_copy}\n"""\n\nAudite seguindo as regras do system prompt.`,
      },
    ],
    maxTokens: 4000,
  });

  type ParsedShape = {
    sections?: VslSections;
    scores?: VslScores;
    verdict?: VslDraftVerdict;
    improvements?: VslImprovement[];
    rationale?: string;
  };
  const parsed = extractJson<ParsedShape>(raw);
  if (!parsed?.scores) throw new Error("LLM não retornou JSON com scores");

  // Reforço da decision gate (server-side): se overall>=80 e nenhuma dim<75, força approved
  const scores = parsed.scores;
  const verdict = enforceDecisionGate(scores, parsed.verdict);
  const improvements = verdict === "approved" ? [] : (parsed.improvements ?? [])
    // filtra improvements com delta baixo demais
    .filter((i) => i.expected_delta >= 15);

  const { data, error } = await supabase
    .from("vsl_drafts")
    .insert({
      briefing_id: input.briefingId ?? null,
      mode: "evaluate",
      style_blend: blend,
      source_copy: input.source_copy,
      sections: parsed.sections ?? {},
      scores,
      verdict,
      improvements,
      used_pages: bundle.all_used_ids,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  return data as unknown as VslDraft;
}

function enforceDecisionGate(
  scores: VslScores,
  llmVerdict: VslDraftVerdict | undefined,
): VslDraftVerdict {
  const { clareza, gancho, prova, urgencia, compliance, overall } = scores;
  const dims = [clareza, gancho, prova, urgencia, compliance];
  const minDim = Math.min(...dims);
  const belowCount = dims.filter((d) => d < 75).length;

  if (overall >= 80 && minDim >= 75) return "approved";
  if (overall < 60 || belowCount >= 3) return "needs_rewrite";
  if (overall < 80 || belowCount >= 1) return "needs_polish";

  return llmVerdict ?? "needs_polish";
}
