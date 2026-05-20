import { COPYWRITERS } from "@/lib/copywriters";
import type { AutoresearchRound } from "@/types/autoresearch";

interface BriefingContext {
  offer_name: string;
  niche?: string;
  audience?: string;
  pains?: string;
  desires?: string;
  mechanism_name?: string;
  promise?: string;
}

interface MultiVariantInput {
  elementType: string;
  currentValue: string;
  challengerCount: number;
  briefing: BriefingContext;
  copywriterId: string;
  history: Pick<AutoresearchRound, "variants" | "slot_results" | "winner_slot" | "decision">[];
  wikiContext?: string;
}

export function buildMultiVariantPrompt(input: MultiVariantInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const copywriter = COPYWRITERS.find((c) => c.id === input.copywriterId);
  const copywriterVoice = copywriter?.systemPrompt ?? "";
  const copywriterName = copywriter?.name ?? "um copywriter elite";

  // Strategy split: at least 1 ESCALA always
  const scaleCount = Math.max(1, Math.floor(input.challengerCount * 0.25));
  const predictCount = input.challengerCount - scaleCount;

  // Build history block
  const historyBlock =
    input.history.length > 0
      ? input.history
          .map((h, i) => {
            const variants = h.variants ?? [];
            const results = h.slot_results ?? [];
            const lines = variants.map((v) => {
              const r = results.find((rr) => rr.slot_index === v.slot_index);
              const isWinner = v.slot_index === h.winner_slot;
              const tag = v.strategy === "scale" ? " [ESCALA]" : v.strategy === "predictability" ? " [PREV]" : "";
              return `  ${v.role}${tag}: "${v.headline}" → ${r?.play_rate?.toFixed(2) ?? "N/A"}%${isWinner ? " ★ VENCEDOR" : ""}`;
            });
            return `Round #${i + 1} (${h.decision === "promoted" ? "challenger venceu" : h.decision === "kept" ? "controle mantido" : "pendente"}):\n${lines.join("\n")}`;
          })
          .join("\n\n")
      : "";

  // Detect winning pattern from history
  let winningPattern = "";
  if (input.history.length > 0) {
    const winners = input.history
      .filter((h) => h.decision === "promoted" && h.winner_slot != null)
      .map((h) => {
        const v = (h.variants ?? []).find((vv) => vv.slot_index === h.winner_slot);
        return v?.headline;
      })
      .filter(Boolean);
    if (winners.length > 0) {
      winningPattern = `\nPADROES VENCEDORES (headlines que ganharam rodadas anteriores):\n${winners.map((w) => `- "${w}"`).join("\n")}\nUse esses padroes como base para variantes de PREVISIBILIDADE.\nPara variantes de ESCALA, ignore COMPLETAMENTE esses padroes — tente algo que ninguem testou.`;
    }
  }

  const nicheContext = input.briefing.niche ? ` no nicho de ${input.briefing.niche}` : "";

  const elementRules: Record<string, string> = {
    headline: `REGRAS DE HEADLINE:
- Uma headline tem entre 3 e 15 palavras. NUNCA mais que 15 palavras.
- E uma frase curta, direta, que gera curiosidade e faz a pessoa clicar no play.
- NAO e um paragrafo, NAO e uma fala, NAO e uma explicacao. E uma FRASE de impacto.
- Exemplos bons: "Emagreca 7kg em 21 dias", "O truque dos 3 segundos que derrete gordura", "Medico revela o que ninguem te conta sobre barriga"
- Exemplos RUINS: "Aqui e o Gary Halbert, e eu vou te contar...", "Presta atencao porque o que eu vou te mostrar...", "Eu nao sou de enrolacao..."
- NUNCA comece com "Eu", "Aqui", "Olha", "Presta atencao". Isso NAO e headline, e conversa.`,
    cta: `REGRAS DE CTA:
- Um CTA tem entre 2 e 8 palavras. Curto e imperativo.
- Exemplos: "Quero comecar agora", "Garantir minha vaga", "Assistir aula gratis"`,
    hook: `REGRAS DE HOOK:
- Um hook tem entre 5 e 20 palavras. Gera curiosidade instantanea.
- Deve provocar uma reacao emocional: surpresa, medo de perder, curiosidade.`,
  };

  const rules = elementRules[input.elementType] ?? elementRules.headline;

  const systemPrompt = `Voce e um copywriter especialista em direct response, inspirado no estilo de ${copywriterName}.
Seu conhecimento: ${copywriterVoice}

IMPORTANTE: Voce NAO esta conversando com ninguem. Voce esta ESCREVENDO ${input.elementType}s para uma pagina de vendas.
Cada ${input.elementType} e um texto CURTO e AUTONOMO que aparece na pagina. Nao e uma fala, nao e um dialogo.

${rules}

Voce esta otimizando ${input.elementType}s para a oferta "${input.briefing.offer_name}"${nicheContext}.
Objetivo: maximizar o play rate do VSL (porcentagem de visitantes que clicam play).

ESTRATEGIA OBRIGATORIA:
Dos ${input.challengerCount} challengers, divida assim:

${predictCount > 0 ? `- PREVISIBILIDADE (${predictCount} variante${predictCount > 1 ? "s" : ""}): Itere no angulo/abordagem que esta vencendo. Melhore o que funciona — refine palavras, intensifique a emocao, ajuste o ritmo. Mantenha a essencia do que validou mas torne mais forte.` : ""}
- ESCALA (${scaleCount} variante${scaleCount > 1 ? "s" : ""}): Abordagem COMPLETAMENTE diferente. Novo angulo, nova emocao, novo mecanismo, nova estrutura. O objetivo e descobrir algo melhor que o vies atual nao enxerga.

REGRAS:
- Gere EXATAMENTE ${input.challengerCount} challengers.
- Marque cada variante com [PREVISIBILIDADE] ou [ESCALA] no inicio.
- Todas em Portugues (BR).
- Cada ${input.elementType} deve ser CURTO (veja regras acima). Se passar do limite, esta errado.
- Nunca repita uma variante ja testada.
- Estude o historico: aprenda com vencedores e perdedores.

FORMATO (exatamente ${input.challengerCount} variantes):
1. [PREVISIBILIDADE] texto curto da ${input.elementType}
---
hipotese em 1 frase

2. [ESCALA] texto curto da ${input.elementType}
---
hipotese em 1 frase
...`;

  const userPrompt = `OFERTA: ${input.briefing.offer_name}
NICHO: ${input.briefing.niche ?? "geral"}
PUBLICO: ${input.briefing.audience ?? "nao especificado"}
DORES: ${input.briefing.pains ?? "nao especificado"}
DESEJOS: ${input.briefing.desires ?? "nao especificado"}
MECANISMO: ${input.briefing.mechanism_name ?? "nao especificado"}
PROMESSA: ${input.briefing.promise ?? "nao especificado"}

CONTROLE ATUAL (${input.elementType.toUpperCase()} com melhor resultado ate agora):
"${input.currentValue}"
${winningPattern}
${historyBlock ? `\nHISTORICO COMPLETO:\n${historyBlock}\n` : ""}
${input.wikiContext ? `BASE DE CONHECIMENTO:\n${input.wikiContext}\n` : ""}
Gere ${input.challengerCount} challengers${predictCount > 0 ? ` (${predictCount} PREVISIBILIDADE + ${scaleCount} ESCALA)` : ` (${scaleCount} ESCALA)`} para competir contra o controle atual.`;

  return { systemPrompt, userPrompt };
}

