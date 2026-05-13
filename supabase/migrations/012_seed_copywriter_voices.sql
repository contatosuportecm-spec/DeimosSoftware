-- ═══════════════════════════════════════════════════════════════════
-- SEED: 7 vozes de copywriters lendários (kind=voice)
-- Fonte: domínio público + obras canônicas (Boron Letters, Tested Adv,
-- Breakthrough Advertising, Scientific Advertising, AdWeek Handbook, etc.)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO wiki_pages (slug, kind, title, summary, body_md, niches, tags, confidence, structured) VALUES

-- ─── 1. Gary Halbert ───────────────────────────────────────────────
('voice--gary-halbert', 'voice', 'Gary Halbert',
 'O Príncipe do Print. Mestre da carta de vendas direta, conversacional e visceralmente humana.',
 '# Gary Halbert — O Príncipe do Print

**Período de atuação:** 1965–2007. Autor das *Boron Letters*, criador de cartas de vendas que fizeram dezenas de milhões em vendas (Tova, Coat-of-Arms, etc).

## Estilo

Conversacional, agressivo, terra-a-terra. Halbert escreve **como se estivesse conversando com um amigo num bar**, não como vendedor de palco. Frases curtas. Parágrafos de uma linha. Ênfase visual brutal (sublinhado, negrito, P.S.).

## Princípios centrais

- **"You can''t bore people into buying something"** — o crime maior é ser chato.
- **A-pile vs B-pile** — uma carta tem 2 segundos pra parar a triagem entre lixo e leitura. Headline + envelope + abertura definem.
- **Starving crowd** — antes de copy, mercado faminto. Não vende neve pra esquimó.
- **Specificity beats hype** — "$1.247,93 em 8 dias" > "muito dinheiro rápido".
- **AIDA na unha** — Attention, Interest, Desire, Action. Sem atalho.

## Estrutura típica de lead (carta de vendas)

1. **Hook visceral** — afirmação chocante, pergunta intrigante ou cena visual.
2. **Identificação de problema** — descreve a dor literal do leitor, em primeira pessoa.
3. **Antagonista** — "eles" (indústria, médicos, governo, gurus) escondem isso.
4. **Big reveal** — o segredo/mecanismo único.
5. **Prova social/credibilidade** — depoimentos crus, estudos, números.
6. **Oferta com risco invertido** — garantia agressiva.
7. **Urgência genuína** — escassez real, não inventada.
8. **P.S. matador** — reforça a oferta + adiciona último gancho.

## Quando usar Halbert

- Produtos de **dor profunda** (saúde, dinheiro, relacionamento).
- Públicos **cínicos** que já viram tudo.
- Cartas longas de **conversão alta** (VSL longa, sales letter de email).
- Quando você precisa **soar humano** num mar de copy de IA.

## Frases que o definem

> "Sell people what they want, not what they need."
>
> "The only purpose of the first sentence is to get the second sentence read."
>
> "Test, test, test. The market is always smarter than you."

## Vocabulário típico

"Listen up", "Look", "Now here''s the thing", "I''ll be straight with you", "Between you and me", "Don''t kid yourself".

## Frameworks dele já catalogados

- Ver: `framework--halbert-lead-structure`
- Ver: `pattern--ps-matador-halbert`',
 ARRAY['emagrecimento','saude-masculina','renda-extra','geral'],
 ARRAY['copywriter','direct-response','sales-letter','vsl'],
 0.95,
 '{"era":"1965-2007","best_for":["saude","dinheiro","relacionamento"],"intensity":"alta","formality":"baixa"}'::jsonb
),

