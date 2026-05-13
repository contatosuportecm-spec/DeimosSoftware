-- ═══════════════════════════════════════════════════════════════════
-- SEED: Biblioteca inicial — mecanismos, frameworks, conceitos, patterns
-- ═══════════════════════════════════════════════════════════════════

-- ─── MECANISMOS (foco emagrecimento — nicho mais explorado em DR BR) ───
INSERT INTO wiki_pages (slug, kind, title, summary, body_md, niches, tags, confidence, structured) VALUES

('mechanism--enzima-do-cafe', 'mechanism', 'Enzima do Café (cafestol/kahweol)',
 'Compostos do café não-filtrado que afetam metabolismo lipídico. Saturação alta em 2026.',
 '# Mecanismo: Enzima do Café (Cafestol/Kahweol)

## O que é
Diterpenos presentes no óleo do grão de café (café fervido/turco/espresso). Influenciam metabolismo de gordura e absorção de açúcar.

## Como funciona (claim seguro)
Auxilia a regulação do metabolismo lipídico. Em estudos, modula receptores PPAR e LXR.

## Proof points
- Estudos de Vaast et al. (Nutrients 2019)
- Café filtrado vs não-filtrado: diferença mensurável em LDL
- Trade-off: cafestol também sobe LDL — usar com moderação

## Como apresentar em copy
"Existe uma enzima escondida no café que seu corpo só absorve se o café for preparado de um jeito específico. E é exatamente isso que [marca asiática/europeia] sabe há séculos."

## Claims seguros (compliance)
- "Auxilia o metabolismo"
- "Contribui para regulação do apetite"
- ❌ EVITAR: "queima gordura", "emagrece X kg", "cura obesidade"

## Saturação
**Alta** — 2024-2026 viu pico no Brasil. Considere mecanismos secundários.

## Variações em uso
- "Café que vira chá"
- "Truque do café"
- "Café preparado como na Espanha"',
 ARRAY['emagrecimento'],
 ARRAY['cafe','metabolismo','suplemento'],
 0.85,
 '{"saturation":"alta","last_seen":"2026-04","proof_strength":"media","compliance_risk":"baixo","niches_active":["emagrecimento"]}'::jsonb
),

('mechanism--microbiota-intestinal', 'mechanism', 'Microbiota Intestinal',
 'Bactérias intestinais como mecanismo "novo" para emagrecimento — proof clínico forte, saturação média.',
 '# Mecanismo: Microbiota Intestinal

## O que é
Comunidade de bactérias no intestino. Razão Firmicutes/Bacteroidetes correlaciona com peso corporal em estudos clínicos.

## Como funciona
- Bactérias "ruins" extraem 10-15% mais calorias do mesmo alimento
- Probióticos específicos (Akkermansia muciniphila, L. gasseri) reduzem ganho de peso em ensaios
- "Eixo intestino-cérebro" regula saciedade via GLP-1 endógeno

## Proof points
- Cani et al. (Nature 2007+)
- Estudos com Akkermansia em humanos (2019)
- Liga direta com GLP-1 endógeno → tendência super atual

## Como apresentar em copy
"Você pode comer SALADA o dia inteiro e não emagrecer — porque o problema não está na comida. Está em quem digere ela. Cientistas descobriram que mulheres acima dos 40 perdem uma bactéria específica chamada [nome] que..."

## Claims seguros
- "Auxilia equilíbrio da flora intestinal"
- "Contribui para sensação de saciedade"
- ❌ EVITAR: alegações de cura, comparação com medicamentos

## Saturação
**Média** — ainda funciona em 2026, especialmente para mulheres 40+.

## Variações
- "Bactéria do emagrecimento"
- "Flora reset"
- "GLP-1 natural"',
 ARRAY['emagrecimento','saude-masculina'],
 ARRAY['microbiota','probiotico','glp1','intestino'],
 0.90,
 '{"saturation":"media","last_seen":"2026-05","proof_strength":"alta","compliance_risk":"baixo","niches_active":["emagrecimento"]}'::jsonb
),

