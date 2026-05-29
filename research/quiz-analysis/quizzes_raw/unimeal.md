# Unimeal — Quiz Funnel Breakdown

## Metadados
- **URL:** https://unimeal.com/quiz/step-gender
- **Data:** 2026-05-27
- **Telas capturadas:** 12
- **Método:** Playwright crawler direto
- **Status:** ✅ EXTRAÇÃO DIRETA — texto verbatim do DOM

---

## SEQUÊNCIA REAL

### Tela 0 — Idade (apesar da URL ser /step-gender)
- **Pergunta:** "First, How Old Are You?"
- **Microcopy (verbatim):** "Your age shapes your metabolism, hormones, and nutrient needs."
- **Opções:**
  - "18-29"
  - "30-34"
  - "35-44"
  - "45-54"
  - "55-64"
  - "65+"
- **Footer legal:** "AmoApps Limited (reg. No. HE 450507, Nicosia, Cyprus)"
- **Categoria:** Demográfica + Microcopy "por quê"
- **Insight:** Bandas mais granulares que Noom (6 vs 7) mas com faixa de jovens menor (18-29 = 11 anos vs 20s de Noom)

### Tela 1 — Sexo biológico
- **Pergunta:** "What is your biological sex?"
- **Opções:** "Male" / "Female"
- **Insight:** Note "biological sex" em vez de "sex assigned at birth" (Noom) — linguagem mais direta, menos inclusive

### Tela 2 — Goal principal
- **Pergunta:** "What is your primary goal?"
- **Microcopy:** "Pick the one that matters most right now."
- **Opções:**
  - "Lose weight"
  - "Build muscle"
  - "Build healthy habits"
  - "Boost energy"
- **Categoria:** Objetivo + Anti-decisão paralysis ("matters most right now")
- **Insight:** "Build healthy habits" e "Boost energy" expandem além de peso — captura usuários menos comprometidos com perda de peso explícita

### Telas 5-11 — Altura (com bug visível!)
- **Pergunta:** "What is your height?"
- **Unit toggles:** "ft" / "cm"
- **Validação:** "Height must be greater than or equal to 3 ft"
- **Bug observado:** O crawler digitou "1 ft 75 in" (combinação inválida) e Unimeal mostrou erro de validação
- **Insight:** Unimeal usa um único campo combinado de altura (ft, in) que aceita 2 valores. Validação é robusta e bloqueia avanço.

---

## PADRÕES — UNIMEAL ESPECÍFICOS

| Padrão | Texto verbatim |
|---|---|
| **Microcopy "por quê" antes da idade** | "Your age shapes your metabolism, hormones, and nutrient needs." |
| **Anti-decisão paralysis no goal** | "Pick the one that matters most right now." |
| **Validação rigorosa em input numérico** | "Height must be greater than or equal to 3 ft" (mensagem de erro inline) |
| **Goal expandido** | "Build healthy habits" / "Boost energy" — captura segmento não-weight-loss |

---

## DIFERENÇAS VS. NOOM/BETTERME

- Unimeal é o ÚNICO que abre com idade (Noom abre com goal, BetterMe com gender)
- Microcopy "por quê" similar a Noom mas mais conciso
- Goal mais amplo (4 caminhos vs Noom 5, BetterMe 2)

---

## ARQUIVOS
- `screenshots/unimeal/screen_000.png` a `screen_011.png`
- `screenshots/unimeal/manifest.json`
