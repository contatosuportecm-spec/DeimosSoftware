# NOVA — Estrutura Base (Simplificada)

> Base mínima e sólida. Só o que precisa existir pra funcionar e crescer.

---

## STACK

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (banco + auth)
- Claude API (server-side)

---

## ESTRUTURA DE PASTAS

```
nova/
├── app/
│   ├── layout.tsx              # Fonts (Sora + DM Mono), metadata
│   ├── page.tsx                # Redirect → /dashboard
│   ├── globals.css             # Tokens do design system
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   ├── spy/
│   │   └── page.tsx
│   ├── creatives/
│   │   ├── page.tsx            # Grid de nichos
│   │   └── [nicheId]/
│   │       └── page.tsx        # Chat do nicho
│   ├── settings/
│   │   └── page.tsx
│   │
│   ├── layout-app.tsx          # Sidebar + Topbar wrapper (usado pelos módulos)
│   │
│   └── api/
│       ├── chat/route.ts       # Proxy Claude API
│       ├── offers/route.ts     # CRUD ofertas
│       └── niches/route.ts     # CRUD nichos
│
├── components/
│   ├── ui/                     # Componentes base
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Toggle.tsx
│   │   ├── StatCard.tsx
│   │   └── EmptyState.tsx
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   └── AppShell.tsx            # Sidebar + Topbar + {children}
│
├── lib/
│   ├── supabase.ts             # Client do Supabase (browser + server)
│   ├── claude.ts               # Helper pra chamar Claude API
│   ├── utils.ts                # cn(), formatadores, helpers
│   └── constants.ts            # Módulos do sidebar, status configs, etc
│
├── types/
│   └── index.ts                # Todos os tipos num arquivo só
│
├── hooks/
│   ├── useOffers.ts
│   ├── useNiches.ts
│   └── useChat.ts
│
├── skills/                     # Prompts de IA em markdown
│   ├── emagrecimento.md
│   └── (outros nichos depois)
│
├── supabase/
│   └── schema.sql              # SQL completo do banco
│
├── .env.local
├── .env.example
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── CLAUDE.md                   # Contexto pro Claude Code
└── package.json
```

---

## BANCO DE DADOS (schema.sql)

Copiar e rodar no SQL Editor do Supabase:

```sql
-- Enums
CREATE TYPE offer_status AS ENUM ('new', 'monitoring', 'scaling', 'stable', 'dying', 'archived');
CREATE TYPE knowledge_type AS ENUM ('hook', 'angle', 'mechanism', 'script', 'reference', 'pattern');
CREATE TYPE chat_role AS ENUM ('user', 'assistant', 'system');

-- Ofertas monitoradas
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  library_url TEXT,
  page_url TEXT,
  vsl_url TEXT,
  status offer_status DEFAULT 'new',
  score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico diário de anúncios
CREATE TABLE offer_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  active_ads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(offer_id, date)
);

-- Nichos configurados
CREATE TABLE niches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📦',
  color TEXT DEFAULT '#818CF8',
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge base por nicho
CREATE TABLE niche_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id TEXT NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  type knowledge_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessões de chat
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id TEXT NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Mensagens
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role chat_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_snapshots_offer ON offer_snapshots(offer_id, date);
CREATE INDEX idx_knowledge_niche ON niche_knowledge(niche_id, type);
CREATE INDEX idx_messages_session ON chat_messages(session_id, created_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_offers_updated BEFORE UPDATE ON offers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update last_message_at
CREATE OR REPLACE FUNCTION update_session_last_msg()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions SET last_message_at = NEW.created_at WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_msg_inserted AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION update_session_last_msg();

-- Seed nichos iniciais
INSERT INTO niches (id, name, description, emoji, color) VALUES
  ('emagrecimento', 'Emagrecimento', 'Perda de peso, GLP-1, receitas, suplementos', '🔥', '#E94560'),
  ('saude-masculina', 'Saúde Masculina', 'Libido, testosterona, performance', '💪', '#3B82F6'),
  ('financas', 'Finanças', 'Renda extra, investimentos, liberdade financeira', '💰', '#10B981'),
  ('beleza', 'Beleza & Estética', 'Skincare, anti-aging, procedimentos', '✨', '#8B5CF6'),
  ('relacionamento', 'Relacionamento', 'Reconquista, sedução, casamento', '❤️', '#EC4899');
```

---

## VARIÁVEIS DE AMBIENTE

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=              # server-side only
```

---

## DESIGN SYSTEM (tailwind.config.ts)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sora)"],
        mono: ["var(--font-dm-mono)"],
      },
      colors: {
        bg: {
          0: "#09090B", 1: "#0F0F13", 2: "#16161D",
          3: "#1C1C26", 4: "#24242F", 5: "#2C2C38",
        },
        accent: {
          DEFAULT: "#818CF8", hover: "#6366F1",
          muted: "rgba(129,140,248,0.15)",
        },
        success: { DEFAULT: "#34D399", muted: "rgba(52,211,153,0.12)" },
        warning: { DEFAULT: "#FBBF24", muted: "rgba(251,191,36,0.12)" },
        danger: { DEFAULT: "#F87171", muted: "rgba(248,113,113,0.12)" },
        text: {
          primary: "#FAFAFA", secondary: "#A1A1AA",
          tertiary: "#71717A", muted: "#52525B",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          DEFAULT: "rgba(255,255,255,0.09)",
          strong: "rgba(255,255,255,0.14)",
        },
      },
      borderRadius: { sm: "6px", md: "10px", lg: "14px", xl: "20px" },
    },
  },
};

export default config;
```