('mechanism--adiponectina', 'mechanism', 'Adiponectina (hormônio da queima)',
 'Hormônio produzido por tecido adiposo. Baixa saturação, proof clínico bom — oportunidade clara.',
 '# Mecanismo: Adiponectina

## O que é
Hormônio proteico secretado pelo tecido adiposo. Quanto mais gordura visceral, MENOS adiponectina o corpo produz (inverso intuitivo).

## Como funciona
- Aumenta sensibilidade à insulina
- Estimula oxidação de ácidos graxos
- Suprime gliconeogênese hepática
- Anti-inflamatório sistêmico

## Proof points
- Yamauchi et al. (Nature Medicine 2001) — descoberta seminal
- ApoM/AdipoR1-AdipoR2 receptor pathway bem mapeado
- Correlação inversa com IMC documentada em 100+ estudos

## Como apresentar em copy
"O que ninguém te conta sobre a gordura abdominal: ela CALA um hormônio que seu próprio corpo produz pra queimar gordura. Quanto mais peso você ganha, MENOS desse hormônio você produz. É um ciclo. E pra quebrar..."

## Claims seguros
- "Pode auxiliar no metabolismo lipídico"
- "Contribui para sensibilidade à insulina"

## Saturação
**Baixa** — quase ninguém usou em copy mainstream. Janela aberta.

## Sinergia com
- Microbiota (`mechanism--microbiota-intestinal`)
- GLP-1 (próximo)',
 ARRAY['emagrecimento','saude-masculina'],
 ARRAY['hormonio','metabolismo','insulina'],
 0.88,
 '{"saturation":"baixa","last_seen":"2025-12","proof_strength":"alta","compliance_risk":"baixo","niches_active":["emagrecimento"]}'::jsonb
),

('mechanism--testosterona-baixa-masculina', 'mechanism', 'Testosterona Baixa (Andropausa Silenciosa)',
 'Declínio de testosterona em homens 35+. Mecanismo carro-chefe pra saúde masculina BR.',
 '# Mecanismo: Testosterona Baixa Após os 35

## O que é
Declínio fisiológico de testosterona em homens (~1-2% ao ano após 30). Sintomas: cansaço, libido baixa, gordura abdominal, perda muscular, brain fog.

## Como funciona
- Eixo HPG (hipotálamo-pituitária-gônadas) reduz LH/FSH
- Tecido adiposo converte testosterona em estradiol (aromatização)
- Estrogênio alto suprime ainda mais produção → ciclo

## Proof points
- Estudo Baltimore Longitudinal (BLSA) — declínio mapeado
- Massachusetts Male Aging Study
- T abaixo de 300 ng/dL = hipogonadismo clínico

## Como apresentar em copy
"Depois dos 35, seu corpo entra num modo silencioso de declínio que NINGUÉM te avisa. Não é envelhecimento normal — é um hormônio específico caindo 2% por ano. E aos 50, você já perdeu metade do que tinha aos 25."

## Claims seguros (alto risco — atenção!)
- "Suporte ao metabolismo masculino"
- "Auxilia performance física"
- ❌ EVITAR: "aumenta testosterona", comparações com TRT médica
- ⚠️ Anvisa monitora claims de testosterona — ler `claims--saude-masculina-anvisa`

## Saturação
**Alta** mas evergreen — sempre funciona pra novos homens entrando na faixa etária.

## Variações
- "Andropausa silenciosa"
- "Hormônio T"
- "Vigor masculino"',
 ARRAY['saude-masculina'],
 ARRAY['testosterona','andropausa','homem-40'],
 0.92,
 '{"saturation":"alta","last_seen":"2026-05","proof_strength":"alta","compliance_risk":"medio","niches_active":["saude-masculina"]}'::jsonb
),

