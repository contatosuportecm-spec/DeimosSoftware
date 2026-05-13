# Knowledge System · Deimos

Sistema de inteligência de copy de direct response baseado no padrão **LLM Wiki** do Karpathy adaptado para nossa operação. Substitui RAG cego por um corpo de conhecimento que cresce com curadoria humana + LLM, e alimenta toda geração/avaliação de copy do Deimos.

## Arquitetura em 3 camadas

```
L1 · RAW SOURCES      → tabela raw_sources (livros, transcrições, copys destiladas)
L2 · KNOWLEDGE WIKI   → tabela wiki_pages (síntese gerada+curada por LLM, full-text search)
L3 · OPERATIONAL      → tabelas existentes (offers, offer_briefings, creatives)
                       + tabelas novas: vsl_drafts, competitor_offers, avatar_interactions
```

L2 é o cérebro. Toda geração de copy (Forge, VSL Studio, Reverse-Eng) consulta L2 antes de gerar. Tudo que sai do L3 (novas ofertas, criativos) destila de volta pra L2 — loop fechado.

## Módulos entregues

| Módulo | Rota | Função |
|---|---|---|
| M5 · Copywriter Voices | `/copywriters` | 7 vozes lendárias (Halbert, Caples, Schwartz, Sugarman, Kennedy, Bencivenga, Hopkins) consultáveis |
| M4 · Biblioteca | `/library` | Mecanismos · Frameworks · Padrões · Compliance · Conceitos, filtráveis por nicho |
| M1 · VSL Studio | `/vsl-studio` | Generator (cria VSL do briefing) + Evaluator (audita copy com decision gate anti-ruído) |
| M2 · Reverse-Engineering | `/reverse-engineering` | Destila copy de concorrente → popula L2 + cria registro em competitor_offers |
| M3 · Avatar Vivo | `/avatar` | Persona conversável (modo Entrevistar) + teste de copy com reação simulada |

## Estrutura de arquivos

```
supabase/migrations/
  011_knowledge_system.sql       infra L1+L2 (tabelas, índices, triggers, FTS)
  012_seed_copywriter_voices.sql 7 voices
  013_seed_library.sql           mecanismos + frameworks + patterns + claims
  014_seed_avatar.sql            1 avatar (mulher 40+ emagrecimento)

types/
  knowledge.ts                   tipos do sistema (re-export via types/index.ts)

lib/
  wiki/
    util.ts                      hash, slug, JSON extract
    query.ts                     hybrid search (FTS + filtros) + síntese
    ingest.ts                    destila fonte → cria/atualiza wiki_pages
    lint.ts                      detecta links quebrados, stale, órfãs, low-confidence
  vsl/
    context.ts                   monta bundle L2 pra alimentar geração/auditoria
    generate.ts                  cria VSL (6 seções) usando style_blend + L2
    evaluate.ts                  audita copy com decision gate (anti-ruído)
  reverse/
    destill.ts                   extrai estrutura concorrente + upsert pages

app/api/
  wiki/{ingest,query,lint,pages,pages/[slug]}/route.ts
  copywriters/consult/route.ts
  vsl/{generate,evaluate}/route.ts
  reverse-engineering/{,destill}/route.ts
  avatar/{ask,test-copy}/route.ts

app/
  copywriters/{page.tsx, [slug]/page.tsx}
  library/{page.tsx, [slug]/page.tsx}
  vsl-studio/{page.tsx, [briefingId]/page.tsx}
  reverse-engineering/page.tsx
  avatar/{page.tsx, [slug]/page.tsx}
```

## Setup — aplicar migrations

No Supabase SQL Editor, rode na ordem:

```
1. 011_knowledge_system.sql       (cria tabelas e tipos)
2. 012_seed_copywriter_voices.sql (popula 7 copywriters)
3. 013_seed_library.sql           (popula biblioteca seed)
4. 014_seed_avatar.sql            (popula avatar seed)
```

> **Tudo só funciona depois das migrations.** Sem elas, todas as páginas mostram empty state.

## Como usar cada módulo

### 1. Consultar copywriter (`/copywriters`)
- Lista os 7 com cards
- Clique → tela de chat
- Pergunta livre ("como você abriria essa VSL?") ou cola copy no campo "Material a analisar"
- LLM responde encarnando o copywriter com base na voice page

### 2. Biblioteca (`/library`)
- 5 abas: Mecanismos / Frameworks / Padrões / Compliance / Conceitos
- Filtro por nicho
- Card mostra saturação + força da prova + complexidade
- Clique pra página completa com body markdown + páginas relacionadas

### 3. VSL Studio (`/vsl-studio`)
- Lista briefings existentes (vem da tabela `offer_briefings`)
- Clique no briefing → tela 3 colunas:
  - **Esquerda:** resumo do briefing + modo (Gerar/Auditar) + style blend (sliders por copywriter)
  - **Meio:** editor da copy (gerada ou colada)
  - **Direita:** scores 5-dim + decision gate + sugestões

