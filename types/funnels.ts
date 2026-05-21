/* ── Funnels — Types ── */

export type StageType =
  | "sales-page"
  | "vsl"
  | "quiz"
  | "email-whatsapp"
  | "checkout"
  | "venda"
  | "recusado";

export const STAGE_META: Record<
  StageType,
  { label: string; color: string; icon: string; description: string }
> = {
  "sales-page":     { label: "Pagina de Vendas", color: "#FF8A1F", icon: "FileText",    description: "Landing page principal" },
  vsl:              { label: "VSL",               color: "#5B8CFF", icon: "Play",        description: "Video Sales Letter" },
  quiz:             { label: "Quiz",              color: "#A78BFA", icon: "HelpCircle",  description: "Quiz de qualificacao" },
  "email-whatsapp": { label: "Email / WhatsApp",  color: "#34D399", icon: "MessageCircle", description: "Automacoes de follow-up" },
  checkout:         { label: "Checkout",          color: "#F4C430", icon: "CreditCard",  description: "Pagina de pagamento" },
  venda:            { label: "Venda",             color: "#22C55E", icon: "CheckCircle", description: "Compra aprovada" },
  recusado:         { label: "Recusado",          color: "#F87171", icon: "XCircle",     description: "Pagamento recusado" },
};

/* ── Sub-structure for each stage ── */

export interface SubItem {
  id: string;
  label: string;
  notes?: string;
  status?: "active" | "draft" | "disabled";
}

export interface FunnelStage {
  id: string;
  type: StageType;
  label: string;
  notes?: string;
  url?: string;
  children: SubItem[];
  metrics?: {
    visitors?: number;
    conversions?: number;
    rate?: number;
  };
}

/* ── Default sub-structures ── */

export const DEFAULT_CHILDREN: Record<StageType, SubItem[]> = {
  "sales-page": [
    { id: "sp-1", label: "Headline", status: "active" },
    { id: "sp-2", label: "Sub-headline", status: "active" },
    { id: "sp-3", label: "CTA Principal", status: "active" },
    { id: "sp-4", label: "Prova Social", status: "active" },
    { id: "sp-5", label: "Garantia", status: "active" },
  ],
  vsl: [
    { id: "vsl-1", label: "Hook (0-30s)", status: "active" },
    { id: "vsl-2", label: "Problema", status: "active" },
    { id: "vsl-3", label: "Agitacao", status: "active" },
    { id: "vsl-4", label: "Mecanismo", status: "active" },
    { id: "vsl-5", label: "Prova", status: "active" },
    { id: "vsl-6", label: "Oferta", status: "active" },
    { id: "vsl-7", label: "CTA / Fechamento", status: "active" },
  ],
  quiz: [
    { id: "qz-1", label: "Pergunta 1 — Qualificacao", status: "active" },
    { id: "qz-2", label: "Pergunta 2 — Dor", status: "active" },
    { id: "qz-3", label: "Pergunta 3 — Desejo", status: "active" },
    { id: "qz-4", label: "Resultado / Score", status: "active" },
    { id: "qz-5", label: "Redirect por Score", status: "active" },
  ],
  "email-whatsapp": [
    { id: "ew-1", label: "Welcome (D+0)", status: "active" },
    { id: "ew-2", label: "Nurture (D+1)", status: "active" },
    { id: "ew-3", label: "Prova Social (D+2)", status: "active" },
    { id: "ew-4", label: "Urgencia (D+3)", status: "active" },
    { id: "ew-5", label: "Ultimo CTA (D+5)", status: "active" },
    { id: "ew-6", label: "WhatsApp — Lembrete", status: "active" },
    { id: "ew-7", label: "WhatsApp — Carrinho", status: "active" },
  ],
  checkout: [
    { id: "ck-1", label: "Order Bump", status: "active" },
    { id: "ck-2", label: "Upsell 1", status: "draft" },
    { id: "ck-3", label: "Downsell", status: "draft" },
    { id: "ck-4", label: "Pixel / Tracking", status: "active" },
  ],
  venda: [
    { id: "v-1", label: "Thank You Page", status: "active" },
    { id: "v-2", label: "Email de Boas-Vindas", status: "active" },
    { id: "v-3", label: "Acesso ao Produto", status: "active" },
    { id: "v-4", label: "Onboarding", status: "draft" },
  ],
  recusado: [
    { id: "r-1", label: "Retry Pagamento", status: "active" },
    { id: "r-2", label: "Boleto Alternativo", status: "active" },
    { id: "r-3", label: "Email Recuperacao", status: "active" },
    { id: "r-4", label: "WhatsApp Suporte", status: "draft" },
  ],
};

/* ── Funnel connections (fixed flow) ── */

export interface FunnelConnection {
  from: string;
  to: string;
  label?: string;
  type?: "default" | "success" | "reject";
}

export const DEFAULT_FLOW: StageType[] = [
  "sales-page",
  "vsl",
  "quiz",
  "email-whatsapp",
  "checkout",
];

export const DEFAULT_CONNECTIONS: { from: StageType; to: StageType; label?: string; type?: "default" | "success" | "reject" }[] = [
  { from: "sales-page", to: "vsl" },
  { from: "vsl", to: "quiz" },
  { from: "quiz", to: "email-whatsapp" },
  { from: "email-whatsapp", to: "checkout" },
  { from: "checkout", to: "venda", label: "Aprovado", type: "success" },
  { from: "checkout", to: "recusado", label: "Recusado", type: "reject" },
];

/* ── Persisted funnel ── */

export interface Funnel {
  id: string;
  name: string;
  description?: string;
  stages: FunnelStage[];
  connections: FunnelConnection[];
  created_at: string;
  updated_at: string;
  // legacy compat
  nodes?: unknown;
  edges?: unknown;
  viewport?: unknown;
}

export interface CreateFunnelInput {
  name: string;
  description?: string;
}
