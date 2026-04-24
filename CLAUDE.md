# DEIMOS TECH — Sistema de Inteligência

Plataforma privada de automação de direct response. Next.js 14 + Supabase + Claude API.

## Identidade Visual (SEMPRE SEGUIR)
- **Nome do produto:** DEIMOS / Deimos Tech
- **Paleta:** preto absoluto (#000) base, gold (#D6C2A1) como accent primário
- **Fontes:** Inter (UI), Playfair Display (branding/headlines), DM Mono (dados numéricos)
- **Dark mode ONLY** — sem modo claro, jamais
- **Estética:** minimal, premium, silencioso — parece sistema proprietário privado
- **Gold = ação/autoridade | AI Blue (#5B8CFF) = inteligência (usar <5%) | White = clareza**
- Sem gradientes, sem glow excessivo, sem ruído visual
- Ícones outline (strokeWidth 1.5), cantos pequenos-médios, bordas finas

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
gold = #D6C2A1  (accent primário)
gold-hover = #BFA888
text-primary = #FFFFFF
text-secondary = #A1A1AA
text-muted = #6B6B73
```

## Regras de Código
- TypeScript strict — sem `any` explícito
- ANTHROPIC_API_KEY jamais no frontend
- Componentes UI sem lógica de negócio
- Hooks para acesso a dados
- Dados numéricos sempre em `font-mono`
- Labels sempre `uppercase tracking-[0.15em+]`
- Ícones Lucide com `strokeWidth={1.5}`
