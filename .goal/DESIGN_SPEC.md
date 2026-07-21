# SPEC DE RECODIFICAÇÃO — Quiz "Truque do Café"
Destilado de 228 screenshots de 5 quizzes de referência (Shape de Musa, Lasta, Simple.life, BetterMe, Mães que Treinam), analisados por 4 agentes Opus 4.8 independentes. Onde os 4 convergiram, é LEI.

---

## 0. IDENTIDADE (não negociável — vem da marca, não das referências)
Paleta oficial "Truque do Café":
- Espresso `#2B1F1A` · Mocha `#5A4036` · Blush `#EBC7C2` · Nude `#F3E6DA` · Gold `#C7A66B`
- Fonte: **Poppins** (400/500/600/700/800)
- Logo: monograma T+xícara (SVG já existe em `js/assets.js`)
- Tom: ritual de cuidado, leveza, acolhimento, feminino/premium

**Mapeamento das cores para os papéis que as referências ensinaram:**
| Papel | Token | Regra vinda das referências |
|---|---|---|
| Fundo da página | `--bg` = nude clareado | NUNCA branco puro (BetterMe `#FFFCF5`, Simple `#F4F5F7`) |
| Superfície de escolha | `--surface` = branco | cards "flutuam" sobre o fundo |
| Ação / progresso | `--espresso` | marrom-espresso como o `#311E17` do BetterMe |
| Ênfase persuasiva | `--gold` | 1 expressão por headline, nunca mais |
| CTA de COMPRA (só o final) | `--gold` forte / verde? | **ruptura cromática exclusiva no clique que gera receita** |
| Dor / problema | `--blush` escurecido | agitação de problema |

---

## 1. GRAMÁTICA DE INTERAÇÃO — LEI (4/4 concordam)

```
● círculo  = escolha única   = SEM botão   = AUTO-AVANÇA ao toque
■ quadrado = múltipla escolha = CTA sticky  = exige confirmar (disabled até ≥1)
Likert 1–5                    = SEM botão   = AUTO-AVANÇA
Interstitial                  = CTA ativo   = "Continuar"
Input numérico                = CTA         = habilita com valor válido
```
- **Auto-avanço com delay de ~250–300ms** para o usuário VER a seleção antes da transição.
- O indicador é **decorativo**: o alvo de toque é o card inteiro.
- Botão desabilitado em **cinza-morno quente** (não apagado): sinaliza "falta pouco", não "bloqueado".

---

## 2. GEOMETRIA (média das referências, mobile-first 430px)
| Item | Valor |
|---|---|
| Margem lateral | **20px** constante (tudo alinhado nela) |
| Card de opção — altura | **73–90px** (usar 76px) |
| Card de opção — gap | **12px** |
| Card de opção — radius | **16px** |
| Indicador (círculo/quadrado) | **22px**, à direita ou esquerda, borda 1.5px |
| Calha fixa de ícone | **40px** (texto de todas as opções alinhado no mesmo x) |
| CTA | altura **52px**, pill (radius = metade), sticky no rodapé |
| Header | **55px** |
| Header → título | ~38–46px |
| Título → 1ª opção | ~35–55px |
| Barra de progresso | 4px (Lasta) a 8px (Shape). Usar **6px** |
| Máx. de opções sem scroll | **7** — dimensionar para caber |

**Regra de ancoragem:** conteúdo ancorado ao TOPO, vazio embaixo. **NÃO centralizar verticalmente** — assim, em auto-avanço, o título fica sempre na mesma altura e o olho não se reorienta.

---

## 3. TIPOGRAFIA
| Elemento | Tamanho | Peso | Alinhamento |
|---|---|---|---|
| Título de pergunta | 28px, lh 1.15 | 700 | **centro** |
| Subtítulo/microcopy | 16px | 400 | centro, muted |
| Label de opção | 16px | 600 | **esquerda** |
| Título de interstitial | 28px | 700 | **esquerda** |
| Corpo de interstitial | 17px, lh 1.45 | 400 + 1 trecho 700 | esquerda |
| Rótulo de capítulo | 11px, uppercase, tracking .06em | 700 | centro |
| CTA | 16px | 700 | centro |

**LEI DE ALINHAMENTO (3/4 concordam):** *narração é centralizada, escolha é alinhada à esquerda.* Separação cognitiva instantânea entre "estou lendo" e "estou escolhendo".

**Ênfase:** exatamente **1 expressão em gold por headline**. No corpo, ênfase é **bold na mesma cor**, nunca colorido. Nunca os dois na mesma linha.

