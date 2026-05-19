import { COPYWRITERS } from "@/lib/copywriters";
import { AutoresearchIteration } from "@/types/autoresearch";

interface BriefingContext {
  offer_name: string;
  niche?: string;
  audience?: string;
  pains?: string;
  desires?: string;
  mechanism_name?: string;
  promise?: string;
}

interface GenerateVariantInput {
  elementType: string;
  currentValue: string;
  briefing: BriefingContext;
  copywriterId: string;
  history: Pick<AutoresearchIteration, "variant_value" | "play_rate" | "decision">[];
  wikiContext?: string;
}

export function buildVariantPrompt(input: GenerateVariantInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const copywriter = COPYWRITERS.find((c) => c.id === input.copywriterId);
  const copywriterVoice = copywriter?.systemPrompt ?? "";

  const historyBlock = input.history.length > 0
    ? input.history
        .map(
          (h, i) =>
            `#${i + 1}: "${h.variant_value}" → play_rate: ${h.play_rate ?? "N/A"}% → ${h.decision ?? "pending"}`
        )
        .join("\n")
    : "No previous iterations.";

  const systemPrompt = `You are an elite direct response copywriter optimizing ${input.elementType}s for maximum play rate on video sales letters.

${copywriterVoice}

RULES:
- Output ONLY the new ${input.elementType} text. No explanations, no quotes, no prefixes.
- After the ${input.elementType}, output "---" on a new line, then a 1-2 sentence hypothesis explaining your reasoning.
- Never repeat a previously tested ${input.elementType}.
- The ${input.elementType} must be in Portuguese (BR).
- Keep it concise, punchy, and curiosity-driven.
- Study the history: what worked (keep) vs what failed (revert). Iterate intelligently.`;

  const userPrompt = `OFFER: ${input.briefing.offer_name}
NICHE: ${input.briefing.niche ?? "general"}
AUDIENCE: ${input.briefing.audience ?? "not specified"}
PAINS: ${input.briefing.pains ?? "not specified"}
DESIRES: ${input.briefing.desires ?? "not specified"}
MECHANISM: ${input.briefing.mechanism_name ?? "not specified"}
PROMISE: ${input.briefing.promise ?? "not specified"}

CURRENT ${input.elementType.toUpperCase()}: "${input.currentValue}"

ITERATION HISTORY:
${historyBlock}

${input.wikiContext ? `KNOWLEDGE BASE INSIGHTS:\n${input.wikiContext}\n` : ""}
Generate the next ${input.elementType} variant. Remember: output ONLY the ${input.elementType} text, then "---", then your hypothesis.`;

  return { systemPrompt, userPrompt };
}

export function parseVariantResponse(response: string): {
  variant: string;
  hypothesis: string;
} {
  const parts = response.split("---");
  const variant = parts[0].trim().replace(/^["']|["']$/g, "");
  const hypothesis = parts.slice(1).join("---").trim() || "No hypothesis provided.";
  return { variant, hypothesis };
}