-- ─── FRAMEWORKS DE COPY ──────────────────────────────────────────
('framework--niveis-consciencia-schwartz', 'framework', 'Níveis de Consciência (Schwartz)',
 'Os 5 níveis de awareness do leitor — diagnóstico OBRIGATÓRIO antes de qualquer copy.',
 '# Framework: Os 5 Níveis de Consciência (Eugene Schwartz)

> "The same headline that wins for a Level 5 reader will DESTROY a Level 1. Diagnose first, write second."

## Os 5 níveis

### 1. Mais consciente
**Leitor sabe:** produto existe, sabe que quer, precisa só de um empurrão.
**Headline:** oferta + preço + urgência.
**Exemplo:** "OFERTA: BluBlocker 30% off — só hoje"
**Quando:** retargeting, lista quente, last-click.

### 2. Consciente do produto
**Leitor sabe:** produto existe. Não sabe se vale.
**Headline:** prova + diferencial.
**Exemplo:** "Por que 14.342 clientes escolheram BluBlocker em vez de Ray-Ban"
**Quando:** middle of funnel, comparação.

### 3. Consciente da solução
**Leitor sabe:** que existe categoria de solução. Não conhece o seu produto.
**Headline:** novo mecanismo dentro da categoria.
**Exemplo:** "A primeira lente do mundo que bloqueia 100% do azul SEM amarelar a visão"
**Quando:** mercado conhece o gênero, você diferencia.

### 4. Consciente do problema
**Leitor sabe:** tem problema. Não sabe que existe solução.
**Headline:** promessa + intriga.
**Exemplo:** "Por que sua vista cansa em frente ao computador (e o que cientistas descobriram em 2024)"
**Quando:** topo de funil, criativos frios.

### 5. Inconsciente
**Leitor:** nem sabe que tem o problema.
**Headline:** identificação + curiosidade visceral.
**Exemplo:** "Você comete esses 7 erros ao usar o computador? (#3 envelhece sua vista 5 anos)"
**Quando:** descoberta total, criativo viral.

## Como diagnosticar o nível do SEU avatar

1. Avatar já procurou solução no Google? → Pelo menos nível 3.
2. Reconhece nome do mecanismo? → Nível 2.
3. Já comprou solução similar? → Nível 1.
4. Convive com sintoma mas não nomeia? → Nível 5.

## Erro fatal
Tratar Nível 5 como Nível 2 = leitor "ué, do que está falando?"
Tratar Nível 1 como Nível 5 = leitor "para de me explicar, me dá o link"

## Ver também
- `voice--eugene-schwartz`
- `framework--estagios-mercado-schwartz`',
 ARRAY['geral','emagrecimento','saude-masculina','renda-extra','beleza'],
 ARRAY['schwartz','consciencia','estrategia','diagnostico'],
 0.97,
 '{"complexity":"alta","application":"universal","sequence":"primeiro-passo"}'::jsonb
),