---

## 4. PROGRESSO
- **Segmentado por capítulo**, não barra única contínua. BetterMe: 6 segmentos; Simple: 3 blocos + capítulo nomeado.
- **SEM número, SEM %** durante o quiz (só o loading final usa %).
- **Rótulo de capítulo nomeado** acima da barra: `SOBRE VOCÊ` → `SEU HISTÓRICO` → `O QUE TRAVA` → `SEU MOMENTO` → `QUASE LÁ`.
- **Interstitials NÃO consomem progresso e não exibem a barra** (trocam pelo logo). Faz o funil parecer mais curto do que é. (4/4 concordam)

---

## 5. RITMO / ESTRUTURA
- **1 interstitial a cada ~4–5 perguntas** — sem header, sem barra, sem voltar. Devolve empatia/prova e reseta a fadiga.
- Interstitial de **validação espelha a resposta anterior** ("Got it!", "Entendi", "Nós te ouvimos").
- **Prova social cedo** (~3ª tela), personalizada com a resposta imediatamente anterior.
- **Dados sensíveis (peso/altura/idade) no FIM**, após dezenas de microcompromissos.
- Sequência de conversão final: **loading teatral (% + sub-tarefas nomeadas) → diagnóstico com os dados do próprio usuário → antes/depois ou projeção datada → oferta**.

---

## 6. QUALIDADE DE CÓDIGO EXIGIDA (o que o usuário pediu: "mais profissional e clean")
Dívidas atuais a eliminar:
1. `single`/`multi`/`scale` duplicam a montagem de opções → **1 componente de lista parametrizado**
2. Sem auto-avanço → **implementar (lei nº1)**
3. Timers soltos no módulo → **encapsular em um controlador com cleanup**
4. `h()` com `html:` fazendo innerHTML cru → **API explícita e segura** (só SVG confiável de assets)
5. 1 listener por opção → **event delegation** (1 listener no container)
6. `engine`↔`render` acoplados por `window.*` → **módulos com dependência explícita**

Requisitos: Vanilla JS, sem build, abre por `file://`. Dados 100% em `quiz-data.js` (nenhuma string de pergunta em HTML/CSS/render). Todo valor visual via `var(--token)` de `tokens.css` (zero hex fora). Acessível: foco visível, aria, `prefers-reduced-motion`, alvo ≥44px. Sem erro/warning no console.

---

## 7. CONSENSO FINAL (5/5 relatórios) + CONFLITOS RESOLVIDOS

### Unânime nos 5
1. **Escolha única auto-avança sem botão.** Múltipla escolha exige CTA. Sem exceção em nenhum dos 5 quizzes.
2. **O alvo de toque é o card inteiro**; radio/checkbox é decorativo.
3. **Estado selecionado muda a BORDA, não o fundo** (evita "flash" visual).
4. **Interstitial a cada 4–5 perguntas**, sem barra de progresso.
5. **Loading teatral** com % antes do resultado (Mães usa 90% duas vezes; Lasta 18% lento; Simple 4 sub-tarefas).
6. **Diagnóstico devolve as respostas do usuário** como "achados" antes de vender.
7. **CTA de compra numa cor nunca usada no funil** (verde em 3 dos 5) — ruptura cromática no clique que gera receita.

### Conflito: ancorar no topo vs centralizar vertical
- Lasta, BetterMe, Simple, Shape → **ancoram no topo**, vazio embaixo.
- Mães que Treinam → centraliza vertical.
- **DECISÃO: ancorar no topo.** Em auto-avanço o título precisa ficar na MESMA altura entre telas para o olho não se reorientar. 4/5 e a razão técnica ganham.

### Conflito: progresso com número vs sem
- Lasta usa "13 / 30"; os outros 4 não usam número.
- **DECISÃO: sem número.** Usar segmentos por capítulo + rótulo nomeado. Esconde o tamanho do funil.

### Detalhes finais a aplicar
- Progresso **começa em ~7%** (nunca zero) e **termina em ~99%** (nunca 100%).
- Highlight inline com **fundo sólido** só na frase que carrega a promessa — nunca no título inteiro.
- Badge de letra (A/B/C), se usado, **gerar pelo índice renderizado**, nunca fixo no texto (bug real observado nas refs).
- Botão desabilitado em **tom quente lavado**, não cinza morto.
- Emoji nativo é aceitável como ícone (3 dos 5 usam) — barato e alto contraste.
