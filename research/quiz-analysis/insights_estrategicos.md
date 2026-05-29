# Insights Estratégicos — Quiz Funnel para Direct Response

**Atualizado com:** dados reais extraídos via Playwright de 18 quizzes (129 telas, 100 perguntas identificadas)
**Foco:** estrutura aplicável ao Deimos Tech (B2B SaaS de direct response automation)

---

## TOP 10 PERGUNTAS QUE TODO QUIZ DE EMAGRECIMENTO TEM (validado por dados)

Confirmado pela análise dos 5 quizzes ricos (Noom, DoFasting, BetterMe, Unimeal, WeightWatchers):

1. **Objetivo de alto nível** — Noom/DoFasting/BetterMe/Unimeal/Lifesum (5/5)
2. **Gênero/Sexo** — Todos (5/5)
3. **Idade** (em bandas, nunca número exato) — Todos (5/5)
4. **Altura** — Noom/DoFasting/Unimeal (3/3 que perguntaram)
5. **Peso atual** — Noom/DoFasting (2/2)
6. **Peso-alvo** com guardrail médico — Noom/DoFasting (2/2)
7. **Histórico de saúde** (multi-select) — Noom (rica, condições + branching diabetes)
8. **Padrão metabólico ou nutricional** — BetterMe/DoFasting (statements em 1ª pessoa)
9. **Hábitos atuais** (sono/comida/atividade) — DoFasting (4 perguntas dedicadas)
10. **Body goal / aspiração** — BetterMe/DoFasting

---

## PERGUNTAS DE ALTO IMPACTO PSICOLÓGICO (que NEM todo quiz tem mas as melhores têm)

Estes são os "diferenciadores" — perguntas que separam quizzes high-converting dos médios:

### 1. Statements em 1ª pessoa para dor
**Marcas:** DoFasting, BetterMe, Noom (parcial)

```
"Do you have any of the following bad habits?"
- I eat meals while relaxing
- I'm constantly drinking soft drinks
- I get cravings late at night
- I have an uncontrollable sweet tooth
- I snack too often
```

### 2. Ancoragem nostálgica
**Marca:** BetterMe (único com texto exato capturado)

```
"How long ago were you in the best shape of your life?"
- Less than a year ago / 1-2 years ago / More than 3 years ago / Never
```

### 3. Eventos causadores externos
**Marca:** BetterMe (formato premium)

```
"Have any of the following events led to weight gain in the last few years?"
[Choose all that apply]
- Work pressure / Busy family life / Divorce or breakup / Aging / 
  Financial / Covid / Other stressful events / None
```

### 4. Validação tela-inteira pós-disclosure
**Marca:** Noom

Após blocos médicos, tela DEDICADA sem pergunta, apenas reassurance:
> "We're really glad you shared. Weight loss is an important goal, but Noom's mission is helping people get healthier..."

### 5. Anti-fricção em input numérico
**Marca:** DoFasting

> "A rough estimate will do - you can always change it later."

### 6. Opt-out gracioso em perguntas aspiracionais
**Marca:** DoFasting

> "If you're happy with your appearance, then press Continue"

### 7. Cohort segmentation por familiaridade
**Marca:** WeightWatchers + DoFasting

```
WW: "Before we dive in, have you tried WW before?" [Yes/No]
DoFasting: "How familiar are you with Intermittent Fasting?"
  - I don't know anything / I've heard about it / I'm advanced in fasting
```

---

## ESQUELETO PROPOSTO PARA O QUIZ DEIMOS (revisado com evidência real)

**Tamanho-alvo:** 22-25 telas. Tempo-alvo: 4-6 min.

### ACT 1 — DEMOGRAFIA + COMPROMISSO (5 telas)

#### Tela 1 — Objetivo de alto nível
```
"What do you want to unlock first with Deimos?"

- Scale an existing offer
- Launch a new offer
- Cut operational chaos
- I'm still exploring
```
*(Anti-pressão na 4ª opção, copiado direto do Noom "I haven't decided yet")*

