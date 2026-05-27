/* ── Funnels — Fractal Canvas Types (v2) ── */

import type { LucideIcon } from "lucide-react";
import {
  Video, ListChecks, HelpCircle, Mail, MessageCircle,
  ArrowUpCircle, ArrowDownCircle, FileText, ShoppingCart,
  CheckCircle2, Type, Heading, MousePointerClick, Square, TextCursorInput,
} from "lucide-react";

/* ── Node Types ── */

export type FunnelNodeType =
  | "vsl"
  | "quiz"
  | "sales_page"
  | "email"
  | "whatsapp"
  | "upsell"
  | "downsell"
  | "checkout"
  | "sale"
  | "headline"
  | "copy_block"
  | "button"
  | "quiz_question"
  | "button_answer"
  | "text_answer";

export type NodeCategory = "container" | "block" | "terminal";

export interface NodeTypeMeta {
  label: string;
  icon: LucideIcon;
  category: NodeCategory;
  color: string;
  /** Card width override (default 220) */
  cardWidth?: number;
}

export const NODE_TYPE_META: Record<FunnelNodeType, NodeTypeMeta> = {
  // Containers
  vsl:         { label: "VSL",           icon: Video,           category: "container", color: "#5B8CFF" },
  quiz:        { label: "Quiz",          icon: ListChecks,      category: "container", color: "#A78BFA" },
  sales_page:  { label: "Sales Page",    icon: FileText,        category: "container", color: "#FF8A1F" },
  email:       { label: "Email",         icon: Mail,            category: "container", color: "#34D399" },
  whatsapp:    { label: "WhatsApp",      icon: MessageCircle,   category: "container", color: "#22D3EE" },
  upsell:      { label: "Upsell",        icon: ArrowUpCircle,   category: "container", color: "#F4C430" },
  downsell:    { label: "Downsell",      icon: ArrowDownCircle, category: "container", color: "#FB923C" },
  // Terminals
  checkout:    { label: "Checkout",      icon: ShoppingCart,    category: "terminal",  color: "#F4C430" },
  sale:        { label: "Sale",          icon: CheckCircle2,    category: "terminal",  color: "#22C55E" },
  // Blocks
  headline:    { label: "Headline",      icon: Heading,         category: "block",     color: "#60A5FA", cardWidth: 300 },
  copy_block:  { label: "Copy Block",    icon: Type,            category: "block",     color: "#94A3B8", cardWidth: 280 },
  button:      { label: "Button",        icon: MousePointerClick, category: "block",   color: "#FB923C", cardWidth: 220 },
  quiz_question: { label: "Pergunta",    icon: HelpCircle,      category: "block",     color: "#C084FC", cardWidth: 300 },
  button_answer: { label: "Resposta · Botao", icon: Square,     category: "block",     color: "#A78BFA", cardWidth: 320 },
  text_answer:   { label: "Resposta · Texto", icon: TextCursorInput, category: "block", color: "#8B8BFA", cardWidth: 280 },
};

/** Types allowed as children per parent type */
export const ALLOWED_CHILDREN: Partial<Record<FunnelNodeType, FunnelNodeType[]>> = {
  vsl:           ["headline", "copy_block", "button"],
  quiz:          ["quiz_question"],
  sales_page:    ["copy_block", "button"],
  email:         ["copy_block"],
  whatsapp:      ["copy_block"],
  upsell:        ["vsl", "quiz", "sales_page"],
  downsell:      ["vsl", "quiz", "sales_page"],
};

/** Root-level types */
export const ROOT_TYPES: FunnelNodeType[] = [
  "vsl", "quiz", "sales_page", "email", "whatsapp",
  "upsell", "downsell", "checkout", "sale",
];

export const ALL_NODE_TYPES = Object.keys(NODE_TYPE_META) as FunnelNodeType[];

/* ── Content schemas per type ── */

// Containers — empty
// Blocks
export interface HeadlineContent { text: string }
export interface CopyBlockContent { body: string; role?: string }
export interface ButtonContent { label: string; target_url?: string }
export interface QuizQuestionContent {
  question: string;
  question_type: "open" | "button" | "scale";
  options?: Array<{ id: string; label: string }>;
}
export interface ButtonAnswerContent { options: Array<{ id: string; label: string }> }
export interface TextAnswerContent { label: string; placeholder?: string }

/* ── Metrics per type ── */

export interface HeadlineMetrics { playrate?: number }
export interface CopyBlockVslMetrics { retention?: number }
export interface CopyBlockPageMetrics { ctr?: number }
export interface CopyBlockEmailMetrics { open_rate?: number; click_rate?: number }
export interface ButtonMetrics { ctr?: number }
export interface QuizMetrics { initialization_rate?: number; final_button_ctr?: number }
export interface CheckoutMetrics { conversion_rate?: number }
export interface SaleMetrics { revenue?: number; notes?: string }

export type NodeMetrics = Record<string, unknown>;

/* ── Aggregated metrics for containers ── */

export interface AggregatedMetrics {
  [key: string]: number | undefined;
}

/* ── DB Row types ── */

export interface FunnelRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FunnelNodeRow {
  id: string;
  funnel_id: string;
  parent_node_id: string | null;
  type: FunnelNodeType;
  label: string;
  position_x: number;
  position_y: number;
  content: Record<string, unknown>;
  metrics: Record<string, unknown>;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface FunnelEdgeRow {
  id: string;
  funnel_id: string;
  source_node_id: string;
  target_node_id: string;
  label: string | null;
  condition: Record<string, unknown> | null;
  source_handle: string | null;
  target_handle: string | null;
}

/* ── Frontend models ── */

export interface FunnelPreviewNode {
  type: FunnelNodeType;
  label: string;
}

export interface Funnel {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  node_count?: number;
  preview_nodes?: FunnelPreviewNode[];
}

export interface FunnelNode {
  id: string;
  funnel_id: string;
  parent_node_id: string | null;
  type: FunnelNodeType;
  label: string;
  position_x: number;
  position_y: number;
  content: Record<string, unknown>;
  metrics: NodeMetrics;
  order_index: number;
  has_children?: boolean;
}

export interface FunnelEdge {
  id: string;
  funnel_id: string;
  source_node_id: string;
  target_node_id: string;
  label?: string;
  condition?: Record<string, unknown>;
  source_handle?: string;
  target_handle?: string;
}

export interface CreateFunnelInput {
  name: string;
  description?: string;
}
