// ═══════════════════════════════════════════════════════════════════
// KNOWLEDGE SYSTEM — Types
// ═══════════════════════════════════════════════════════════════════

export type WikiPageKind =
  | "voice"
  | "framework"
  | "concept"
  | "avatar"
  | "mechanism"
  | "pattern"
  | "claims"
  | "lesson";

export type RawSourceKind =
  | "book"
  | "transcript"
  | "swipe"
  | "competitor_asset"
  | "review_corpus"
  | "manual";

export type WikiRunKind =
  | "ingest"
  | "query"
  | "lint"
  | "distill"
  | "consult"
  | "evaluate";

export interface RawSource {
  id: string;
  kind: RawSourceKind;
  title: string;
  author?: string | null;
  niche?: string | null;
  content?: string | null;
  file_url?: string | null;
  source_url?: string | null;
  hash?: string | null;
  metadata: Record<string, unknown>;
  ingested_at: string;
}

export interface WikiPage {
  id: string;
  slug: string;
  kind: WikiPageKind;
  title: string;
  summary: string | null;
  body_md: string;
  structured: Record<string, unknown>;
  niches: string[];
  tags: string[];
  source_refs: string[];
  links_to: string[];
  confidence: number;
  freshness: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface WikiRevision {
  id: string;
  page_id: string;
  body_md: string;
  reason: string | null;
  author: "llm" | "human" | "system";
  created_at: string;
}

export interface WikiRun {
  id: string;
  kind: WikiRunKind;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  page_ids_touched: string[];
  tokens_used: number | null;
  duration_ms: number | null;
  created_at: string;
}

// ═══ Avatar ════════════════════════════════════════════════════════

export type AvatarMode = "interview" | "test_copy";

export interface AvatarStructured {
  demographics?: string;
  pains?: string[];          // citações literais
  desires?: string[];
  objections?: { objection: string; counter: string }[];
  native_vocab?: string[];
  trigger_vocab?: string[];  // palavras que travam
  brand_affinity?: string[];
  consciousness_level?: 1 | 2 | 3 | 4 | 5; // Schwartz
}

export interface AvatarInteraction {
  id: string;
  avatar_page_id: string;
  mode: AvatarMode;
  input: string;
  output: AvatarInterviewOutput | AvatarTestCopyOutput;
  reaction_score: number | null;
  used_evidence: string[];
  human_validated: boolean;
  created_at: string;
}

export interface AvatarInterviewOutput {
  response: string;
  evidence_refs: string[];   // slugs ou ids
  confidence: "high" | "medium" | "low" | "no_data";
}

export interface AvatarTestCopyOutput {
  interest: number;          // 0..10
  objections_raised: string[];
  trigger_words_hit: string[];
  next_likely_action: "click" | "scroll" | "leave" | "share" | "objection";
  rewrite_in_avatar_voice?: string;
  reasoning: string;
}

// ═══ Competitor offer ══════════════════════════════════════════════

export interface CompetitorExtracted {
  hook?: string;
  big_idea?: string;
  mechanism?: string;
  proof?: string[];
  offer?: string;
  guarantee?: string;
  cta?: string;
  consciousness_level?: number;
  objections_addressed?: string[];
  visual_angle?: string;
  vocabulary_notable?: string[];
}

export interface CompetitorOffer {
  id: string;
  name: string;
  niche: string | null;
  source_url: string | null;
  raw_source_id: string | null;
  extracted: CompetitorExtracted;
  l2_page_ids: string[];
  spy_offer_id: string | null;
  captured_at: string;
  created_at: string;
}

// ═══ VSL drafts ════════════════════════════════════════════════════

export type VslDraftMode    = "generate" | "evaluate";
export type VslDraftVerdict = "approved" | "needs_polish" | "needs_rewrite";

export interface VslSections {
  hook?: string;
  lead?: string;
  mechanism?: string;
  offer?: string;
  guarantee?: string;
  cta?: string;
}

export interface VslScores {
  clareza: number;
  gancho: number;
  prova: number;
  urgencia: number;
  compliance: number;
  overall: number;
}

export interface VslImprovement {
  section: keyof VslSections;
  current_excerpt: string;
  suggestion: string;
  reason: string;
  expected_delta: number; // 0..100
}

export interface VslDraft {
  id: string;
  briefing_id: string | null;
  mode: VslDraftMode;
  style_blend: Record<string, number>; // {Halbert: 0.7, ...}
  source_copy: string | null;
  generated_copy: string | null;
  sections: VslSections;
  scores: VslScores;
  verdict: VslDraftVerdict | null;
  improvements: VslImprovement[];
  used_pages: string[];
  created_at: string;
}

// ═══ Wiki Query/Ingest API shapes ══════════════════════════════════

export interface WikiQueryInput {
  q: string;
  kinds?: WikiPageKind[];
  niches?: string[];
  limit?: number;
  synthesize?: boolean;       // se true, retorna síntese Claude
}

export interface WikiQueryResult {
  pages: WikiPage[];
  synthesis?: string;
  query_run_id: string;
}

export interface WikiIngestInput {
  source: {
    kind: RawSourceKind;
    title: string;
    author?: string;
    niche?: string;
    content?: string;
    source_url?: string;
  };
  generate_pages?: boolean;   // default true — usa LLM para criar páginas
}

export interface WikiIngestResult {
  source: RawSource;
  pages_created: WikiPage[];
  pages_updated: WikiPage[];
  run_id: string;
}