-- ─── 2. John Caples ────────────────────────────────────────────────
('voice--john-caples', 'voice', 'John Caples',
 'O cientista das headlines. Autor de "Tested Advertising Methods". Headlines mensuráveis, testadas, repetíveis.',
 '# John Caples — O Cientista das Headlines

**Período:** 1925–1990. Vice-presidente da BBDO. Autor de *Tested Advertising Methods* (1932) — bíblia do split-test antes de existir esse termo.

## Estilo

Frio, mensurável, científico. Caples é o oposto do Halbert: **não confia em opinião, confia em teste**. Famous quote: *"On the average, headlines that contain news are 22% more effective than headlines that don''t."*

## Princípios centrais

- **Headline carrega 80% do peso.** Mude só ela e o anúncio dobra ou some.
- **Self-interest sempre vence.** O leitor não liga pra você, liga pra ele.
- **News > clever.** "Anúncio espertinho" perde de "anúncio noticioso".
- **Specific > vague.** Números, datas, locais.
- **Test everything.** Nada é sagrado até split-testar.

## Os 5 tipos de headline que funcionam (Caples)

1. **News headline** — "Apresentamos...", "Novo...", "Descoberto..."
2. **How-to headline** — "Como [resultado desejado] em [tempo curto]"
3. **Curiosity headline** — "O segredo que [autoridade] usa pra..."
4. **Question headline** — "Você comete esses erros em [área]?"
5. **Command/Why headline** — "Pare de [dor]" / "Por que [problema] acontece..."

## A headline mais famosa que ele escreveu

> "They Laughed When I Sat Down at the Piano — But When I Started to Play!"

Anúncio do U.S. School of Music, 1927. Estrutura: **cena social + reversão de status**. Esse padrão virou template até hoje.

## Quando usar Caples

- Topo de funil (anúncio Meta/Google).
- Headlines de quiz/landing.
- Subject lines de email.
- Quando o público é amplo e você precisa de **clareza máxima**.

## Vocabulário típico

"Apresentamos", "Descoberto", "Como", "Por que", "Anúncio importante para [grupo]", "Atenção", "Agora você pode".

## Frameworks dele

- Ver: `framework--how-to-headline`
- Ver: `framework--quem-mais-headline`
- Ver: `concept--headline-self-interest`',
 ARRAY['emagrecimento','saude-masculina','renda-extra','beleza','geral'],
 ARRAY['copywriter','headline','testing','direct-response'],
 0.95,
 '{"era":"1925-1990","best_for":["headlines","print-ads","email-subjects"],"intensity":"media","formality":"media"}'::jsonb
),

-- ─── 3. Eugene Schwartz ────────────────────────────────────────────
('voice--eugene-schwartz', 'voice', 'Eugene Schwartz',
 'O filósofo do mercado. Autor de "Breakthrough Advertising" — o livro mais importante de copy já escrito.',
 '# Eugene Schwartz — O Filósofo do Mercado

**Período:** 1950–1995. Autor de *Breakthrough Advertising* (1966). Considerado por Halbert, Bencivenga e Kennedy como o copywriter mais cerebral da história.

## Estilo

Erudito, estratégico, denso. Schwartz **não fala sobre técnica de palavras** — fala sobre **leitura de mercado e estado mental do leitor**. Copywriter de alta-cultura.

## Princípio central — Os 5 níveis de consciência

O leitor está em UM destes 5 níveis ao ler seu anúncio. **A mesma headline funciona pra um nível e mata noutro.**

1. **Mais consciente** — sabe do produto, sabe que funciona. Headline: oferta + desconto.
2. **Consciente do produto** — sabe que existe, não sabe se quer. Headline: prova/diferencial.
3. **Consciente da solução** — sabe que solução existe, não conhece a sua. Headline: novo mecanismo.
4. **Consciente do problema** — sabe que tem o problema, não sabe que tem solução. Headline: promessa/intriga.
5. **Inconsciente** — não sabe nem que tem o problema. Headline: identificação/curiosidade.

Saber o nível = saber qual ângulo usar.

## Princípio dos 3 estágios de mercado

1. **Estágio 1:** mercado virgem. Apresente o produto direto. ("A nova pasta de dente que limpa")
2. **Estágio 2:** mercado familiarizado. Adicione promessa. ("A pasta que clareia em 7 dias")
3. **Estágio 3:** mercado saturado. **Novo mecanismo.** ("Pasta com fluor cristalino que clareia em 7 dias enquanto você dorme")
4. **Estágio 4:** mercado cético. Ataque elevado + prova. ("Como dentistas estão revertendo amarelamento que pastas comuns CAUSAM")
5. **Estágio 5:** mercado morto. Identificação + ressurgimento via avatar.

> **Quanto mais saturado o mercado, mais você precisa de mecanismo único + ataque elevado.**

## Quando usar Schwartz

- Antes de qualquer copy: **diagnosticar o nível** do leitor.
- Quando o nicho está saturado e você precisa virar a chave.
- Estratégia de big idea / posicionamento de oferta.

## Vocabulário/conceitos

"Mass Desire", "Channelization" (canalizar desejo existente, não criar), "Sophistication", "Awareness", "Identification".

## Frameworks dele

- Ver: `framework--niveis-consciencia-schwartz`
- Ver: `framework--estagios-mercado-schwartz`
- Ver: `concept--big-idea`',
 ARRAY['emagrecimento','saude-masculina','renda-extra','beleza','relacionamento','geral'],
 ARRAY['copywriter','estrategia','big-idea','niveis-consciencia'],
 0.95,
 '{"era":"1950-1995","best_for":["estrategia","big-idea","mercado-saturado"],"intensity":"alta-mental","formality":"alta"}'::jsonb
),

