import { findPages } from "@/lib/wiki/query";
import { OfferBriefing, WikiPage } from "@/types";

export interface VslContextBundle {
  voices: WikiPage[];
  frameworks: WikiPage[];
  mechanisms: WikiPage[];
  patterns: WikiPage[];
  claims: WikiPage[];
  avatars: WikiPage[];
  all_used_ids: string[];
}

/**
 * Monta o "bundle de contexto L2" pra alimentar a geração/avaliação de VSL.
 * Puxa páginas relevantes do wiki baseado no briefing + style_blend.
 */
export async function buildVslContext(
  briefing: OfferBriefing | null,
  styleBlend: Record<string, number>,
): Promise<VslContextBundle> {
  const niche = briefing?.niche ?? "geral";
  const niches = [niche, "geral"];

  // 1. Voices selecionadas no style_blend
  const voiceSlugs = Object.keys(styleBlend).filter((s) => styleBlend[s] > 0);
  const voices = voiceSlugs.length
    ? await findPages({ kinds: ["voice"], slugs: voiceSlugs, limit: 10 })
    : [];

  // 2. Frameworks fundamentais (sempre incluir Schwartz + 16 palavras + Halbert lead)
  const coreFrameworks = await findPages({
    kinds: ["framework"],
    slugs: [
      "framework--niveis-consciencia-schwartz",
      "framework--16-palavras",
      "framework--halbert-lead-structure",
      "framework--slippery-slide",
    ],
  });

  // 3. Mecanismos relevantes ao nicho
  const mechanisms = await findPages({ kinds: ["mechanism"], niches, limit: 5 });

  // 4. Patterns do nicho
  const patterns = await findPages({ kinds: ["pattern"], niches, limit: 6 });

  // 5. Claims/compliance do nicho
  const claims = await findPages({ kinds: ["claims"], niches, limit: 2 });

  // 6. Avatar(es) do nicho
  const avatars = await findPages({ kinds: ["avatar"], niches, limit: 3 });

  const all_used_ids = [
    ...voices,
    ...coreFrameworks,
    ...mechanisms,
    ...patterns,
    ...claims,
    ...avatars,
  ].map((p) => p.id);

  return {
    voices,
    frameworks: coreFrameworks,
    mechanisms,
    patterns,
    claims,
    avatars,
    all_used_ids,
  };
}

export function bundleToPromptContext(bundle: VslContextBundle, styleBlend: Record<string, number>): string {
  const sections: string[] = [];

  if (bundle.voices.length) {
    const weighted = bundle.voices
      .map((v) => `## ${v.title} (peso: ${(styleBlend[v.slug] ?? 0).toFixed(2)})\n${v.body_md}`)
      .join("\n\n---\n\n");
    sections.push(`# COPYWRITERS DE REFERÊNCIA\n${weighted}`);
  }

  if (bundle.frameworks.length) {
    const fw = bundle.frameworks.map((f) => `## ${f.title}\n${f.body_md}`).join("\n\n");
    sections.push(`# FRAMEWORKS APLICÁVEIS\n${fw}`);
  }

  if (bundle.mechanisms.length) {
    const m = bundle.mechanisms
      .map((p) => `## ${p.title}\n${p.summary}\n${p.body_md.slice(0, 1200)}`)
      .join("\n\n");
    sections.push(`# MECANISMOS DO NICHO\n${m}`);
  }

  if (bundle.patterns.length) {
    const p = bundle.patterns.map((x) => `## ${x.title}\n${x.summary}`).join("\n");
    sections.push(`# PADRÕES DE GANCHO DISPONÍVEIS\n${p}`);
  }

  if (bundle.claims.length) {
    const c = bundle.claims.map((x) => x.body_md).join("\n\n");
    sections.push(`# COMPLIANCE — LEIA ANTES DE ESCREVER\n${c}`);
  }

  if (bundle.avatars.length) {
    const a = bundle.avatars.map((x) => `## ${x.title}\n${x.body_md}`).join("\n\n");
    sections.push(`# AVATAR(ES) DO NICHO\n${a}`);
  }

  return sections.join("\n\n═══════════════\n\n");
}

export function briefingToPromptInput(briefing: OfferBriefing): string {
  return `BRIEFING DA OFERTA

Nome: ${briefing.offer_name}
Nicho: ${briefing.niche}
Ticket: ${briefing.ticket ?? "—"}

NOVA OPORTUNIDADE: ${briefing.new_opportunity ?? "—"}
DESEJO: ${briefing.desire ?? "—"}
MECANISMO ÚNICO: ${briefing.new_mechanism ?? briefing.syndrome_name ?? "—"}
PROMESSA: ${briefing.promise ?? "—"}
PROTOCOLO: ${briefing.protocol ?? "—"}
RESULTADO TANGÍVEL: ${briefing.tangible_result ?? "—"}
TIMELINE: ${briefing.result_timeline ?? "—"}

AVATAR
Público: ${briefing.target_audience ?? "—"}
Dores: ${briefing.main_pains?.join(" · ") ?? "—"}
Desejos: ${briefing.main_desires?.join(" · ") ?? "—"}
Tentativas frustradas: ${briefing.failed_attempts?.join(" · ") ?? "—"}
Medos: ${briefing.fears?.join(" · ") ?? "—"}
Crenças: ${briefing.beliefs?.join(" · ") ?? "—"}

MECANISMO ÚNICO
Causa raiz: ${briefing.root_cause ?? "—"}
Por que nada funcionou: ${briefing.why_nothing_worked ?? "—"}
Por que ISSO funciona: ${briefing.why_this_works ?? "—"}
Síndrome: ${briefing.syndrome_name ?? "—"}

OFERTA
Produto: ${briefing.product_name ?? "—"}
Formato: ${briefing.product_format ?? "—"}
Conteúdo: ${briefing.product_contents ?? "—"}
Bônus: ${briefing.bonuses?.join(" · ") ?? "—"}
Preço: ${briefing.price ?? "—"}
Garantia: ${briefing.guarantee ?? "—"}

COPY ESSENCIAL JÁ PROPOSTO
Headline principal: ${briefing.main_headline ?? "—"}
VSL opening: ${briefing.vsl_opening ?? "—"}
CTA: ${briefing.main_cta ?? "—"}`;
}
