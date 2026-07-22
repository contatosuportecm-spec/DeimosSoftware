# Quiz — Truque do Café

Funil de quiz em HTML/CSS/JS vanilla. Sem build, sem npm, sem framework: abre
direto via `file://` ou servido por qualquer HTTP estático.

## Como rodar

```bash
# opção 1: abrir direto
open index.html

# opção 2: servir por http (recomendado para testar sessionStorage/webhooks)
python3 -m http.server 8080
# → http://localhost:8080
```

## Arquitetura

```
index.html          esqueleto estático (header + stage) e ordem dos scripts
css/tokens.css      ÚNICO arquivo com valores literais (cores, px, fontes)
css/quiz.css        layout — consome apenas var(--token)
js/core.js          micro-registry de módulos (QuizApp.define / QuizApp.use)
js/quiz-data.js     TODO o conteúdo: perguntas, perfis, oferta, strings de UI
js/assets.js        logo, ícones e silhuetas em SVG inline (currentColor)
js/dom.js           helpers de DOM (el/richText/trustedSvg — sem innerHTML cru)
js/engine.js        máquina de estados: navegação, branch, validação,
                    progresso por capítulo, persistência, tracking
js/render.js        desenha as telas; componente único de lista de opções
js/result.js        perfil (segmentação), achados, projeção e oferta
```

Módulos declaram dependências explicitamente via `QuizApp.define(nome, use => api)`
— nada de acoplamento por `window.*`. Timers de cada tela vivem num controlador
(`fx`) descartado a cada troca de tela (nenhum timer vaza).

### Gramática de interação (fiel ao spec de referência)

| Tela | Botão? | Comportamento |
|---|---|---|
| Escolha única (● círculo) | não | auto-avança ~260ms após o toque |
| Escala 1–5 | não | auto-avança |
| Múltipla escolha (■ quadrado) | CTA sticky | desabilitado até ≥1 seleção |
| Peso/altura/e-mail | CTA sticky | habilita com valor válido |
| Interstitials | "Continuar" | sem barra de progresso (logo no lugar) |

O delay do auto-avanço é `config.autoAdvanceMs` em `quiz-data.js`.

## Como editar perguntas

Tudo em `js/quiz-data.js` — nenhuma string de pergunta mora em HTML/CSS/JS de
render. Cada step tem:

```js
{ id: "minha_pergunta", chapter: "voce", kind: "single",
  question: "Título com **destaque**",   // ** vira o highlight da headline
  microcopy: "linha de apoio (opcional)",
  options: [ { id: "a", label: "Opção A", icon: "flame" } ] }
```

- `kind`: `single` | `multi` | `scale` | `open` | `email` | `statement` | `loading` | `result`
- `chapter`: um dos ids de `chapters` (alimenta a barra segmentada). Statements
  não têm capítulo — não consomem progresso.
- Ramificação: `branch: { on: { resposta: "step_destino" }, default: "..." }`.
  Alvos exclusivos de branch levam `skipInLinear: true` e apontam o próximo
  passo com `next`.
- `fn` e `question_type` são metadados do schema DeimosSoftware (importação);
  o render não os usa.

## Como plugar tracking

O engine emite: `quiz_start`, `quiz_resume`, `quiz_step`, `lead_submit`,
`quiz_complete`, `cta_click`. Cada evento é entregue por três canais:

1. **`window.dataLayer`** — GTM/Pixel: os eventos são "pushados" prontos.
2. **`CustomEvent "quiz:track"`** — para script próprio:
   ```js
   window.addEventListener("quiz:track", e => console.log(e.detail));
   ```
3. **Webhook de lead** — configure `config.leadWebhook` em `quiz-data.js`;
   `lead_submit` (e-mail + respostas) é enviado via `sendBeacon`/`fetch`.

A URL do checkout fica em `config.checkoutUrl`.

## Como trocar um ícone por foto

Em qualquer opção, troque `icon`/`body` por `image`:

```js
{ id: "oval", label: "Barriga (oval)", image: "img/silhueta-oval.png" }
```

O render prioriza a foto (40×40, cantos arredondados) na calha de ícone.
Ícones disponíveis: chaves de `ICONS` em `js/assets.js`; silhuetas: `BODY`.

## Design

- Paleta oficial (fixa): Espresso `#2B1F1A` · Mocha `#5A4036` · Blush `#EBC7C2`
  · Nude `#F3E6DA` · Gold `#C7A66B` · Poppins.
- Todo valor visual vive em `css/tokens.css`. Para mudar geometria/tipografia,
  edite os tokens — `quiz.css` não tem um único px/hex literal.
- O CTA de compra usa `--buy` (verde): ruptura cromática exclusiva do clique
  que gera receita. Para trocar a cor, edite só esse token.
- Acessível: navegação por teclado (setas nas opções), `aria-live` na troca de
  tela, foco visível, `prefers-reduced-motion`, alvos de toque ≥44px.