-- ─── 4. Joe Sugarman ───────────────────────────────────────────────
('voice--joe-sugarman', 'voice', 'Joe Sugarman',
 'Mestre do "Slippery Slide". Pioneiro do print mail-order. Autor do AdWeek Copywriting Handbook.',
 '# Joe Sugarman — O Slippery Slide

**Período:** 1960–2020. Fundador da JS&A. Criou o BluBlocker, vendeu 20M+ unidades só por copy. Autor do *AdWeek Copywriting Handbook*.

## Estilo

Conversacional, racional, **engenhoso**. Sugarman é o copywriter que **te faz seguir lendo sem perceber**.

## Princípio central — O Slippery Slide

> "All the elements in an ad have one purpose and one purpose only — to get you to read the FIRST SENTENCE of the copy. And the only purpose of the first sentence is to get you to read the next sentence. And so on..."

Cada frase serve uma função: empurrar o olho pra próxima. Uma única frase que quebra o ritmo = leitor sai.

## 30 Gatilhos psicológicos (resumo)

Sugarman catalogou 30 gatilhos. Os 8 mais usáveis:

1. **Sense of involvement** — faça o leitor mentalmente participar (visualizar usando o produto).
2. **Honesty** — admita uma falha pequena ("Esse produto não é pra todo mundo. Mas se você...").
3. **Credibility** — fontes específicas, números exatos, datas.
4. **Storytelling** — abertura sempre em narrativa pessoal.
5. **Authority** — não "especialistas dizem", **"o Dr. X da Universidade Y, em estudo Z..."**
6. **Satisfaction conviction** — afirme com tanta confiança que vira fato.
7. **Sense of urgency** — escassez real (estoque, prazo, lote).
8. **Linking** — conecte o produto a algo que o leitor já valoriza.

## Estrutura típica de Sugarman

1. **Headline visual + curiosa** (não vendedora ainda).
2. **Subheadline esclarecedora.**
3. **Frase 1 curta, intrigante** — "I''ll be honest with you."
4. **Storytelling em primeira pessoa** (3-5 parágrafos).
5. **Transição pro produto** via problema vivido na história.
6. **Demonstração técnica** (Sugarman ADORA explicar engenharia).
7. **Oferta + bônus + garantia.**
8. **CTA com call-to-action específico.**

## Quando usar Sugarman

- Produtos com **mecanismo demonstrável** (suplemento com ingrediente, gadget com tecnologia).
- Públicos **racionais/técnicos** que querem entender antes de comprar.
- VSLs com componente educacional.
- Quando você quer **soar honesto e não vendedor**.

## Frases típicas

"I''ll be honest with you", "Now here''s the thing", "Let me explain", "And that''s when it hit me", "Picture this".

## Frameworks dele

- Ver: `framework--slippery-slide`
- Ver: `concept--linking-trigger`
- Ver: `pattern--story-lead-sugarman`',
 ARRAY['saude-masculina','renda-extra','beleza','geral'],
 ARRAY['copywriter','slippery-slide','psychological-triggers'],
 0.95,
 '{"era":"1960-2020","best_for":["mail-order","gadgets","supplements","tech-products"],"intensity":"media","formality":"media-baixa"}'::jsonb
),

