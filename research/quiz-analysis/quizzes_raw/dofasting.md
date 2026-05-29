# DoFasting — Quiz Funnel Breakdown

## Metadados
- **URL:** https://dofasting.com/ → redireciona para new.dofasting.com/trial
- **Data:** 2026-05-27
- **Telas capturadas:** 23 (campeão do batch — captura mais profunda)
- **Método:** Playwright crawler direto
- **Status:** ✅ EXTRAÇÃO DIRETA — texto verbatim do DOM

---

## SEQUÊNCIA REAL

### Tela 0 — Goal de alto nível
- **Pergunta (verbatim):** "To start, please select a goal:"
- **Headline acima:** "Find out what you can achieve with our fasting assistant"
- **Subtítulo:** "Become a better you in just 3 months"
- **Opções:** "Improve my health" / "Lose weight"
- **Disclaimer:** "*People using the app could expect to lose 1-2 pounds a week"
- **Categoria:** Objetivo (2 caminhos distintos: saúde vs peso)

### Tela 1 — IF Knowledge
- **Pergunta:** "How familiar are you with Intermittent Fasting?"
- **Opções:** 
  - "I don't know anything"
  - "I've heard about it"
  - "I'm advanced in fasting"
- **Categoria:** Comportamental + Personalização de conteúdo educacional

### Tela 2 — Gênero
- **Pergunta:** "Select your gender"
- **Opções:** "Female" / "Male"

### Tela 3 — Estágio de vida (condicional feminino)
- **Pergunta:** "What stage of life are you currently in?"
- **Microcopy:** "Your nutritional needs are highly dependant on hormonal changes"
- **Opções:**
  - "Regular cycles"
  - "Peri-menopause"
  - "Menopause"
  - "Post-menopause"
  - "Prefer to not say"
- **Categoria:** Demográfica + Microcopy "por quê" + Inclusividade (menopausa)
- **Insight:** Personalização específica feminina ANTES de idade/peso

### Tela 5 — Padrão alimentar
- **Pergunta:** "How many meals do you eat daily?"
- **Opções:** "1-2" / "2-3" / "3-4" / "4+"

### Tela 6 — Carb intake
- **Pergunta:** "How common in your diet are carb-dense foods like bread, rice, potatoes, cereal etc.?"
- **Opções:** "Not at all" / "Very little" / "Somewhat common" / "Very often"
- **Categoria:** Comportamental detalhado (não-genérico)

### Tela 7 — Bad habits (multi-select)
- **Pergunta:** "Do you have any of the following bad habits?"
- **Opções (verbatim):**
  - "I eat meals while relaxing"
  - "I'm constantly drinking soft drinks"
  - "I indulge in a drink or two"
  - "I get cravings late at night"
  - "I have an uncontrollable sweet tooth"
  - "I snack too often"
  - "I crave salty foods"
  - "None of above"
- **Categoria:** Dor/Identidade — formato 1ª pessoa ("I eat...", "I get...")
- **Insight:** Frame de "bad habits" carrega culpa/identidade. Opções em 1ª pessoa força auto-reconhecimento

### Tela 8 — Diets atuais
- **Pergunta:** "What diets, if any, are you currently on?"
- **Opções:** "No specific diets" / "Lactose-free" / "Vegetarian" / "Keto" / "Paleo diet" / "Fully plant-based" / "Low-carb" / "Mediterranean diet" / "Other"

### Tela 9 — Interstitial de venda
- **Conteúdo:** "DoFasting delivers sustainable weight loss and long-lasting results"
- **Subtítulo:** "The plan is personalized to fit your lifestyle"
- **Categoria:** Social proof / value reinforcement (não-pergunta)

### Tela 10 — Sono
- **Pergunta:** "How well do you sleep at night?"
- **Opções:**
  - "My sleep is long and deep"
  - "I sleep alright"
  - "I keep waking up"
  - "I struggle to get a good night's rest"
- **Categoria:** Comportamental + Identidade (frase em 1ª pessoa novamente)

### Tela 12 — Hidratação
- **Pergunta:** "How much water do you typically drink in a day?"

### Tela 13 — Atividade
- **Pergunta:** "How active are you?"
- **Opções:** "Not at all" / "Somewhat active" / "Active"

### Tela 14 — Áreas-foco
- **Pergunta:** "Any areas you'd like to improve?"
- **Microcopy:** "If you're happy with your appearance, then press Continue"
- **Opções:** "Arms" / "Chest" / "Abs" / "Glutes" / "Thighs"
- **Categoria:** Aspiração + opt-out gracioso ("happy with your appearance")

### Tela 15 — Idade
- **Pergunta:** "What is your age?"
- **Microcopy:** "We ask this to establish if DoFasting is safe for you"
- **Input:** "I'm ... years old" (free-form, não bandas)
- **Categoria:** Demográfica + Safety framing

### Tela 16 — Altura & Peso (mesma tela!)
- **Pergunta:** "What's your height and weight?"
- **Microcopy:** "Healthy fasting weight loss is 1-2 pounds weekly. Your height and weight guide our tailored plan."
- **Unit toggles:** "lb and ft" / "kg and cm"
- **Categoria:** Antropometria + Compromisso safety ("1-2 pounds weekly")
- **Insight notável:** DoFasting pede ALTURA E PESO na mesma tela (Noom pede em telas separadas). Decisão de design = mais friction em 1 tela vs spread

### Tela 17 — Peso-alvo
- **Pergunta:** "What's your weight goal?"
- **Microcopy:** "A rough estimate will do - you can always change it later."
- **Validação:** "Weight has to be between 88 lb and 551 lb" (guardrail médico amplo)
- **Categoria:** Objetivo + Anti-fricção ("rough estimate", "you can always change it later")

---

## PADRÕES PSICOLÓGICOS — DOFASTING ESPECÍFICOS

| Padrão | Texto verbatim |
|---|---|
| **Microcopy "por quê" antes de gênero+stage** | "Your nutritional needs are highly dependant on hormonal changes" |
| **Microcopy de safety na idade** | "We ask this to establish if DoFasting is safe for you" |
| **Microcopy de compromisso realista** | "Healthy fasting weight loss is 1-2 pounds weekly. Your height and weight guide our tailored plan." |
| **Opt-out gracioso** | "If you're happy with your appearance, then press Continue" |
| **Anti-fricção em input numérico** | "A rough estimate will do - you can always change it later." |
| **Statements de identidade em 1ª pessoa** | "I get cravings late at night" / "I have an uncontrollable sweet tooth" / "I struggle to get a good night's rest" |
| **Inclusividade hormonal** | Peri-menopause / Menopause / Post-menopause como opções nativas |

---

## DIFERENÇAS VS. NOOM

1. **DoFasting pergunta o GOAL em apenas 2 opções** (Improve health / Lose weight) — Noom tem 5
2. **DoFasting pergunta familiaridade com IF cedo** (Noom não pergunta familiaridade)
3. **DoFasting tem opt-out na pergunta de áreas** — Noom nunca dá opt-out
4. **DoFasting agrupa altura+peso na mesma tela** — Noom separa
5. **DoFasting é mais agressivo em statements de identidade** — Noom usa mais "behavioral profile sliders"

---

## ARQUIVOS
- `screenshots/dofasting/screen_000.png` a `screen_022.png`
- `screenshots/dofasting/screen_NNN.html` + `.txt`
- `screenshots/dofasting/manifest.json`
