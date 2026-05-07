# DEIMOS TECH — Sistema de Inteligência

Plataforma privada de automação de direct response. Next.js 14 + Supabase + Claude API.

## Identidade Visual (SEMPRE SEGUIR)
- **Nome do produto:** DEIMOS / Deimos Tech
- **Paleta:** preto absoluto (#000) base, **amber (#F4C430)** como accent primário e **ember (#FF8A1F)** como ação/laranja
- **Fontes:** Inter (UI), Playfair Display (branding/headlines), DM Mono (dados numéricos)
- **Dark mode ONLY** — sem modo claro, jamais
- **Estética:** futurística, minimal, premium, silenciosa — parece sistema proprietário privado
- **Amber = autoridade/dado | Ember = ação/CTA | AI Blue (#5B8CFF) = inteligência (uso <5%) | White = clareza**
- Sem gradientes berrantes, sem glow excessivo, sem ruído visual
- Ícones outline (strokeWidth 1.5), cantos pequenos-médios, bordas finas
- **Compatibilidade:** classes Tailwind `gold-*` continuam válidas, mas hoje renderizam amber (#F4C430). `nova-*` renderiza ember (#FF8A1F).

## Estrutura
- `/app/` = páginas e API routes
- `/components/ui/` = componentes base reutilizáveis
- `/components/` = Sidebar, Topbar, AppShell
- `/lib/` = supabase.ts, claude.ts, utils.ts, constants.ts
- `/types/index.ts` = todos os tipos
- `/hooks/` = useOffers, useNiches, useChat
- `/skills/` = prompts IA em markdown (1 por nicho)
- `/supabase/` = schema.sql

## Tokens de Design (Tailwind)
```
bg-0 = #000000  (raiz)
bg-1 = #0B0B0C  (principal)
bg-2 = #121214  (sidebar/header)
bg-3 = #1C1C1F  (cards)
bg-4 = #2A2A2E  (bordas)

amber / gold        = #F4C430  (accent primário · autoridade)
amber-hover         = #E0B020
amber-glow          = rgba(244,196,48,0.18)

ember / nova        = #FF8A1F  (ação · CTA · laranja)
ember-hover         = #E5740F
ember-deep          = #C2410C

ai-blue             = #5B8CFF  (inteligência · uso <5%)

text-primary        = #FFFFFF
text-secondary      = #A1A1AA
text-muted          = #6B6B73
```

## Regras de Código
- TypeScript strict — sem `any` explícito
- ANTHROPIC_API_KEY jamais no frontend
- Componentes UI sem lógica de negócio
- Hooks para acesso a dados
- Dados numéricos sempre em `font-mono`
- Labels sempre `uppercase tracking-[0.15em+]`
- Ícones Lucide com `strokeWidth={1.5}`
