# Quiz — Truque do Café

Quiz de qualificação/segmentação da oferta **Truque do Café** (emagrecimento, R$37).
Conteúdo seguindo o schema do DeimosSoftware; estrutura persuasiva das referências
(`research/quiz-analysis/`); identidade visual DEIMOS (dark / amber / ember).
Vanilla HTML+CSS+JS, **sem build step**.

## Como rodar
Abra `index.html` no navegador (duplo clique). Sem servidor, sem npm.
> `sessionStorage` só persiste via `http://`/`https://` — sirva com `python3 -m http.server` se quiser testar o "recarregar não perde progresso".

## Como editar as perguntas
Tudo vive em **`js/quiz-data.js`** (única fonte de conteúdo). Cada tela é um objeto em `QUIZ.steps`.
Trocar/adicionar pergunta = editar só esse arquivo. Nunca há texto de pergunta no HTML/CSS.
Cada pergunta espelha o schema `quiz_question` (`{ question, question_type: open|button|scale, options:[{id,label}] }`).

## Como plugar tracking
Eventos passam por `track(event, payload)` (engine.js) → `window.dataLayer` + evento `quiz:track`.
Ganchos: `quiz_start`, `quiz_resume`, `quiz_step`, `lead_submit`, `quiz_complete`, `cta_click`.
Destino do lead e checkout: `QUIZ.config` em `quiz-data.js` (`checkoutUrl`, `leadWebhook`).

## Arquitetura (dados separados de renderização)
- `js/quiz-data.js` — conteúdo (fonte)
- `js/engine.js` — estado, navegação, ramificação, validação, progresso, persistência, tracking
- `js/render.js` — monta o DOM a partir dos dados
- `js/result.js` — segmentação (perfil) + projeção + CTA
- `css/tokens.css` — únicos valores literais da identidade visual
- `css/quiz.css` — layout/componentes (só `var(--token)`)