---

## TIPOS (types/index.ts)

```typescript
// ═══ Database types ═══

export type OfferStatus = "new" | "monitoring" | "scaling" | "stable" | "dying" | "archived";
export type KnowledgeType = "hook" | "angle" | "mechanism" | "script" | "reference" | "pattern";
export type ChatRole = "user" | "assistant" | "system";

export interface Offer {
  id: string;
  name: string;
  niche: string;
  source: string;
  library_url?: string;
  page_url?: string;
  vsl_url?: string;
  status: OfferStatus;
  score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OfferSnapshot {
  id: string;
  offer_id: string;
  date: string;
  active_ads_count: number;
}

export interface Niche {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  color: string;
  system_prompt?: string;
  is_active: boolean;
}

export interface NicheKnowledge {
  id: string;
  niche_id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  tags: string[];
}

export interface ChatSession {
  id: string;
  niche_id: string;
  title?: string;
  created_at: string;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

// ═══ Module registry ═══

export interface Module {
  id: string;
  name: string;
  icon: string;
  path: string;
  status: "active" | "coming" | "future";
}
```

---

## REGISTRY DE MÓDULOS (lib/constants.ts)

```typescript
import { Module } from "@/types";

export const MODULES: Module[] = [
  { id: "dashboard", name: "Dashboard", icon: "Home", path: "/dashboard", status: "active" },
  { id: "spy", name: "Spy", icon: "Radar", path: "/spy", status: "active" },
  { id: "creatives", name: "Criativos", icon: "Brain", path: "/creatives", status: "active" },
  { id: "compass", name: "Compass", icon: "Chart", path: "/compass", status: "coming" },
  { id: "vault", name: "Vault", icon: "Wallet", path: "/vault", status: "coming" },
  { id: "forge", name: "Forge", icon: "Zap", path: "/forge", status: "future" },
  { id: "factory", name: "Factory", icon: "Layers", path: "/factory", status: "future" },
  { id: "builder", name: "Builder", icon: "Layout", path: "/builder", status: "future" },
  { id: "pilot", name: "Pilot", icon: "Send", path: "/pilot", status: "future" },
];

export const STATUS_COLORS = {
  scaling: { label: "Escalando", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  stable: { label: "Estável", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  dying: { label: "Morrendo", color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  new: { label: "Nova", color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  monitoring: { label: "Monitorando", color: "#A1A1AA", bg: "rgba(161,161,170,0.12)" },
  archived: { label: "Arquivada", color: "#52525B", bg: "rgba(82,82,91,0.12)" },
};
```

---

## SKILLS

Cada skill é um arquivo `.md` em `/skills/`. O system prompt do nicho é carregado desse arquivo e injetado na Claude API.

Para adicionar um nicho novo:
1. Criar `skills/[slug].md`
2. Inserir na tabela `niches` no Supabase
3. O nicho aparece automaticamente no grid

---

## CLAUDE.md

```markdown
# NOVA

Sistema de automação de direct response. Next.js 14 + Supabase + Claude API.

## Estrutura
- /app/ = páginas e API routes
- /components/ui/ = componentes base reutilizáveis
- /components/ = Sidebar, Topbar, AppShell
- /lib/ = supabase.ts, claude.ts, utils.ts, constants.ts
- /types/index.ts = todos os tipos
- /hooks/ = useOffers, useNiches, useChat
- /skills/ = prompts IA em markdown (1 por nicho)

## Design
- Fonts: Sora (sans) + DM Mono (mono)
- Dark mode only. Cores: bg-0 a bg-5, accent #818CF8
- Dados numéricos sempre em font-mono
- Labels uppercase com tracking-wider

## Regras
- TypeScript strict
- ANTHROPIC_API_KEY nunca no frontend
- Componentes UI sem lógica de negócio
- Hooks pra acesso a dados
```

---

## CHECKLIST

- [ ] Projeto Next.js + TypeScript + Tailwind
- [ ] tailwind.config.ts com tokens
- [ ] globals.css + fonts (Sora, DM Mono)
- [ ] .env.example + .env.local
- [ ] Supabase: rodar schema.sql
- [ ] lib/supabase.ts
- [ ] lib/claude.ts
- [ ] lib/utils.ts + lib/constants.ts
- [ ] types/index.ts
- [ ] Componentes UI (Button, Input, Card, Badge, Modal, Table, Toggle, StatCard, EmptyState)
- [ ] Sidebar + Topbar + AppShell
- [ ] Dashboard (placeholder)
- [ ] Páginas placeholder dos módulos
- [ ] CLAUDE.md
- [ ] Build sem erros