#### Tela 2 — Perfil profissional (cohort segmentation)
```
"You're a..."

- Traffic manager
- Copywriter / strategist
- Producer / agency owner
- Solo creator
- Operations / team lead
```

#### Tela 3 — Tamanho da operação (bandas, não input)
```
"How many people are on your team today?"

- Just me
- 2-5
- 6-20
- 20+
```

#### Tela 4 — Faturamento atual (com microcopy "por quê")
**Microcopy:** "We use this to recommend the right starting point. Your data stays private."
```
"Current monthly revenue?"

- < $5k
- $5k-$25k
- $25k-$100k
- $100k-$500k
- $500k+
```

#### Tela 5 — VALIDAÇÃO (tela-inteira, sem pergunta)
```
[Headline] "Thank you for sharing."
[Subtext] "Most people skip this honest assessment. The fact that
you're doing it means you're ahead of 90% of operators we talk to."
[CTA] "Continue"
```
*(Adaptação direta do "We're really glad you shared" do Noom)*

---

### ACT 2 — IDENTIDADE + DOR (8 telas)

#### Tela 6 — Aspiração de faturamento
**Microcopy:** "A rough estimate is fine. You can always update it later."
```
"Where do you want your revenue to be in 12 months?"
[input com banda recomendada baseada na atual]
```
*(Anti-fricção do DoFasting)*

#### Tela 7 — Stack atual (multi-select)
```
"Which tools are you using today?"
[multi-select com 12-15 opções]
- ClickFunnels / Kajabi / Hotmart / Webflow / Notion / 
  Trello / Asana / Make / Zapier / Custom code / 
  Google Sheets / Other
```

#### Tela 8 — IDENTIDADE METABÓLICA (statements em 1ª pessoa) ⭐
```
"How does your operation typically grow?"

- I scale fast but lose money fast too
- I grow steady but slowly
- I struggle to scale beyond a certain point
- I'm just starting
```

#### Tela 9 — EVENTOS EXTERNOS (culpa externa, multi-select) ⭐⭐
**MUST-HAVE — copiado da pergunta-âncora do BetterMe**
```
"Which events have hurt your growth in the last 12 months?"
[Choose all that apply]

- Algorithm changes (Meta / TikTok / Google)
- Key team member left
- Rising ad costs
- Lost a critical supplier
- Personal/family issues
- Burnout
- Economic crisis
- Aggressive competitor
- Other stressful events
- None of the above
```

#### Tela 10 — ANCORAGEM NOSTÁLGICA ⭐
**Direto do BetterMe — adapte pra B2B**
```
"How long ago did your operation feel 'easy' or 'flowing'?"

- Less than 6 months ago
- 6-12 months ago
- More than 1 year ago
- Never
```

#### Tela 11 — Tempo operacional (statement em 1ª pessoa)
```
"On a typical week, I spend MOST of my time on..."

- Strategy and creative
- Tactical execution and tweaks
- Putting out fires
- Managing the team
- Selling / closing
```

#### Tela 12 — Gargalo principal (statement) ⭐
```
"My biggest bottleneck right now isn't lack of ideas, it's..."

- Lack of time
- Lack of right people
- Lack of right tools/data
- Lack of strategic clarity
- Lack of capital
```

---

### EMAIL GATE (Tela 13) ⭐

**Posição:** ~50% do funil (após dor, antes de aspiração detalhada)
```
[Headline] "Want to see your personalized growth plan?"
[Subtext] "We'll send your custom analysis + 3 specific next steps to your email."
[Input] Email
[CTA] "Get my plan"
[Opt-in separado, NÃO obrigatório] 
  ☐ Send me occasional research, tips, and exclusive offers
```

---

### ACT 3 — APROFUNDAMENTO + COMPROMISSO (6 telas)

#### Tela 14 — Body goal equivalent (qual área melhorar primeiro)
```
"If you could fix ONE thing first, what would it be?"
- Lead generation
- Conversion rates
- Customer retention
- Team scalability
- Personal time freedom
```

#### Tela 15 — Pace preference
```
"How fast do you want to move?"
- I want to ship something this week
- 1-3 month transformation
- 6+ months sustainable
- Slow and steady
```

