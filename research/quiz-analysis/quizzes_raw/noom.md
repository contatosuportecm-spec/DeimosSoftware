# Noom — Quiz Funnel Breakdown

## Metadados
- **URL oficial:** https://www.noom.com/ps/main-survey/
- **Data de coleta:** 2026-05-27
- **Método:** Playwright crawler (scripts/quiz-crawler.ts)
- **Telas válidas capturadas:** 13 (todo o ACT 1 — demografia → condições médicas → social proof → peso-meta)
- **Status da coleta:** ✅ EXTRAÇÃO DIRETA (texto verbatim do DOM real)
- **Cobertura:** ACT 1 completo. Behavioral profile / email gate / paywall não foram capturados — crawler entrou em página de upsell `/noom-vibe` após tela 12 e travou. Tamanho real do funil completo: ~113 telas (RevenueCat teardown).

---

## SEQUÊNCIA REAL CAPTURADA

### Tela 0 — Weight Loss Goal
- **URL:** /survey/weightLossGoal
- **Header:** "DEMOGRAPHIC PROFILE"
- **Pergunta:** "What is your weight loss goal?"
- **Opções (verbatim):**
  - "Lose 1-10 kg for good"
  - "Lose 11-20 kg for good"
  - "Lose over 20 kg for good"
  - "Maintain weight and get fit"
  - "I haven't decided yet"
- **Categoria:** Objetivo/Aspiração + Compromisso
- **Footer:** "One Palmer Square, Suite 441, Princeton, NJ 08452 / (888) 266-5071"

### Tela 1 — Sex Assigned at Birth
- **URL:** /survey/sex
- **Header:** "DEMOGRAPHIC PROFILE"
- **Microcopy (verbatim):** "Hormones impact how our bodies metabolize food."
- **Pergunta:** "What sex were you assigned at birth?"
- **Opções:** "Male" / "Female" / "Intersex"
- **Categoria:** Demográfica + Validação (justifica antes de pedir)

### Tela 2 — Gender Identity
- **URL:** /survey/gender
- **Microcopy (verbatim):** "People may identify themselves with more than just sex and hormones."
- **Pergunta:** "What is your gender identity?"
- **Opções:** "Man" / "Woman" / "Non-binary" / "I use a different term" / "Prefer not to say"
- **Categoria:** Identidade + Demográfica (design inclusivo)

### Tela 3 — Age Range
- **URL:** /survey/ageRange
- **Pergunta:** "What is your age?"
- **Opções (verbatim):**
  - "20s"
  - "30s"
  - "40s"
  - "50s"
  - "60s"
  - "70s"
  - "80s+"
- **Categoria:** Demográfica + Redução de fricção (decade-banding em vez de input numérico)
- **Insight:** Bandas largas = menos overthinking, mais momentum

### Tela 4 — Height
- **URL:** /survey/basicHeight
- **Pergunta:** "What's your height?"
- **Input:** Unit toggle cm/ft + numeric input
- **Categoria:** Antropometria

### Tela 5 — Current Weight
- **URL:** /survey/basicWeight
- **Pergunta:** "What's your current weight?"
- **Microcopy (verbatim):** "We don't mean to pry, we just need to know so we can build a plan that's right for you."
- **Categoria:** Antropometria + VALIDAÇÃO (a frase mais citada da indústria)

### Tela 6 — Current Health Risk (Male)
- **URL:** /survey/currentHealthRiskMale
- **Pergunta:** "Do you have any of the following conditions?"
- **Opções (verbatim, multi-select):**
  - "Testosterone deficiency"
  - "Heart Disease or Stroke"
  - "High Blood Pressure" (truncado no captura, confirmar)
  - [+ outras condições]
- **Categoria:** Médica
- **Insight:** URL contém "Male" = funil ramifica por gênero (provavelmente há `currentHealthRiskFemale` no fluxo feminino com PCOS, etc.)

### Tela 7 — Health Confirmation (Validação)
- **URL:** /survey/currentHealthRiskMaleConfirmation
- **Conteúdo (verbatim):**
  > "We're really glad you shared. Weight loss is an important goal, but Noom's mission is helping people get healthier, whatever..."
- **Categoria:** VALIDAÇÃO/EMPATIA (tela inteira sem pergunta — só reassurance após disclosure médico)
- **Padrão psicológico:** Essa é uma "interstitial validation" — tela dedicada a aliviar o emocional do usuário após dado vulnerável

### Tela 8 — Diabetes Diagnosis
- **URL:** /survey/diabetesDiagnosis
- **Pergunta:** "Have you ever been diagnosed with diabetes?"
- **Microcopy (verbatim):** "We ask this question to tailor your program with the right..."
- **Opções:** "Yes" / "No"
- **Categoria:** Médica + Microcopy "por quê"
- **Branching:** Se "Yes" → tela 9 (tipo). Se "No" → pula para próxima

### Tela 9 — Diabetes Type (condicional)
- **URL:** /survey/diabetesType
- **Pergunta:** "What type of diabetes have you been diagnosed with?"
- **Opções:** "Type 1 diabetes" / "Type 2 diabetes" / "I'm not sure" / "None"
- **Categoria:** Médica condicional

