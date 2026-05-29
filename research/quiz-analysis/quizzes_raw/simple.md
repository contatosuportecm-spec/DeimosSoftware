# Simple App — Quiz Funnel Breakdown

## Metadados
- **URL:** https://simple.life/survey/
- **Data:** 2026-05-27
- **Telas capturadas:** 6 (limited — crawler ficou em "Select your language")
- **Método:** Playwright crawler direto
- **Status:** 🟡 PARCIAL — capturou tela inicial mas travou em seletor de idioma

---

## SEQUÊNCIA REAL CAPTURADA

### Tela 0 — Welcome com banda etária
- **Headline:** "HIT YOUR WEIGHT LOSS GOALS BASED ON YOUR AGE"
- **Opções (verbatim):**
  - "Age: 40–49"
  - "Age: 50-59"
  - "Age: 60-69"
  - "Age: 70-80"
  - "I'm 18-39"
- **Categoria:** Demográfica + Segmentação por idade
- **Insight CRÍTICO:** Note que as bandas começam em 40-49 e a opção "jovem" é o ÚLTIMO botão ("I'm 18-39"). Isso é segmentação PROPOSITAL para o público 40+ — usuários jovens são tratados como menos prioritários. Simple posiciona-se forte como **app para 40+**.

### Tela 1-5 — Loop em "Select your language"
- **Conteúdo:** Lista de idiomas (EN, PT, AR, DA, DE, ...)
- **Bug:** Crawler clicou em "English" mas o seletor não fechou ou não avançou para a próxima tela
- **Status:** Requer captura manual para ver o que vem depois

---

## PADRÕES — SIMPLE ESPECÍFICOS (do pouco capturado)

| Padrão | Texto |
|---|---|
| **Segmentação demográfica AGGRESSIVA no Tela 0** | "Age: 40-49 / 50-59 / 60-69 / 70-80" + "I'm 18-39" como afterthought |
| **Headline em CAPS** | "HIT YOUR WEIGHT LOSS GOALS BASED ON YOUR AGE" |

---

## INSIGHT EM POSICIONAMENTO

Mesmo com pouca extração, é claro que Simple não tenta servir "todos" — é app explicitamente para **40+**. Isso afeta:
- Tom (mais "wisdom-coachy", menos "hustle-fitness")
- Marketing (mensagens sobre menopausa, slow metabolism)
- Pricing (44-60+ tem maior disposição a pagar por saúde)

Para o Deimos: vale considerar **abrir o quiz com uma pergunta que SEGMENTA imediatamente seu público-alvo ideal** (em vez de "sirva todos").

---

## ❌ Requer captura manual

Telas 1+ do quiz Simple. Recomendado: rodar manualmente, capturar:
- Telas sobre intermittent fasting habits
- Como "Avo" (AI coach) aparece
- Email gate
- Paywall (Fortune relatou que não revela preço durante quiz)

## ARQUIVOS
- `screenshots/simple/screen_000.png` a `screen_005.png`