('framework--halbert-lead-structure', 'framework', 'Estrutura de Lead (Halbert)',
 'Os 5 blocos da abertura de carta de vendas Halbert — usados em cartas que faturaram dezenas de milhões.',
 '# Framework: Halbert Lead Structure

> "If they don''t read your first 3 sentences, they don''t read sentence 4. Period."

## Os 5 blocos (em ordem)

### Bloco 1 — Gancho visceral (50-100 palavras)
Não venda. Choque. Pode ser:
- **Confissão chocante:** "Vou ser sincero com você sobre algo que me dói confessar..."
- **Cena visual brutal:** "Eram 3 da manhã quando ela acordou suando frio, com a mão no peito..."
- **Pergunta que pinça:** "Você já comeu salada o dia inteiro e mesmo assim acordou no dia seguinte com o ponteiro da balança PARADO no mesmo número?"

### Bloco 2 — Identificação literal (100-200 palavras)
Descreva a dor do leitor em primeira pessoa, com **detalhes que SÓ ELE conhece**:
- O que ele sente fisicamente
- O que ele pensa que ninguém mais pensa
- Vergonha específica que ele esconde

> Princípio: o leitor pensa "como ele sabe disso?"

### Bloco 3 — Antagonista (50-100 palavras)
Crie/nomeie um inimigo:
- "A indústria" / "Os médicos" / "O governo" / "Os gurus"
- Não inimigo individual — sistema
- Eles SABEM mas escondem (por interesse próprio)

### Bloco 4 — Big reveal (100-200 palavras)
**Você descobriu algo.**
- Como descobriu (storytelling pessoal)
- Por que outros não vêem
- Adianta 30% do que vai contar — não 100%

### Bloco 5 — Promessa específica + ponte (50 palavras)
- Resultado mensurável em tempo definido
- "Continua lendo que eu explico exatamente como"

## Exemplo aplicado (emagrecimento)
> *"Tenho 47 anos e até 6 meses atrás eu não conseguia mais olhar pro espelho. [GANCHO]*
>
> *Acordava todos os dias com o mesmo abdômen inchado, mesmo depois de noite inteira sem comer. Não importava o quanto eu reduzia das refeições — a balança travava nos mesmos 78 quilos. E o pior: eu sabia exatamente o que cada amiga ia comentar quando me visse no chá da próxima semana. [IDENTIFICAÇÃO]*
>
> *Eu não sabia, mas a indústria de suplementos tinha me empurrado o produto ERRADO por anos. Eles sabem do mecanismo real, mas continuam vendendo o que dá mais margem. [ANTAGONISTA]*
>
> *Aí uma médica argentina me explicou — em 5 minutos — porque mulheres acima dos 40 PRECISAM atacar uma coisa específica antes de qualquer dieta. E quando ela me mostrou os exames dela própria (a mesma mulher que tinha 12 kg a mais que eu seis meses antes)... [BIG REVEAL]*
>
> *Em 31 dias eu perdi 8 quilos sem cortar carboidrato. E vou contar exatamente como — pra você e pra mais ninguém. Continua lendo. [PROMESSA + PONTE]"*

## Ver também
- `voice--gary-halbert`
- `pattern--ps-matador-halbert`',
 ARRAY['emagrecimento','saude-masculina','geral'],
 ARRAY['halbert','lead','sales-letter','vsl'],
 0.96,
 '{"complexity":"media","application":"vsl-sales-letter","length":"longa"}'::jsonb
),

('framework--slippery-slide', 'framework', 'Slippery Slide (Sugarman)',
 'A regra de ouro de Sugarman: cada frase existe pra fazer ler a próxima. Aplicável em qualquer copy.',
 '# Framework: Slippery Slide

> "Cada elemento do anúncio existe pra fazer você ler o título. O título existe pra fazer você ler o subtítulo. O subtítulo existe pra fazer você ler a primeira frase. E a primeira frase existe pra fazer você ler a segunda. E assim por diante." — Joe Sugarman

## Princípio operacional

O leitor pode parar de ler **a qualquer instante**. Cada frase é uma porta. Se a porta é chata, ele fecha. Se é interessante, abre pra próxima.

## Como aplicar — checklist

### Primeira frase
- ❌ "Você sabia que o emagrecimento é um problema sério no Brasil?"
- ✅ "Acordei na quarta-feira passada e não consegui amarrar meu próprio sapato."

### Frase de transição (a chata sempre é a "do meio")
- ❌ "Vamos falar agora sobre os benefícios deste produto..."
- ✅ "Mas o que aconteceu depois é o que ninguém esperava."

### Cada parágrafo termina em loop aberto
Última frase do parágrafo = mini-cliffhanger.

> *"...e aí o médico me olhou com um sorriso estranho e disse uma palavra que eu nunca tinha ouvido antes."*

(Próximo parágrafo começa revelando a palavra.)

### Frases curtas. Parágrafos curtos.
Densidade visual = peso mental. Pesado = leitor sai.

- 1 frase isolada como parágrafo é poderoso.
- Sublinhar funciona se for **raro**.

### Cortes brutais
Se você lê uma frase e ela **não** te empurra pra próxima — corte. Sem dó.

## Teste prático
Pegue sua copy. Apague a metade das frases. **A copy está pior?** Provavelmente não. Provavelmente está melhor.

## Ver também
- `voice--joe-sugarman`
- `pattern--story-lead-sugarman`',
 ARRAY['geral','emagrecimento','saude-masculina','renda-extra','beleza'],
 ARRAY['sugarman','slippery-slide','flow','engagement'],
 0.95,
 '{"complexity":"baixa","application":"universal","check":"em-toda-copy"}'::jsonb
),

