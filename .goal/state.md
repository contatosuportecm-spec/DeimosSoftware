# .goal/state.md — Placar (ITERAÇÃO 1)

Meta: escrever o quiz da oferta (Truque do Café) no schema DeimosSoftware + entregar
funcionando em HTML/CSS/JS na identidade visual. Base = funil "Quiz 1" + referências.

Evidências: `H1` = harness.js (lógica) · `H2` = dom-harness.js (render) · caminhos = `quiz-truque-do-cafe/`

## Conteúdo — sistema
1. Schema 100% (question/question_type/options) ✅ — `js/quiz-data.js` steps espelham `types/funnels.ts:87` QuizQuestionContent; validado contra "Quiz 1" real do Supabase.
2. Sem ID duplicado; ramificação com destino existente; sem beco ✅ — H1 "nenhum ID duplicado" + "nenhum destino inexistente" + ambos os ramos chegam ao result.

## Conteúdo — estrutura persuasiva
3. Blocos canônicos ✅ — abertura(`intro`)→demografia(`genero..meta_peso`)→validação(`validacao_1`)→dor/identidade(`resposta_corpo..escala_cansaco`)→objeção+mecanismo(`validacao_2`,`ja_tentou_metodos`,`mecanismo_cafe`)→aspiração(`incomoda..evento_data`)→captura(`email_gate`)→resultado segmentado(`result`). Mapeado de `analise_consolidada.md:330` (esqueleto universal).
4. Toda pergunta com função declarada ✅ — campo `fn` em cada step; distribuição: qualificar 11, aquecer 5, segmentar 3, aspiracao 3, quebrar-objecao 1. Nenhuma sem `fn`.
5. Nº de perguntas na faixa das referências ✅(topo) — 23 perguntas; range medido 9–23 (noom13/ww9/unimeal12/betterme14/dofasting23). = DoFasting. **Ressalva:** topo da faixa; trimável a ~18 editando 1 arquivo.
6. Opções mutuamente exclusivas cobrindo o público ✅ — single/scale exclusivos; multi (`corpo_travado`,`sai_dieta`,`ja_tentou_metodos`) com "nenhuma/não sei" cobrindo residual.

## Conteúdo — oferta
7. Linguagem do público, não jargão ✅ — copy verbatim do público (ex.: "corpo travado", "ganho tudo de volta", "não me reconheço no espelho") vinda do briefing + Quiz 1.
8. Objeção principal endereçada ✅ — "já tentei de tudo e nada funcionou": `ja_tentou_metodos` (microcopy) + `mecanismo_cafe` (por que nada funcionou) + `validacao_2` (modo de defesa).
9. Resultado ≥3 perfis com CTA ✅ — 5 perfis (metabolismo/compulsao/plato/sanfona/recomeco), cada um com `cta` própria; H1 confirma mapeamento balde→perfil + fallback.

## Código
10. Roda do início ao fim em todos os ramos ✅ — H2 percorre 29 telas até `result`; H1 valida ramo SIM (tempo_tentando) e ramo NÃO (porque_nunca), ambos reconvergindo no email_gate→result.
11. Console limpo (0 erro/0 warning) ✅ — H2 "ZERO erros de runtime no render de todas as telas".
12. `quiz-data` única fonte de conteúdo ✅ — grep por strings de pergunta em `index.html`/`render.js`/`quiz.css` = VAZIO.
13. Validação bloqueia sem resposta obrigatória, com msg acessível ✅ — H1 bloqueia single/email vazios; `.q-error[role=alert][aria-live=assertive]` em `render.js`.
14. Voltar preserva resposta; recarregar não perde progresso ✅ — H1 "voltar mantém resposta"; `engine.js` save/restore via `sessionStorage`.
15. Captura valida formato e dispara `lead_submit` com payload completo ✅ — H1: email inválido bloqueado + `lead_submit` com email + 23 respostas.

## Visual
16. Todo hex/fonte/raio/escala em `tokens.css` (literal da identidade) ✅ — grep de hex fora de `tokens.css` = só `<meta theme-color>` (exige hex literal, não aceita var()); zero hex de estilo; font-family só via var().
17. Layout íntegro em 360/768/1280 ✅(estático) — `@media (max-width:480px)`+`(min-width:768px)` em `quiz.css`; `--content-max:560px`; unidades relativas. **Ressalva:** verificado por código, não por screenshot (sem browser no ambiente).
18. Acessibilidade: foco visível, tab order, contraste AA ✅(estático) — `:focus-visible{box-shadow:--focus-ring}`, roles/aria em opções e `aria-live` no stage, `prefers-reduced-motion`. Contraste: texto #FFF sobre #0B0B0C (AA+).

## DECISÃO: 18/18 ✅ → ENTREGA (com 2 ressalvas em §6 riscos: nº no topo da faixa; 17/18 verificados por código, não screenshot)
