# Status da Coleta — Quiz Funnels Emagrecimento

**Data:** 2026-05-27
**Método:** Playwright crawler (`scripts/quiz-crawler.ts`) + batch runner (`scripts/quiz-batch.ts`)
**Duração total do batch:** 703s (~12min) para os 19 quizzes

## Resumo executivo

✅ **18/19 quizzes processados com sucesso** (95%)
✅ **129 telas capturadas** com texto verbatim do DOM, HTML completo e screenshot
✅ **100 perguntas identificadas** por heurística automática
✅ **5 quizzes com cobertura profunda** (>=9 telas únicas)
🔴 **Alguns quizzes bloquearam** ou ficaram em loop (cookie consent, geo-block, Cloudflare anti-bot)

---

## Inventário por marca

| # | Marca | Telas | Status | Notas |
|---|-------|-------|--------|-------|
| 1 | **dofasting** | 23 | ✅ EXCELENTE | Quiz mais profundo capturado — todo o ACT 1+2 (gender, age, habits, meals, sleep, body areas, goal weight) |
| 2 | **noom** | 18 | ✅ EXCELENTE | ACT 1 completo (demografia → médico → social proof → peso-meta). Travou em /noom-vibe upsell |
| 3 | **betterme** | 14 | ✅ EXCELENTE | Demografia + build + body goal + identidade metabólica + eventos de ganho de peso (multi-select) |
| 4 | **unimeal** | 12 | ✅ BOA | Idade + sexo + goal + altura. Travou em validação de altura |
| 5 | **weightwatchers** | 9 | ✅ BOA | Welcome + cohort segmentation (tried WW before) + age range |
| 6 | **simple** | 6 | 🟡 PARCIAL | Capturou tela 0 (segmentação por idade 40+) mas travou em language selector |
| 7 | **calibrate** | 6 | 🟡 PARCIAL | Stuck na landing page (sem quiz visível) |
| 8 | **muscle-booster** | 6 | 🟡 PARCIAL | Capturou age bands (18-25, 26-35, 36-45, 46+) mas travou |
| 9 | **eat-this-much** | 5 | 🟡 PARCIAL | Stuck na landing page de testimonials |
| 10 | **found** | 5 | 🟡 PARCIAL | Stuck na landing ("Get up to $100 off your membership today") |
| 11 | **lasta** | 5 | 🟡 PARCIAL | Travou no seletor de gender (não advança) |
| 12 | **lifesum** | 5 | 🟡 PARCIAL | Travou em cookie consent banner |
| 13 | **reverse-health** | 5 | 🟡 PARCIAL | Stuck em página de marketing (sem CTA do quiz) |
| 14 | **hers-weight-loss** | 5 | 🟡 PARCIAL | Cloudflare security verification bloqueou |
| 15 | **form-health** | 2 | 🔴 POUCO | Landing → "Take the Quiz" CTA mas crawler não conseguiu prosseguir |
| 16 | **klinio** | 1 | 🔴 POUCO | Redirecionou para pt-BR e travou |
| 17 | **nutrisystem** | 1 | 🔴 POUCO | **Access Denied** (Akamai bot detection) |
| 18 | **ro-body** | 1 | 🔴 POUCO | "One small step before we welcome you back." (geo-block) |
| 19 | **platejoy** | 0 | ❌ FALHOU | Site não carregou |

---

## Cobertura por bloco psicológico (em pelo menos 1 quiz capturado)

| Bloco | Cobertura | Marcas com dado verbatim |
|---|---|---|
| **Objetivo de alto nível** | ✅ EXCELENTE | Noom, DoFasting, BetterMe, Unimeal, Lifesum |
| **Gênero/Sexo** | ✅ EXCELENTE | Noom (sex + gender identity), DoFasting, BetterMe, Unimeal, Lasta |
| **Idade** | ✅ EXCELENTE | Noom (decade), Unimeal (granular), BetterMe (4 bandas), WeightWatchers, MuscleBooster, Simple |
| **Altura/Peso** | ✅ BOA | Noom, DoFasting, Unimeal |
| **Condições médicas** | ✅ BOA | Noom (extensivo) |
| **Body type / build** | ✅ BOA | BetterMe (Slender/Medium/Stocky/Overweight) |
| **Body goal/aspiração** | ✅ BOA | BetterMe (Athletic/Ripped/Swole), DoFasting (areas) |
| **Hábitos alimentares** | ✅ BOA | DoFasting (carbs, meals, diets, bad habits multi-select) |
| **Sono** | ✅ BOA | DoFasting |
| **Atividade física** | ✅ BOA | DoFasting |
| **Hidratação** | ✅ BOA | DoFasting |
| **Eventos causando ganho** | ✅ EXCELENTE | BetterMe (divórcio, covid, financeiro, etc.) |
| **Identidade metabólica** | ✅ BOA | BetterMe ("I gain fast lose slow") |
| **Nostalgia/ancoragem temporal** | ✅ BOA | BetterMe ("How long ago were you in best shape?") |
| **Familiaridade com método** | ✅ BOA | DoFasting (IF knowledge) |
| **Cohort segmentation** | ✅ BOA | WeightWatchers ("tried WW before?") |
| Email gate | ❌ Não capturado | — |
| Behavioral profile (sliders) | ❌ Não capturado | — |
| Loading screens | ❌ Não capturado | — |
| Email gate copy | ❌ Não capturado | — |
| Paywall copy | ❌ Não capturado | — |

**Conclusão:** Capturamos ACT 1 (compromisso) e ACT 2 (dor/identidade) bem. **Faltam ACT 3-5 (projeção, processing theater, paywall)** — estes precisam de captura manual ou ajustes no crawler.

---

## Próximos passos para 100% de cobertura

### Curto prazo (1-2h)
1. **Captura manual de 3 funis para os blocos faltantes:** Noom, BetterMe, DoFasting — ir até o paywall
2. **Captura específica das tela de email gate / loading / paywall** desses 3
3. **Validar visualmente** os screenshots capturados (alguns podem ter elementos sobrepostos)

### Médio prazo (4-6h se quiser)
4. **Ajustes no crawler** para superar:
   - Cookie consent banners (Lifesum)
   - Language selectors (Simple)
   - Cloudflare verification (Hers, Nutrisystem)
   - Geo-blocks (Ro Body)
5. **Re-run dos quizzes bloqueados** com fixes

### Decisão estratégica
**O que temos já é suficiente para definir a estrutura do quiz Deimos.** Mais dados são "nice to have", não "must have". Recomendo seguir para construção do quiz Deimos baseado no que está documentado.

---

## Arquivos detalhados por marca

✅ `noom.md` — 13 telas analisadas profundamente
✅ `dofasting.md` — 23 telas analisadas profundamente
✅ `betterme.md` — 14 telas analisadas profundamente
✅ `unimeal.md` — 12 telas analisadas
✅ `weightwatchers.md` — 9 telas analisadas
✅ `simple.md` — 6 telas (parcial)
✅ `fastic.md` — referência (não estava na lista A, dados de secondary source)

🟡 Arquivos `.md` ainda a criar para: muscle-booster, eat-this-much, lifesum, reverse-health (quando vale a pena pelo pouco capturado)

---

## Como reproduzir

```bash
# Rodar 1 quiz
npx tsx scripts/quiz-crawler.ts <slug> <url> --headless

# Rodar batch dos 19
npx tsx scripts/quiz-batch.ts

# Gerar dump consolidado dos manifests
npx tsx scripts/quiz-extract.ts
```

Output: `research/quiz-analysis/quizzes_raw/screenshots/<slug>/`
