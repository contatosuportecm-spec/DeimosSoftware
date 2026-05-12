"use client";

import { useState } from "react";
import { ArrowLeft, Pencil, Trash2, Gift, Quote, ExternalLink } from "lucide-react";
import Button from "@/components/ui/Button";
import { OfferBriefing } from "@/types";
import { GenericBadge } from "@/components/ui/Badge";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface BriefingDetailProps {
  briefing: OfferBriefing;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: "Rascunho",  color: "#6B6B73", bg: "rgba(107,107,115,0.10)" },
  active:   { label: "Ativa",     color: "#34D399", bg: "rgba(52,211,153,0.10)" },
  paused:   { label: "Pausada",   color: "#FBBF24", bg: "rgba(251,191,36,0.10)" },
  archived: { label: "Arquivada", color: "#52525B", bg: "rgba(82,82,91,0.10)" },
};

const NICHE_COLORS: Record<string, { color: string; bg: string }> = {
  emagrecimento:     { color: "#E94560", bg: "rgba(233,69,96,0.12)" },
  "saude-masculina": { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  "renda-extra":     { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  beleza:            { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  relacionamento:    { color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
};

export default function BriefingDetail({ briefing, onBack, onEdit, onDelete }: BriefingDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const status = STATUS_CONFIG[briefing.status] ?? STATUS_CONFIG.draft;
  const nicheStyle = NICHE_COLORS[briefing.niche];

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); setConfirmDelete(false); }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-[#9B9BA5] hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Ofertas
          </button>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2.5 min-w-0">
            <GenericBadge label={briefing.niche} color={nicheStyle?.color} bg={nicheStyle?.bg} />
            <span
              className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ color: status.color, backgroundColor: status.bg }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
              {status.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil size={13} strokeWidth={1.5} />
            Editar
          </Button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all",
              confirmDelete
                ? "bg-danger/15 text-danger border border-danger/20"
                : "text-[#9B9BA5] hover:text-danger hover:bg-danger/8"
            )}
          >
            <Trash2 size={13} strokeWidth={1.5} />
            {confirmDelete ? "Confirmar" : "Excluir"}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">

          {/* Title block */}
          <div>
            <h1 className="text-xl font-semibold text-white leading-tight">
              {briefing.offer_name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-[#9B9BA5]">
              <span>{formatRelativeDate(briefing.created_at)}</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Ticket" value={briefing.ticket != null ? `R$ ${Number(briefing.ticket).toFixed(2)}` : "—"} />
            <MetricCard label="Vendas" value={String(briefing.sales_count)} />
            <MetricCard label="Receita" value={`R$ ${Number(briefing.revenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
          </div>

          {/* Sections */}
          <Section num="01" title="A OFERTA">
            {/* One Belief composta */}
            {(briefing.new_opportunity || briefing.desire || briefing.new_mechanism) && (
              <div className="rounded-xl border border-gold/10 bg-gold/[0.02] px-5 py-4 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gold/50 font-semibold">Crenca #1</p>
                <p className="text-[14px] text-[#E4E4E7] leading-relaxed">
                  <span className="text-nova font-semibold">{briefing.new_opportunity || "..."}</span> é a chave para <span className="text-nova font-semibold">{briefing.desire || "..."}</span>, e isso só é possível através do meu <span className="text-nova font-semibold">{briefing.new_mechanism || "..."}</span>.
                </p>
              </div>
            )}
            <Field label="Promessa central" value={briefing.promise} />
            <Field label="Protocolo / Metodo" value={briefing.protocol} />
            <Field label="Resultado tangivel" value={briefing.tangible_result} />
            <div className="grid grid-cols-2 gap-6">
              <Field label="Prazo do resultado" value={briefing.result_timeline} />
              <Field label="Prazo completo" value={briefing.full_result_timeline} />
            </div>
          </Section>

          <Section num="02" title="PRA QUEM E">
            <Field label="Publico-alvo" value={briefing.target_audience} />
            <ListField label="Dores" items={briefing.main_pains} color="danger" />
            <ListField label="Desejos" items={briefing.main_desires} color="success" />
            <ListField label="Tentativas frustradas" items={briefing.failed_attempts} color="muted" />
            <ListField label="Medos" items={briefing.fears} color="danger" />
            <ListField label="Crenças" items={briefing.beliefs} color="gold" />
            <ListField label="Padrões" items={briefing.patterns} color="gold" />
          </Section>

          <Section num="03" title="MECANISMO UNICO">
            <Field label="Causa raiz" value={briefing.root_cause} />
            <Field label="Por que nada funcionou" value={briefing.why_nothing_worked} />
            <Field label="Por que isso funciona" value={briefing.why_this_works} />
            <Field label="Nome da sindrome" value={briefing.syndrome_name} highlight />
          </Section>

          <Section num="04" title="O QUE ELA RECEBE">
            <div className="grid grid-cols-2 gap-6">
              <Field label="Nome do produto" value={briefing.product_name} />
              <Field label="Formato" value={briefing.product_format} />
            </div>
            <Field label="Conteudo" value={briefing.product_contents} />

            {Array.isArray(briefing.bonuses) && briefing.bonuses.length > 0 && (
              <div className="space-y-2">
                <FieldLabel>Bonus</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {(briefing.bonuses as string[]).map((bonus, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-gold/[0.04] border border-gold/10">
                      <Gift size={13} strokeWidth={1.5} className="text-gold/60 flex-shrink-0" />
                      <span className="text-[13px] text-white">{bonus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-6">
              <Field label="Preco" value={briefing.price != null ? `R$ ${Number(briefing.price).toFixed(2)}` : null} mono />
              <Field label="Parcelamento" value={briefing.installment_info} />
              <Field label="Garantia" value={briefing.guarantee} />
            </div>
          </Section>

          <Section num="05" title="COPY ESSENCIAL">
            <Field label="Headline principal" value={briefing.main_headline} highlight />
            {Array.isArray(briefing.alt_headlines) && briefing.alt_headlines.length > 0 && (
              <div className="space-y-2">
                <FieldLabel>Headlines alternativas</FieldLabel>
                <div className="space-y-1.5">
                  {(briefing.alt_headlines as string[]).map((h, i) => (
                    <p key={i} className="text-[13px] text-[#E4E4E7] pl-3 border-l-2 border-white/[0.06]">{h}</p>
                  ))}
                </div>
              </div>
            )}
            <Field label="Hook do quiz" value={briefing.quiz_hook} />
            <Field label="Abertura da VSL" value={briefing.vsl_opening} />
            <Field label="Frase de absolvicao" value={briefing.absolution_phrase} />
            <Field label="CTA principal" value={briefing.main_cta} highlight />
          </Section>

          <Section num="06" title="ESTRUTURA DO FUNIL">
            <Field label="Fonte de trafego" value={briefing.traffic_source} />
            <div className="grid grid-cols-2 gap-6">
              <Field label="Pagina 1 (pre-sell)" value={briefing.page_1} />
              <Field label="Pagina 2 (VSL/checkout)" value={briefing.page_2} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Pos-compra" value={briefing.post_purchase} />
              <Field label="Follow-up" value={briefing.follow_up} />
            </div>

            {(briefing.upsell_product || briefing.downsell_product) && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                {briefing.upsell_product && (
                  <div className="rounded-xl border border-gold/10 bg-gold/[0.03] p-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gold/50 font-semibold">Upsell</p>
                    <p className="text-sm text-white font-medium">{briefing.upsell_product}</p>
                    {briefing.upsell_price != null && (
                      <p className="text-sm font-mono text-gold">{`R$ ${Number(briefing.upsell_price).toFixed(2)}`}</p>
                    )}
                    {briefing.upsell_pitch && (
                      <p className="text-xs text-[#9B9BA5] leading-relaxed">{briefing.upsell_pitch}</p>
                    )}
                  </div>
                )}
                {briefing.downsell_product && (
                  <div className="rounded-xl border border-white/[0.06] bg-bg-4/30 p-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B9BA5]/50 font-semibold">Downsell</p>
                    <p className="text-sm text-white font-medium">{briefing.downsell_product}</p>
                    {briefing.downsell_price != null && (
                      <p className="text-sm font-mono text-[#E4E4E7]">{`R$ ${Number(briefing.downsell_price).toFixed(2)}`}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section num="07" title="DEEP DIVE">
            <ListField label="Baldes" items={briefing.buckets} color="gold" />

            {Array.isArray(briefing.deep_dive_phrases) && briefing.deep_dive_phrases.length > 0 ? (
              <div className="space-y-2.5">
                {(briefing.deep_dive_phrases as string[]).map((phrase, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-bg-4/20 border border-white/[0.04] px-5 py-4">
                    <Quote size={14} strokeWidth={1.5} className="text-gold/30 mt-0.5 flex-shrink-0" />
                    <p className="text-[13px] text-[#E4E4E7] italic leading-relaxed">&ldquo;{phrase}&rdquo;</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9B9BA5]">Nenhuma frase adicionada.</p>
            )}
          </Section>

        </div>
      </div>
    </div>
  );
}

// ═══ Sub-components ═══

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-gold/20 pl-5 space-y-4">
      <h3 className="text-[11px] uppercase tracking-[0.18em] text-gold/60 font-bold">
        <span className="font-mono">{num}</span>
        <span className="mx-2 text-gold/20">—</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.15em] text-[#9B9BA5] font-semibold">
      {children}
    </p>
  );
}

function Field({ label, value, mono, highlight }: { label: string; value: string | null | undefined; mono?: boolean; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <p className={cn(
        "text-[14px] leading-relaxed text-[#E4E4E7]",
        mono && "font-mono",
        highlight && "text-white font-medium"
      )}>
        {value}
      </p>
    </div>
  );
}

function ListField({ label, items, color }: { label: string; items: string[] | null | undefined; color: "danger" | "success" | "muted" | "gold" }) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return null;
  const dotColor = color === "danger" ? "bg-danger/60" : color === "success" ? "bg-success/60" : color === "gold" ? "bg-gold/60" : "bg-text-muted/40";
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-1.5">
        {arr.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 pl-1">
            <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", dotColor)} />
            <p className="text-[14px] text-[#E4E4E7] leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-bg-3/50 px-4 py-3.5">
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B9BA5] font-semibold mb-1">{label}</p>
      <p className="text-lg font-mono font-bold text-white">{value}</p>
    </div>
  );
}
