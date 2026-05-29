# BetterMe — Quiz Funnel Breakdown

## Metadados
- **URL:** https://quiz.betterme.world/
- **Data:** 2026-05-27
- **Telas capturadas:** 14
- **Método:** Playwright crawler direto
- **Status:** ✅ EXTRAÇÃO DIRETA — texto verbatim do DOM

---

## SEQUÊNCIA REAL

### Tela 0 — Gênero direto na primeira tela
- **Headline:** "BETTERME PLAN"
- **Subtítulo (verbatim):** "Lose weight, tone up and gain strength at home"
- **Opções:** "Male" / "Female"
- **Microcopy:** "By selecting your gender and continuing you agree to our Terms of Service | Privacy Policy"
- **Categoria:** Demográfica (sem microcopy "por quê" — direto)
- **Diferença Noom:** BetterMe abre com gênero em vez de objetivo; Noom abre com objetivo

### Tela 1 — Idade
- **Pergunta:** "What's your age?"
- **Opções:**
  - "18 - 29"
  - "30 - 39"
  - "40 - 49"
  - "50+"
- **Categoria:** Demográfica (bandas amplas, 4 opções vs 7 do Noom)

### Tela 3 — Goal principal
- **Pergunta:** "What's your main goal?"
- **Opções:** "Lose weight" / "Gain muscle mass"
- **Categoria:** Objetivo (binário simples)

### Tela 5 — Self-image (build)
- **Pergunta:** "How would you describe your physical build?"
- **Opções:**
  - "Slender"
  - "Medium build"
  - "Stocky"
  - "Significantly overweight"
- **Categoria:** Identidade + Auto-imagem
- **Insight:** "Significantly overweight" é palavra forte — quem marca isso já se rotula

### Tela 6 — Aspiração de body
- **Pergunta:** "What's your body goal?"
- **Opções:**
  - "A few sizes smaller"
  - "Athletic"
  - "Ripped"
  - "Swole"
- **Categoria:** Aspiração + Identidade
- **Insight:** Linguagem masculina ("Ripped", "Swole") indica que esse é o fluxo MALE

### Tela 7 — Padrão metabólico
- **Pergunta:** "How does your weight typically change?"
- **Opções (verbatim):**
  - "I gain weight fast but lose it slowly"
  - "I gain and lose weight easily"
  - "I struggle to gain weight or muscle"
- **Categoria:** Identidade + Dor + Statements em 1ª pessoa
- **Insight:** Cada opção é uma "personalidade metabólica" — usuário se identifica

### Tela 8 — Frame temporal nostálgico
- **Pergunta:** "How long ago were you in the best shape of your life?"
- **Opções:**
  - "Less than a year ago"
  - "1 to 2 years ago"
  - "More than 3 years ago"
  - "Never"
- **Categoria:** Dor + Saudade + Ancoragem temporal
- **Insight psicológico:** Esta pergunta ATIVA NOSTALGIA. "Never" é uma opção dura — quem marca isso já está em estado emocional vulnerável

### Tela 9 — Eventos que causaram ganho de peso (MULTI-SELECT)
- **Pergunta (verbatim):** "Have any of the following events led to weight gain in the last few years?"
- **Microcopy:** "Choose all that apply"
- **Opções (verbatim):**
  - "Work pressure"
  - "Busy family life"
  - "Divorce or breakup"
  - "Slower metabolism due to aging"
  - "Financial challenges"
  - "Covid-19 pandemic"
  - "Other stressful events"
  - "None of the above"
- **Categoria:** Dor + Causa externa
- **Insight psicológico (CRUCIAL):** Esta pergunta DÁ CULPA EXTERNA. O usuário NÃO precisa admitir "fui fraco" — pode atribuir a divórcio, pandemia, trabalho. Reduz vergonha e ABRE CAMINHO para a solução. **Esta é a pergunta mais poderosa do quiz BetterMe.**

---

## PADRÕES PSICOLÓGICOS — BETTERME ESPECÍFICOS

| Padrão | Texto verbatim |
|---|---|
| **Aspiração com linguagem gendered** | "Ripped" / "Swole" (masc) — provavelmente "Lean" / "Toned" (fem) |
| **Identidade metabólica** | "I gain weight fast but lose it slowly" / "I struggle to gain weight or muscle" |
| **Ancoragem nostálgica** | "How long ago were you in the best shape of your life?" |
| **CULPA EXTERNA** | "Divorce or breakup / Covid-19 pandemic / Slower metabolism due to aging" |
| **Auto-rotulação** | "Significantly overweight" como opção (linguagem dura) |

---

## DIFERENÇAS VS. NOOM

| | Noom | BetterMe |
|---|---|---|
| **Primeira pergunta** | Goal (5 opções com nuance) | Gender (2 opções) |
| **Microcopy "por quê"** | Em TODA pergunta sensível | Praticamente ausente |
| **Identidade** | Behavioral profile (sliders) | Self-image (build + body goal) |
| **Dor** | "Habit barriers" abstratos | Eventos concretos (divórcio, covid, financeiro) |
| **Tom** | Clínico-coachy | Direto e identitário |
| **Validação** | Múltiplas telas-inteira de reassurance | Pouca/nenhuma |

**Conclusão:** Noom = método. BetterMe = transformação corporal direta. Reflete posicionamentos diferentes.

---

## ARQUIVOS
- `screenshots/betterme/screen_000.png` a `screen_013.png`
- `screenshots/betterme/screen_NNN.html` + `.txt`
- `screenshots/betterme/manifest.json`