-- ─── 5. Dan Kennedy ────────────────────────────────────────────────
('voice--dan-kennedy', 'voice', 'Dan Kennedy',
 'O bruto. Direct response info-marketing. Autor da série "No B.S.". Magnetic Marketing.',
 '# Dan Kennedy — O Bruto do Direct Response

**Período:** 1975–presente. Fundador do GKIC/Magnetic Marketing. Treinou Frank Kern, Russell Brunson, Ryan Deiss. Autor de 20+ livros (*No B.S. Direct Marketing*, *Magnetic Marketing*).

## Estilo

Direto, abrasivo, professoral. Kennedy **não tem paciência pra firula**. Estilo "vou te ensinar o jeito certo, fim de papo".

## Princípios centrais

- **Message-Market-Media** (triângulo MMM) — alinhe mensagem ao mercado e à mídia ou queima dinheiro.
- **Specificity** acima de tudo — "$2.847 a mais por mês" > "ganhe mais".
- **Lista é o ativo** — sua lista de compradores vale mais que o produto.
- **Ofereça pra quem QUER** — não convença duvidosos, busque os que já decidiram.
- **Pricing & positioning** — preço alto + posicionamento de autoridade > volume.
- **Long copy sells** — quem fala que copy longa não vende nunca testou.

## Estrutura "Magnetic Marketing"

1. **Lead magnet** (atrai)
2. **Tripwire** (qualifica com micro-compra)
3. **Core offer** (vende a real)
4. **Profit maximizer** (upsell/continuity)
5. **Return path** (re-engajamento)

## Quando usar Kennedy

- Info-products (cursos, ebooks, masterminds).
- Negócios B2B / serviços de alto ticket.
- Coaches/consultores se posicionando.
- Quando o tom é **autoridade incontestável + comunidade exclusiva**.

## Frases típicas

"Look", "Listen up", "Here''s the bottom line", "And by the way", "Frankly", "I''ll tell you what works and what doesn''t".

## Vocabulário/conceitos

"Suspect → prospect → buyer → multi-buyer", "Affinity → familiarity → trust → commerce", "Premium pricing", "Velvet rope policy".

## Frameworks dele

- Ver: `framework--magnetic-marketing-funnel`
- Ver: `concept--message-market-media`
- Ver: `concept--specificity-kennedy`',
 ARRAY['renda-extra','geral'],
 ARRAY['copywriter','info-marketing','high-ticket','authority'],
 0.92,
 '{"era":"1975-presente","best_for":["info-products","coaching","b2b","high-ticket"],"intensity":"alta","formality":"alta"}'::jsonb
),

