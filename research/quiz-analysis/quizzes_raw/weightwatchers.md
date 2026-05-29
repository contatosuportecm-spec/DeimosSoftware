# WeightWatchers — Quiz Funnel Breakdown

## Metadados
- **URL:** https://www.weightwatchers.com/us/personalassessment/
- **Data:** 2026-05-27
- **Telas capturadas:** 9
- **Método:** Playwright crawler direto
- **Status:** ✅ Capturado com sucesso (apesar de Cloudflare-protected — passou pelo recaptcha invisível)

---

## SEQUÊNCIA REAL

### Tela 0 — Welcome / Intro
- **Headline (verbatim):** "Your journey starts here"
- **Subtítulo:** "Tell us a little about yourself, and we'll find the right WeightWatchers® membership for you."
- **CTA:** "Start the quiz"
- **Microcopy legal:** "By continuing, you agree to your health and other data being used by us for this assessment and marketing purposes."
- **Categoria:** Soft commitment + Consent legal
- **Insight:** Tom MUITO suave. "Your journey" — não "lose weight". Frame de descoberta vs. transformação agressiva.

### Tela 1 — Histórico com a marca
- **Pergunta (verbatim):** "Before we dive in, have you tried WW before?"
- **Opções:** "Yes" / "No"
- **Validation:** "Please make a selection"
- **Categoria:** Segmentação de cohort (returning vs new)
- **Insight:** Aproveitamento da marca legacy. Antes de entender o objetivo, WW pergunta se você já é "família".

### Tela 4 — Idade (em bandas)
- **Pergunta:** "What is your age?"
- **Opções:**
  - "18–24"
  - "25–34"
  - "35–44"
  - "45–54"
  - "55–64"
  - "65+"
- **Validation:** "Please make a selection"
- **Categoria:** Demográfica em bandas
- **Insight:** 6 bandas equilibradas (vs Noom 7 decade bands, Unimeal 6, BetterMe 4)

### URL final capturada: `/personalassessment/default/agerange`

---

## PADRÕES — WEIGHTWATCHERS ESPECÍFICOS

| Padrão | Texto verbatim |
|---|---|
| **Tom soft/journey** | "Your journey starts here" |
| **Cohort segmentation** | "Before we dive in, have you tried WW before?" |
| **Consent legal explícito** | "By continuing, you agree to your health and other data being used by us for this assessment and marketing purposes." |
| **Recaptcha invisível** | Cloudflare Turnstile detected mas não bloqueou crawler |

---

## DIFERENÇAS VS. Noom/BetterMe

WeightWatchers é a marca **legacy** mais cuidadosa nesse comparativo:
- Tom mais conservador ("your journey" vs "lose weight")
- Consent legal explícito desde a tela 1
- Cohort segmentation cedo (returning member vs new)
- Validação visível ("Please make a selection") — UX mais polida

Faz sentido — WW é empresa pública (NYSE: WW), 60+ anos de operação, target demográfico mais sênior.

---

## ARQUIVOS
- `screenshots/weightwatchers/screen_000.png` a `screen_008.png`