#### Tela 16 — Familiaridade com automação
```
"How familiar are you with Direct Response automation?"
- I'm new to this
- I've tried some tools
- I have a stack but it's fragmented
- I run a sophisticated operation
```

#### Tela 17 — Tempo de implementação (commitment)
```
"How many hours can you dedicate to setup per week?"
- < 2 hours
- 2-5 hours
- 5-10 hours
- 10+ hours
```

#### Tela 18 — Áreas-foco (multi-select)
```
"Which sides of your operation need most help?"
- Creative production
- Media buying
- Funnel/landing page
- CRM and follow-up
- Customer support
- Analytics and reporting
```

#### Tela 19 — Statement final de aspiração ⭐
```
"6 months from now, the win that would matter MOST is..."
- Hitting a specific revenue number
- Working fewer hours
- Building a more resilient operation
- Launching a new product line
- Selling/exiting the business
```

---

### LOADING SCREEN (Tela 20) ⭐ MUST-HAVE

```
[Animação] Pulsing circle ou progresso indeterminado
[Texto, rota através de 4-5 frases ao longo de 20-25s]:
"Analyzing your 18 responses..."
"Cross-referencing with 2,400+ similar operations..."
"Calibrating your custom growth plan..."
"Estimating time savings and revenue impact..."
"Almost ready..."

[Mini-pergunta opcional embutida no meio:]
"Quick one — do you prefer step-by-step instructions or
big-picture frameworks?"
[Step-by-step / Big picture]
```

*(Processing theater do Noom + mini-quiz embutido = double-dip de valor)*

---

### ACT 4 — REVEAL + OFERTA (Telas 21-23)

#### Tela 21 — Personalized result
```
[Headline] "[Nome ou 'Operator'], your Deimos profile is: [Builder/Scaler/Optimizer]"

[Card visual com data específica:]
"Based on your current $25k/mo and your goal of $100k/mo,
our model projects you can hit your target by:
**November 15, 2026** (5.5 months from now)
*Average for operators in your profile."

[Gráfico simples: linha steady vs linha "flat" sem Deimos]
```

#### Tela 22 — Social Proof
```
"You're not alone."
"We've helped 2,847 operators automate $X+ in direct response since 2024.*"
[1-2 depoimentos curtos com nome + foto + número específico]
[*Footnote técnica com qualifier]
```

#### Tela 23 — PAYWALL
```
[Headline] "Your personalized Deimos plan is ready."

[Pricing diário, NÃO mensal:]
"Just $1.99/day for the first 30 days, then $X/month"

[Trial framing:]
"Start free for 14 days"
[Countdown timer: 14:59 → "Your reserved spot expires in"]

[3-4 bullets de benefício específico para o perfil dele]
[Garantia mencionada explicitamente]
[Botão: "Start my free trial"]
```

---

## GATILHOS UNIVERSAIS CONFIRMADOS (com texto verbatim)

| # | Gatilho | Texto verbatim de quem usa |
|---|---|---|
| 1 | Microcopy "por quê" | Noom: "Hormones impact how our bodies metabolize food." |
| 2 | Validação pós-disclosure | Noom: "We're really glad you shared." |
| 3 | Anti-fricção em input | DoFasting: "A rough estimate will do - you can always change it later." |
| 4 | Opt-out gracioso | DoFasting: "If you're happy with your appearance, then press Continue" |
| 5 | Statements em 1ª pessoa | DoFasting: "I get cravings late at night" |
| 6 | Culpa externa | BetterMe: lista de eventos (divórcio, covid, finanças) |
| 7 | Ancoragem nostálgica | BetterMe: "How long ago were you in the best shape of your life?" |
| 8 | Bandas em vez de input | Noom: "20s / 30s / 40s / 50s / 60s / 70s / 80s+" |
| 9 | Inclusividade | Noom: "I use a different term / Prefer not to say" |
| 10 | Anti-pressão na 1ª tela | Noom: "I haven't decided yet" |
| 11 | Guardrail médico/numérico | Noom: "Recommended weight range: X kg - Y kg" |
| 12 | Cohort segmentation | WW: "Have you tried WW before?" |
| 13 | Social proof preciso | Noom: "3,627,436 people lose weight!*" |
| 14 | Footnote técnica | Noom: "*at least 2% of original weight as of October 2021" |