-- ─── 6. Gary Bencivenga ────────────────────────────────────────────
('voice--gary-bencivenga', 'voice', 'Gary Bencivenga',
 'O "King of Copy". 40 anos invicto em split-tests. Mestre da credibilidade e da prova.',
 '# Gary Bencivenga — O King of Copy

**Período:** 1970–2009. 40 anos como copywriter freelancer com taxa de sucesso surreal em split-tests. Aposentado com os famosos *Bencivenga Bullets*. Considerado por muitos **o maior copywriter vivo de sua era**.

## Estilo

Calmo, sóbrio, **maciço em prova**. Bencivenga **não grita, não chocheia, não força urgência fake**. Persuade pela acumulação imparável de evidência.

## Princípios centrais

- **"The more you tell, the more you sell"** — copy longa funciona se for relevante.
- **Credibilidade é tudo.** Sem prova, todo argumento é fricção.
- **Argument > emotion** (controverso entre copywriters, mas Bencivenga prova).
- **Vivid demonstration** > claim seca. Mostre, não fale.
- **"Don''t sell, give proof"** — sua copy não vende, ela documenta.

## Os 4 elementos não-negociáveis de Bencivenga

1. **Promise** — específica, mensurável, urgente.
2. **Picture** — vívida, sensorial, em primeira pessoa.
3. **Proof** — irrefutável (números, fontes, demonstração).
4. **Push** — risco invertido + scarcity + facilidade de ação.

## Frameworks de prova (Bencivenga Bullets)

- **The thrust** — afirmação direta, sem rodeio.
- **Comparative** — "Como X, mas Y vezes melhor".
- **The fascinator** — gera curiosidade impossível de resistir.
- **The reason why** — "Porque" + razão lógica = compliance automática.

Exemplo de bullet famoso:
> *"Why French women, who consume the highest dairy fat per capita in Europe, have the lowest heart-attack rate. The dietary secret on page 47..."*

## Quando usar Bencivenga

- **Públicos céticos** (médicos, engenheiros, investidores).
- Produtos onde a **alegação parece grande demais** — precisa de prova.
- Mercados **maduros/saturados** (Schwartz nível 4-5).
- Copy longa de **alta voltagem intelectual**.

## Frases típicas

"Consider this", "The evidence is overwhelming", "Here is the proof", "Why? Because...", "Study after study confirms".

## Frameworks dele

- Ver: `framework--bencivenga-bullets`
- Ver: `concept--proof-stack`
- Ver: `concept--reason-why-copy`',
 ARRAY['saude-masculina','emagrecimento','renda-extra','geral'],
 ARRAY['copywriter','proof','long-copy','direct-response'],
 0.94,
 '{"era":"1970-2009","best_for":["saude","financeiro","public-cetico","long-copy"],"intensity":"media","formality":"alta"}'::jsonb
),

-- ─── 7. Claude Hopkins ─────────────────────────────────────────────
('voice--claude-hopkins', 'voice', 'Claude Hopkins',
 'O pai da publicidade científica. Autor de "Scientific Advertising" (1923). Base de tudo que veio depois.',
 '# Claude Hopkins — O Pai da Publicidade Científica

**Período:** 1907–1932. Autor de *Scientific Advertising* (1923) — David Ogilvy disse: *"Nobody should be allowed to have anything to do with advertising until he has read this book seven times."*

## Estilo

Spartano, factual, **terra-firme**. Hopkins escreveu em 1900s mas seus princípios envelheceram melhor que 99% do que veio depois.

## Princípios centrais

- **Advertising is salesmanship in print.** Multiplicado. Sem mais, sem menos.
- **The reason-why ad.** Toda alegação precisa de motivo. Sem porque, sem compra.
- **Be specific.** Pepsodent removia "filme" dos dentes. Não "limpava". O específico vende.
- **Sampling & couponing.** Hopkins criou o coupon test moderno — split-test antes de existir Google.
- **No clever.** Anúncio espertinho perde de anúncio claro. Sempre.

## Famous campaigns

- **Pepsodent** — criou o conceito de "filme nos dentes" (problema invisível → demanda).
- **Schlitz beer** — descreveu o processo industrial em detalhe enquanto todo cervejeiro fazia o mesmo (mas só Schlitz contou).
- **Palmolive** — "Keep that schoolgirl complexion."

## Lições eternas

1. **Antes de copy, mecanismo único** (Hopkins inventou isso 60 anos antes de Schwartz).
2. **Demonstre como, não fale o que.**
3. **Specifics venceram generalities desde 1920** e vai vencer até 2120.
4. **Teste tudo. Achismo mata negócios.**

## Quando usar Hopkins

- Quando você quer **voltar ao básico**. Antes de inventar moda, lembre Hopkins.
- Produtos onde **demonstrar o processo** vende (suplementos, gadgets, alimentos).
- Estudo fundamental pra qualquer copywriter — **leia 7 vezes** (Ogilvy).

## Frases típicas

"Here''s the reason why...", "We do X (specific process)", "Free trial — pay only if satisfied".

## Frameworks dele

- Ver: `framework--reason-why-hopkins`
- Ver: `concept--preemptive-claim`',
 ARRAY['emagrecimento','saude-masculina','geral'],
 ARRAY['copywriter','foundation','scientific-advertising'],
 0.95,
 '{"era":"1907-1932","best_for":["foundation","reason-why","mecanismo-unico"],"intensity":"baixa","formality":"alta"}'::jsonb
);
