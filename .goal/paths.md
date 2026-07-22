# .goal/paths.md — Fontes de verdade resolvidas

| Fonte | Caminho real | Autoridade sobre |
|---|---|---|
| Sistema de quizes | `types/funnels.ts` (schema `quiz_question`) + Supabase `funnels/funnel_nodes/funnel_edges` + funil "Quiz 1" (`026ce1e4-805a-431b-a177-b8cd8cd7606c`) já no schema | COMO escrever: `quiz_question.content = { question, question_type: open\|button\|scale, options:[{id,label}] }` |
| Referências de quiz | `research/quiz-analysis/analise_consolidada.md` + `insights_estrategicos.md` (18 marcas: noom, betterme, dofasting, unimeal, weightwatchers…) | ESTRUTURA persuasiva: ACT1 demografia+compromisso → ACT2 identidade+dor → ACT3 aprofundamento+aspiração → email gate → loading → ACT4 resultado segmentado. Alvo 22-25 telas. |
| Identidade visual | `CLAUDE.md` + `tailwind.config.ts` + `app/layout.tsx` | APARÊNCIA: dark-only, bg-0..5 (#000→#35353A), amber #F4C430 (autoridade), ember #FF8A1F (CTA), ai-blue #5B8CFF, success #34D399, danger #FF5C5C; fontes Poppins (UI) / Playfair Display (headline) / DM Mono (números); raios 4/8/12/16; labels uppercase tracking wide |
| Oferta | `templates/briefing-truque-do-cafe.json` + conteúdo do "Quiz 1" extraído do Supabase | CONTEÚDO: Truque do Café · emagrecimento · R$37 · mulher 35-55 pré/menopausa · promessa "7kg em 20 dias" · mecanismo "desinflamar/acelerar metabolismo com café" · protocolo "Ritual Matinal" |

**Precedência:** Sistema > Oferta > Referências > Visual.

## Decisões (documentadas, tomadas sem bloqueio)
- **Base de conteúdo** = funil "Quiz 1" (já é a oferta Truque do Café no schema do sistema) reorganizado no esqueleto das referências + telas placeholder finalizadas (loading, quebra de objeção com o truque, resultado segmentado).
- **Entrega** = app HTML/CSS/JS vanilla em `quiz-truque-do-cafe/` (conforme §2 do /goal).
- **Identidade visual** = DEIMOS (única documentada no repo). `tokens.css` = cópia literal dos tokens do `tailwind.config.ts`.
- **Destino do lead** = configurável (`CONFIG.checkoutUrl` / `CONFIG.leadWebhook`) — não inventado; placeholder editável + `track('lead_submit')`.