---

## REGRAS NÃO-NEGOCIÁVEIS PARA O QUIZ DEIMOS

1. **TODA pergunta sensível tem microcopy de 1 linha explicando por quê**
2. **TODO input numérico tem unit toggle + range recomendado + texto "you can change later"**
3. **TODA seção emocional (dor/identidade) é seguida por VALIDAÇÃO**
4. **TODA pergunta de "culpa" oferece OPÇÕES EXTERNAS** (algoritmo, equipe, economia — não "você foi negligente")
5. **TODA tela tem 1 pergunta** (sem batch)
6. **MOBILE-FIRST** (mesmo que B2B — operators check email no celular)
7. **PROGRESS BAR sutil** (4-5px de altura)
8. **LOADING SCREEN obrigatório antes do paywall** (15-25s mínimo)
9. **EMAIL GATE em ~50%** do funil (após dor, antes de aspiração)
10. **PRICING DIÁRIO no paywall** (não mensal)
11. **COUNTDOWN no paywall** (15min recomendado)
12. **TRIAL framing** ("$1 for 14 days") não "Subscribe for $X"

---

## CHECKLIST DE IMPLEMENTAÇÃO

### Antes de codar
- [ ] Revisar este documento com sua audiência real (3-5 entrevistas)
- [ ] Validar copy do ACT 2 (dor) — esta é a parte que mais varia por nicho
- [ ] Definir o "vilão" (algoritmo? falta de stack? competidores?)
- [ ] Definir 3-4 "profiles" finais (Builder/Scaler/Optimizer/Other)
- [ ] Definir trial price + cadência

### Tech stack (já está no Deimos)
- [ ] Next.js App Router (já tem)
- [ ] Supabase para tracking step-by-step (já tem)
- [ ] Claude API para gerar copy dinâmica em algumas telas (opcional)
- [ ] Componente de progress bar
- [ ] Sistema de unit toggle para inputs numéricos
- [ ] Componente de loading screen com texto rotativo
- [ ] Email gate com double opt-in separado

### Após launch
- [ ] Track 500-1000 entries antes de iterar
- [ ] Mede dropoff por tela, taxa de complete, conversão pós-quiz
- [ ] Heatmap nas perguntas mais lentas (vale considerar split de microcopy)
- [ ] A/B test no email gate posição (33% vs 50% vs 66%)

---

## ARQUIVOS DESTE PROJETO

```
research/quiz-analysis/
├── _STATUS.md                    # Inventário de coleta
├── analise_consolidada.md        # Padrões e frequências
├── insights_estrategicos.md      # Este documento
├── dump_por_quiz.md              # Texto verbatim de TODAS as 129 telas
├── dump_consolidado.md           # Tabela comparativa primeira tela
├── perguntas_extraidas.md        # 100 perguntas identificadas
└── quizzes_raw/
    ├── _TEMPLATE_manual_capture.md  # Template para completar gaps
    ├── noom.md                      # 13 telas detalhadas
    ├── dofasting.md                 # 23 telas detalhadas
    ├── betterme.md                  # 14 telas detalhadas
    ├── unimeal.md                   # 12 telas detalhadas
    ├── weightwatchers.md            # 9 telas detalhadas
    ├── simple.md                    # 6 telas (parcial)
    ├── fastic.md                    # Secondary source (referência)
    └── screenshots/<slug>/          # HTML + txt + PNG por tela
```

## SCRIPTS

```
scripts/
├── quiz-crawler.ts    # Crawler de 1 quiz (npx tsx scripts/quiz-crawler.ts <slug> <url>)
├── quiz-batch.ts      # Roda nos 19 quizzes (npx tsx scripts/quiz-batch.ts)
└── quiz-extract.ts    # Gera relatórios a partir dos manifests
```