**Decision gate:** se overall ≥ 80 E todas as dimensões ≥ 75 → veredicto = `approved` e improvements = []. Sem ruído.

### 4. Reverse-Engineering (`/reverse-engineering`)
- Cole copy/transcript/LP de concorrente (≥100 chars)
- LLM destila: hook, big idea, mecanismo, prova, oferta, garantia, CTA, padrões usados
- Cria/incrementa páginas L2 (mecanismos viram páginas, padrões viram páginas)
- Registra em `competitor_offers`
- Próxima destilação no mesmo nicho **incrementa** páginas existentes (não duplica)

### 5. Avatar Vivo (`/avatar`)
- Lista avatares (seed inicial: Mulher 40+ Emagrecimento)
- Clique → 2 abas:
  - **Entrevistar:** chat. Pergunta-resposta como se fosse a pessoa. Cada resposta tem badge de confidence.
  - **Testar copy:** cole copy → score de interesse 0-10, objeções não respondidas, palavras-gatilho usadas, reescrita na voz do avatar.

**Anti-alucinação:** prompt do avatar exige resposta APENAS com base nas evidências documentadas. Se não há dado, retorna `confidence=no_data`.

## Fluxo end-to-end (oferta nova passa pelo sistema)

1. **Spy** detecta oferta concorrente
2. Você cola copy no **Reverse-Engineering** → destila → popula L2 (`mechanism--X`, `pattern--Y`)
3. Cria **briefing** novo (sistema já tem `/offer-briefings`)
4. Abre **VSL Studio** com esse briefing → modo Gerar → seleciona style blend (ex: Halbert 70% + Sugarman 30%)
5. Sistema puxa do L2: voices + frameworks + mecanismos do nicho + avatar + compliance → gera VSL com 6 seções
6. Edita à vontade → modo **Auditar** → vê scores
7. Se `approved`, exporta. Se não, aplica sugestões.
8. Testa a copy no **Avatar Vivo** → checa reação simulada
9. Roda a oferta → métricas voltam pro L3
10. Cron destila lições → cria/atualiza páginas `kind=lesson`

## Endpoints (REST)

### Wiki core
- `POST /api/wiki/ingest`  — ingere fonte e destila páginas
- `POST /api/wiki/query`   — busca híbrida + síntese opcional
- `GET  /api/wiki/lint`    — relatório de qualidade do corpus
- `GET  /api/wiki/pages?kind=X&niche=Y`
- `GET  /api/wiki/pages/:slug`
- `PATCH /api/wiki/pages/:slug`

### Módulos
- `POST /api/copywriters/consult` — consulta copywriter
- `POST /api/vsl/generate`        — gera VSL
- `POST /api/vsl/evaluate`        — audita copy
- `POST /api/reverse-engineering/destill` — destila concorrente
- `GET  /api/reverse-engineering`         — lista destiladas
- `POST /api/avatar/ask`          — entrevista avatar
- `POST /api/avatar/test-copy`    — testa reação

## Princípios de design (Karpathy aplicado)

1. **Páginas curadas, não chunks.** A wiki é narrativa humana, não embeddings cegos.
2. **Compounding artifact.** Cada destilação adiciona/incrementa páginas — não recomputa.
3. **Revisões append-only.** Toda mudança em `wiki_pages` salva versão anterior em `wiki_revisions`.
4. **Memória episódica.** `wiki_runs` loga todo ingest/query/lint/distill/consult/evaluate — vira dataset.
5. **Confidence + freshness explícitos.** Cada página declara o quanto ela é sólida e quando foi vista pela última vez.
6. **Full-text search PT-BR.** Tsvector com `portuguese` dictionary + weights A/B/C (título/sumário/corpo).

## Próximos passos (não entregues)

- **Embeddings pgvector** — atualmente só FTS PT-BR; adicionar pgvector + provedor de embeddings melhora retrieval.
- **Cron de destilação L3 → L2** — pegar ofertas com métricas e gerar `kind=lesson` automaticamente.
- **Painel de lint** — atualmente `/api/wiki/lint` retorna JSON; falta UI.
- **Spy integration direto** — botão "Destilar" no card da oferta do Spy chamando o endpoint.
- **Ingestão de PDF** — atualmente recebe `content` em texto; falta pipeline PDF → texto.
- **Avatar auto-evolve** — cron pegar `avatar_interactions` validadas + briefings novos e propor revisões na página avatar.
- **Compliance lint pré-publicação** — gate automático: toda VSL gerada passa por checagem contra `claims--*` antes de exportar.

## Limites e cuidados

- **Sem curadoria humana, corpus degenera em 60 dias.** Tem que revisar páginas auto-destiladas regularmente.
- **Avatar com baixa evidência mente convincentemente.** Quando vir confidence=low/no_data, tomar como sinal de "alimentar mais", não como resposta válida.
- **VSL gerada não publica sozinha.** Sempre humano revê. Decision gate é guia, não autopilot.
- **Compliance é responsabilidade final humana.** Página `claims` é guideline, não advogado.