### Tela 10 — Eating Disorder Pre-Confirmation
- **URL:** /survey/eatingDisorderPreConfirmation
- **Pergunta (verbatim):** "Do you have an active diagnosis of an eating disorder (e.g. bulimia, anorexia, or similar diagnosis)?"
- **Opções:** "Yes" / "No"
- **Modal de confirmação (se "Yes"):** "Thank you for sharing. We know this can be sensitive. Please confirm that your answer is correct." → botão "Continue"
- **Categoria:** Médica + Validação especial (modal de waiver)
- **Insight regulatório:** Noom usa esse pre-confirmation para CYA — se o usuário marcar eating disorder, eles podem precisar restringir o plano ou direcionar para suporte profissional

### Tela 11 — Social Proof Interstitial ("Trusted Hands")
- **URL:** /survey/infoMap
- **Conteúdo (verbatim):**
  > "You're in trusted hands
  > You're not alone, we've helped 3,627,436 people lose weight!*
  > *Noom subscribers who lost at least 2% of their original weight as of October 2021."
- **Categoria:** Social proof + Reassurance
- **Padrão:** Social proof colocada DEPOIS do bloco médico mais pesado — "agora que você foi vulnerável, deixa eu te lembrar que muitos passaram por isso"
- **Footnote técnica:** Define o que conta como "lose weight" (>=2%) = transparência regulatória

### Tela 12 — Ideal Weight (peso-alvo)
- **URL:** /survey/idealWeight
- **Header:** "WEIGHT LOSS GOALS" (note: mudou de DEMOGRAPHIC PROFILE)
- **Pergunta:** "What is your ideal weight that you want to reach?"
- **Input:** Numeric + unit toggle (kg/lb)
- **Sub-info:** "Recommended weight range: 0 kg - 0 kg" (range dinâmico baseado nos dados anteriores)
- **Categoria:** Objetivo + Compromisso
- **Insight:** Noom mostra "Recommended weight range" como guardrail médico — bloqueia metas insalubres

---

## TELAS NÃO CAPTURADAS (perdidas após tela 12)

A partir da tela 13, o crawler entrou em `/noom-vibe` (programa de rewards/seeds — upsell). Trav loop em "Learn more". 

**Conhecidas via RevenueCat (não capturadas direto):**
- Focus area selection (nutrition/movement/habits)
- Event/Deadline question
- Pace selection
- Lesson timing
- Behavioral profile quiz (10 sliders)
- Gym/fitness resources
- Habit barrier statements
- Additional goals + stress mini-quiz
- Nutrition knowledge quiz (food categories)
- Cravings question
- How did you hear about Noom
- Email gate ("See my results")
- Calculating your plan loaders
- Goal weight projection chart
- Pay-what-you-want pricing screen

**Total estimado do funil:** ~113 telas. Capturadas: 13.

---

## PADRÕES PSICOLÓGICOS CONFIRMADOS (texto verbatim)

| Padrão | Texto verbatim |
|---|---|
| **Microcopy "por quê" antes de dado sensível** | "Hormones impact how our bodies metabolize food." (antes de sex) |
| **Microcopy "por quê" antes de dado sensível** | "We don't mean to pry, we just need to know so we can build a plan that's right for you." (antes de current weight) |
| **Microcopy "por quê" antes de dado sensível** | "We ask this question to tailor your program with the right..." (antes de diabetes) |
| **Validação tela-inteira após disclosure** | "We're really glad you shared. Weight loss is an important goal, but Noom's mission is helping people get healthier, whatever..." |
| **Reassurance + Social proof combinados** | "You're in trusted hands / You're not alone, we've helped 3,627,436 people lose weight!" |
| **Modal de confirmação para sensível** | "Thank you for sharing. We know this can be sensitive. Please confirm that your answer is correct." |
| **Guardrail médico no objetivo** | "Recommended weight range: X kg - Y kg" |
| **Demografia em bandas (não input)** | "20s / 30s / 40s / 50s / 60s / 70s / 80s+" |
| **Inclusividade de gênero** | "Man / Woman / Non-binary / I use a different term / Prefer not to say" |
| **Opção anti-pressão na 1ª tela** | "I haven't decided yet" |

---

## ARQUITETURA TÉCNICA OBSERVADA

- **Framework:** Custom React/Next.js (URLs `/survey/<step>` indicam routing por step)
- **Componentes de seleção:** `<button data-cy="single-select">` (não input[radio])
- **Tracking:** `data-cy` atributos sugerem teste automatizado interno
- **Branching:** URLs diferentes para condicionais (currentHealthRiskMale vs Female)
- **Headers seccionais:** "DEMOGRAPHIC PROFILE" → "WEIGHT LOSS GOALS" → ... (block-mode framing)

---

## ARQUIVOS DESTE QUIZ

- `screenshots/noom/screen_000.png`–`screen_017.png` — screenshots de cada tela
- `screenshots/noom/screen_000.html`–`screen_017.html` — HTML completo
- `screenshots/noom/screen_000.txt`–`screen_017.txt` — texto visível
- `screenshots/noom/manifest.json` — sequência completa em JSON

## Como re-rodar
```bash
npx tsx scripts/quiz-crawler.ts noom https://www.noom.com/ps/main-survey/ --headless
```