export function parseMultiVariantResponse(
  response: string,
  expectedCount: number
): { variant: string; hypothesis: string; strategy: "predictability" | "scale" }[] {
  console.log("[autoresearch] Raw LLM response:", response.slice(0, 500));
  const results: { variant: string; hypothesis: string; strategy: "predictability" | "scale" }[] = [];

  const detectStrategy = (text: string): "predictability" | "scale" => {
    if (/\[ESCALA\]/i.test(text)) return "scale";
    return "predictability";
  };

  const cleanTags = (text: string): string =>
    text.replace(/\[(PREVISIBILIDADE|ESCALA)\]\s*/gi, "").trim();

  // Strategy 1: Split by numbered patterns (handles "1.", "**1.**", "1)", "1 -", etc.)
  const blocks = response.split(/\n\s*\*{0,2}\d+[\.\)\-:]\*{0,2}\s*/).filter((b) => b.trim());
  for (const block of blocks) {
    const parts = block.split(/---+/);
    const raw = parts[0].trim();
    const strategy = detectStrategy(raw);
    const variant = cleanTags(
      raw
        .replace(/^\*{1,2}/, "").replace(/\*{1,2}$/, "")
        .replace(/^["'""\u201C\u201D]|["'""\u201C\u201D]$/g, "")
        .replace(/^\[.*?\]\s*/, "")
        .trim()
    );
    const hypothesis = parts.slice(1).join("---").replace(/^\*{1,2}/, "").replace(/\*{1,2}$/, "").trim() || "Sem hipotese.";
    if (variant && variant.length > 3 && !variant.toLowerCase().startsWith("headline")) {
      results.push({ variant, hypothesis, strategy });
    }
  }

  // Strategy 2: Line-by-line fallback
  if (results.length < expectedCount) {
    results.length = 0;
    const lines = response.split("\n").filter((l) => l.trim());
    for (let i = 0; i < lines.length && results.length < expectedCount; i++) {
      const rawLine = lines[i];
      const strategy = detectStrategy(rawLine);
      const line = cleanTags(
        rawLine
          .replace(/^\s*\*{0,2}\d+[\.\)\-:]\*{0,2}\s*/, "")
          .replace(/^\*{1,2}/, "").replace(/\*{1,2}$/, "")
          .replace(/^["'""\u201C\u201D]|["'""\u201C\u201D]$/g, "")
          .trim()
      );

      if (!line || line.startsWith("---") || line.length < 5) continue;
      if (/^(hipot|hypo|reason|obs:|nota:|---)/i.test(line)) continue;

      const nextLine = lines[i + 1]?.trim() ?? "";
      const isNextHypothesis = nextLine.startsWith("---") || nextLine.startsWith("*") || (nextLine.length < 120 && nextLine.length > 5 && !/^\d/.test(nextLine));

      if (isNextHypothesis && nextLine.startsWith("---")) {
        const hyp = nextLine.replace(/^---+\s*/, "").replace(/^\*{1,2}/, "").replace(/\*{1,2}$/, "").trim();
        results.push({ variant: line, hypothesis: hyp || "Sem hipotese.", strategy });
        i++;
      } else if (isNextHypothesis && !nextLine.startsWith("---")) {
        results.push({ variant: line, hypothesis: nextLine, strategy });
        i++;
      } else {
        results.push({ variant: line, hypothesis: "Sem hipotese.", strategy });
      }
    }
  }

  console.log(`[autoresearch] Parsed ${results.length}/${expectedCount} variants`);

  // Pad if needed (last resort) — padded variants are ESCALA by default
  while (results.length < expectedCount) {
    results.push({
      variant: `Variacao automatica #${results.length + 1} da headline original`,
      hypothesis: "Fallback — parser nao extraiu variante suficiente",
      strategy: "scale",
    });
  }

  return results.slice(0, expectedCount);
}