('framework--16-palavras', 'framework', 'Carta de Vendas em 16 Palavras',
 'Reduza qualquer oferta a 16 palavras. Se não couber, sua big idea está fraca.',
 '# Framework: A Carta de Vendas em 16 Palavras

## Princípio
Se você não consegue resumir sua oferta em 16 palavras, **você ainda não sabe vendê-la**. O exercício força clareza brutal.

## Estrutura (4 blocos de 4 palavras cada)

1. **Quem** é o público (4 palavras)
2. **Qual** é a dor/desejo dele (4 palavras)
3. **Qual** o novo mecanismo/solução (4 palavras)
4. **Qual** o resultado prometido (4 palavras)

## Exemplos aplicados

### Emagrecimento
> "Mulheres acima dos 40 / com gordura abdominal teimosa / equilibram microbiota com kefir / emagrecem 8kg em 31 dias"

### Saúde masculina
> "Homens depois dos 35 / com cansaço e libido baixa / ativam adiponectina com protocolo / recuperam vigor em 21 dias"

### Renda extra
> "Mães em casa cansadas / sem saber por onde começar / fazem renda com IA / faturam R$3.000 no primeiro mês"

## Como usar
1. Antes de qualquer copy, ESCREVA essas 16 palavras.
2. Mostre pra alguém. Pergunte: "isso te chamou atenção?"
3. Se não, refaça. **Você ainda não tem oferta.**
4. Quando essas 16 palavras pungirem, expanda pra headline → lead → VSL completa.

## Por que funciona
- Headline final sai dessas 16 palavras
- Big idea fica clara
- Você descobre qual bloco está fraco (quase sempre é o #3 — mecanismo)
- Toda decisão de copy depois é validada contra essas 16 palavras

## Ver também
- `framework--niveis-consciencia-schwartz`
- `concept--big-idea`',
 ARRAY['geral','emagrecimento','saude-masculina','renda-extra'],
 ARRAY['estrutura','clareza','big-idea','pre-copy'],
 0.93,
 '{"complexity":"baixa","application":"pre-copy","obrigatorio":true}'::jsonb
),

-- ─── PATTERNS / GANCHOS ──────────────────────────────────────────
('pattern--descoberta-acidental', 'pattern', 'Gancho: Descoberta Acidental',
 'Padrão clássico — o protagonista descobre algo POR ACIDENTE. Reduz ceticismo do leitor.',
 '# Pattern: Descoberta Acidental

## Estrutura
Protagonista (médico/cientista/dona-de-casa/avô) descobre o mecanismo **por acaso**:
- Acidente de laboratório
- Viagem inusitada
- Erro que virou descoberta
- Receita de família revelada

## Por que funciona
- **Reduz ceticismo**: ninguém estava tentando vender você
- **Storytelling poderoso**: descoberta tem arco narrativo
- **Cria "magia"**: o universo conspirou pra trazer isso
- **Distancia do marketing tradicional**: parece natural

## Templates

### Médico em viagem
"O Dr. [Nome] estava de férias em [país exótico] quando notou que [população local] tinha [característica improvável]. Curioso, ele investigou e descobriu que..."

### Acidente de laboratório
"Eles estavam testando outra coisa. Mas quando misturaram [composto A] com [composto B] por engano, perceberam que..."

### Avó com receita
"Minha avó vivia 96 anos e nunca tomou remédio pra pressão. Quando eu finalmente perguntei o segredo, ela apontou pra cozinha e disse..."

### Cientista cético
"O Dr. X COMEÇOU querendo provar que [mecanismo] não funcionava. O que ele descobriu mudou a vida dele — e de 14.000 pacientes."

## Quando NÃO usar
- Públicos muito céticos (vão investigar o nome do médico)
- Nichos onde isso já está saturado (verifique `mechanism--*`)
- Quando o produto é COMODITIZADO (não cabe descoberta)

## Combinações poderosas
- + `mechanism--microbiota-intestinal` → "médico descobriu bactéria em mosteiro"
- + `framework--halbert-lead-structure` → vira lead matador

## Ver também
- `voice--gary-halbert` (usou MUITO)
- `pattern--segredo-proibido`',
 ARRAY['emagrecimento','saude-masculina','beleza','geral'],
 ARRAY['gancho','storytelling','autoridade'],
 0.91,
 '{"saturation":"alta","versions":["medico-viagem","laboratorio","avo-receita"]}'::jsonb
),

('pattern--inimigo-comum', 'pattern', 'Gancho: Inimigo Comum',
 'Une o leitor a você contra um inimigo (indústria, sistema, gurus). Cria tribo instantânea.',
 '# Pattern: O Inimigo Comum

## Estrutura
Identifica e nomeia **um inimigo** que está prejudicando o leitor:
- Indústria farmacêutica
- "Eles" (genérico — sistema, governo, lobbies)
- Gurus / influencers fakes
- "Big" alguma coisa (Big Pharma, Big Food, Big Tech)

## Por que funciona
- **Tribalismo:** humanos se unem CONTRA mais rápido do que A FAVOR
- **Externaliza a culpa:** leitor não falhou, ele foi enganado
- **Cria justificativa:** comprar de você = revolta contra o inimigo
- **Identificação imediata:** leitor já desconfiava, você só nomeou

## Templates

### Indústria
"A indústria farmacêutica não quer que você saiba disso. Eles ganham [valor] por ano vendendo [solução cara] quando [alternativa simples] já existe."

### Sistema
"Eles te ensinaram que [crença comum] na escola. Mas eles esqueceram de te contar..."

### Guru fake
"Esses gurus de Instagram vendem [solução comum] sem nunca terem testado. Eu testei. Por 7 anos. E aqui está o que NENHUM deles te conta:"

## Cuidado
- **Não invente conspiração**: deve ter base real, mesmo que parcial
- **Compliance**: alegar conspiração farmacêutica = risco de moderação
- **Não exagere**: leitor 2026 está calejado, paranoia barata afasta
- Se for usar, **prove** com fonte específica (jornalismo, estudo, dados)

## Ver também
- `voice--dan-kennedy`
- `pattern--segredo-proibido`',
 ARRAY['emagrecimento','saude-masculina','renda-extra','geral'],
 ARRAY['gancho','tribalismo','antagonista'],
 0.88,
 '{"saturation":"alta","risco_compliance":"medio"}'::jsonb
),

('pattern--especificidade-numerica', 'pattern', 'Padrão: Especificidade Numérica',
 'Número específico (não redondo) aumenta credibilidade absurdamente. Caples + Sugarman dependiam disso.',
 '# Pattern: Especificidade Numérica

## Princípio
Cérebro humano dá MUITO mais crédito a números específicos do que arredondados.

**"$2.847 por mês" >>> "cerca de R$3.000"**

## Por quê
- Específico parece **medido** (alguém realmente contou)
- Arredondado parece **estimado** (você está chutando)
- Quanto mais quebrado o número, mais real soa

## Aplicações

### Em headlines
- ❌ "Como ganhar muito dinheiro"
- ✅ "Como ganhei R$ 14.732,18 em 87 dias"

### Em prova
- ❌ "Centenas de clientes satisfeitos"
- ✅ "1.247 alunos do Brasil e 89 do exterior"

### Em estudos
- ❌ "Pesquisas mostram"
- ✅ "Estudo de 2.341 pacientes em 12 hospitais (Lancet, 2023)"

### Em garantia
- ❌ "Garantia incondicional"
- ✅ "Garantia de 31 dias — se em 31 dias você não ver resultado, devolvo 100% + R$50 pela perda de tempo"

## Onde NÃO ser específico
- **Promessa do produto**: aqui você precisa ser ligeiramente vago (compliance + expectativa)
  - ✅ "Pode emagrecer até 8kg em 30 dias"
  - ❌ "Emagrece exatamente 8kg em 30 dias" (Procon ama isso)

## Combinações
- + `concept--proof-stack` = lead de Bencivenga
- + `framework--halbert-lead-structure` = bloco de identificação

## Ver também
- `voice--john-caples`
- `voice--gary-bencivenga`
- `concept--reason-why-copy`',
 ARRAY['geral','emagrecimento','saude-masculina','renda-extra'],
 ARRAY['credibilidade','prova','numeros'],
 0.95,
 '{"saturation":"baixa","universal":true}'::jsonb
),

-- ─── CLAIMS / COMPLIANCE ─────────────────────────────────────────
('claims--emagrecimento-meta-anvisa', 'claims', 'Claims Seguros: Emagrecimento (Meta + ANVISA)',
 'Lista viva de claims permitidos vs proibidos pra emagrecimento BR. Reduz reprovação Meta.',
 '# Compliance: Emagrecimento — Meta Ads + ANVISA

> Atualizado: 2026-05. Revisar a cada 60 dias.

## ❌ Claims que dão BAN (Meta) ou Procon (ANVISA)

- "Emagrece X kg em Y dias" — número absoluto vinculado a tempo
- "Cura obesidade"
- "Substitui dieta e exercício"
- "100% garantido"
- "Sem efeitos colaterais"
- "Aprovado pela ANVISA" (a não ser que esteja literalmente registrado)
- "Como remédio mas natural"
- Comparações DIRETAS com Ozempic/Mounjaro/Saxenda
- Antes/depois com mudança extrema

## ⚠️ Claims de RISCO MÉDIO (testar)

- "Auxilia o emagrecimento"
- "Pode contribuir pra perda de peso"
- "Suporte ao metabolismo"
- "Sensação de saciedade"

## ✅ Claims SEGUROS

- "Suporte ao bem-estar"
- "Auxilia o equilíbrio do organismo"
- "Suplemento alimentar com [ingrediente] que pode auxiliar..."
- "Reduz a vontade de comer doce" (comprovado em estudo específico)
- Depoimentos com asterisco: "*Resultado individual. Resultados podem variar."

## Palavras-gatilho de moderação Meta (substitutos)

| Evite | Use |
|---|---|
| Gordura | "medidas" / "silhueta" |
| Obesidade | "peso elevado" / "sobrepeso" |
| Emagrecer | "atingir seu peso ideal" / "queimar gordura localizada" |
| Diabetes | "açúcar elevado" / "glicemia" |
| Antes/depois (imagem) | "transformação de bem-estar" |
| Você está gordo | "você merece se sentir bem com seu corpo" |

## Estrutura mínima de copy compliance-safe

1. Sempre ter **disclaimer no rodapé**: "Resultados individuais. Não substitui acompanhamento médico."
2. Evitar promessas com **timeline + quantidade**.
3. Usar **storytelling em terceira pessoa** ("uma cliente nossa", não "você vai").
4. Citar fonte ou estudo SEMPRE que fizer claim de eficácia.
5. Nunca usar "fórmula proibida", "segredo que farmácia esconde" — vermelhão imediato.

## Ver também
- `mechanism--enzima-do-cafe` (claims aplicados)
- `mechanism--microbiota-intestinal` (claims aplicados)',
 ARRAY['emagrecimento'],
 ARRAY['compliance','anvisa','meta-ads','claims'],
 0.85,
 '{"last_review":"2026-05","platforms":["meta","tiktok","google"],"risk_level":"alto"}'::jsonb
);
