"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { CreateOfferBriefingInput, OfferBriefing } from "@/types";
import { cn } from "@/lib/utils";

interface BriefingFormProps {
  initialData?: OfferBriefing | null;
  onSubmit: (input: CreateOfferBriefingInput) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

const STEPS = [
  { num: 1, title: "A Oferta",          desc: "Dados principais e promessa" },
  { num: 2, title: "Pra Quem E",        desc: "Publico-alvo e dores" },
  { num: 3, title: "Mecanismo Unico",   desc: "Diferencial e causa raiz" },
  { num: 4, title: "O Que Recebe",      desc: "Produto, bonus e preco" },
  { num: 5, title: "Copy Essencial",    desc: "Headlines e CTAs" },
  { num: 6, title: "Estrutura do Funil", desc: "Trafego e paginas" },
  { num: 7, title: "Deep Dive",         desc: "Frases do publico" },
];

function safeArr(val: unknown, fallback: string[]): string[] {
  return Array.isArray(val) && val.length > 0 ? val : fallback;
}

function getInitialForm(data?: OfferBriefing | null): Record<string, string | string[]> {
  if (!data) return {
    offer_name: "", niche: "geral", ticket: "",
    new_opportunity: "", desire: "", new_mechanism: "",
    promise: "", protocol: "", tangible_result: "",
    result_timeline: "", full_result_timeline: "",
    target_audience: "",
    main_pains: [""] as string[],
    main_desires: [""] as string[],
    failed_attempts: [""] as string[],
    fears: [""] as string[],
    beliefs: [""] as string[],
    patterns: [""] as string[],
    root_cause: "", why_nothing_worked: "", why_this_works: "", syndrome_name: "",
    product_name: "", product_format: "", product_contents: "",
    bonuses: [] as string[], price: "", installment_info: "", guarantee: "",
    main_headline: "", alt_headlines: ["", "", ""] as string[],
    quiz_hook: "", vsl_opening: "", absolution_phrase: "", main_cta: "",
    traffic_source: "", page_1: "", page_2: "", post_purchase: "", follow_up: "",
    upsell_product: "", upsell_price: "", upsell_pitch: "",
    downsell_product: "", downsell_price: "",
    buckets: [""] as string[],
    deep_dive_phrases: ["", "", "", "", ""] as string[],
  };

  return {
    offer_name: data.offer_name || "",
    niche: data.niche || "geral",
    ticket: data.ticket != null ? String(data.ticket) : "",

    new_opportunity: data.new_opportunity || "",
    desire: data.desire || "",
    new_mechanism: data.new_mechanism || "",
    promise: data.promise || "",
    protocol: data.protocol || "",
    tangible_result: data.tangible_result || "",
    result_timeline: data.result_timeline || "",
    full_result_timeline: data.full_result_timeline || "",
    target_audience: data.target_audience || "",
    main_pains: safeArr(data.main_pains, [""]),
    main_desires: safeArr(data.main_desires, [""]),
    failed_attempts: safeArr(data.failed_attempts, [""]),
    fears: safeArr(data.fears, [""]),
    beliefs: safeArr(data.beliefs, [""]),
    patterns: safeArr(data.patterns, [""]),
    root_cause: data.root_cause || "",
    why_nothing_worked: data.why_nothing_worked || "",
    why_this_works: data.why_this_works || "",
    syndrome_name: data.syndrome_name || "",
    product_name: data.product_name || "",
    product_format: data.product_format || "",
    product_contents: data.product_contents || "",
    bonuses: safeArr(data.bonuses, []),
    price: data.price != null ? String(data.price) : "",
    installment_info: data.installment_info || "",
    guarantee: data.guarantee || "",
    main_headline: data.main_headline || "",
    alt_headlines: safeArr(data.alt_headlines, ["", "", ""]),
    quiz_hook: data.quiz_hook || "",
    vsl_opening: data.vsl_opening || "",
    absolution_phrase: data.absolution_phrase || "",
    main_cta: data.main_cta || "",
    traffic_source: data.traffic_source || "",
    page_1: data.page_1 || "",
    page_2: data.page_2 || "",
    post_purchase: data.post_purchase || "",
    follow_up: data.follow_up || "",
    upsell_product: data.upsell_product || "",
    upsell_price: data.upsell_price != null ? String(data.upsell_price) : "",
    upsell_pitch: data.upsell_pitch || "",
    downsell_product: data.downsell_product || "",
    downsell_price: data.downsell_price != null ? String(data.downsell_price) : "",
    buckets: safeArr(data.buckets, [""]),
    deep_dive_phrases: (() => {
      const arr = safeArr(data.deep_dive_phrases, []);
      return arr.length >= 5 ? arr : [...arr, ...Array(5 - arr.length).fill("")];
    })(),
  };
}

function buildInput(form: Record<string, string | string[]>): CreateOfferBriefingInput {
  const s = (key: string) => (form[key] as string).trim();
  const n = (key: string) => { const v = parseFloat(form[key] as string); return isNaN(v) ? undefined : v; };
  const a = (key: string) => (form[key] as string[]).filter((v) => v.trim());

  return {
    offer_name: s("offer_name"),
    niche: s("niche") || "geral",
    ...(n("ticket") !== undefined && { ticket: n("ticket") }),

    ...(s("new_opportunity") && { new_opportunity: s("new_opportunity") }),
    ...(s("desire") && { desire: s("desire") }),
    ...(s("new_mechanism") && { new_mechanism: s("new_mechanism") }),
    ...(s("promise") && { promise: s("promise") }),
    ...(s("protocol") && { protocol: s("protocol") }),
    ...(s("tangible_result") && { tangible_result: s("tangible_result") }),
    ...(s("result_timeline") && { result_timeline: s("result_timeline") }),
    ...(s("full_result_timeline") && { full_result_timeline: s("full_result_timeline") }),
    ...(s("target_audience") && { target_audience: s("target_audience") }),
    main_pains: a("main_pains"),
    main_desires: a("main_desires"),
    failed_attempts: a("failed_attempts"),
    fears: a("fears"),
    beliefs: a("beliefs"),
    patterns: a("patterns"),
    ...(s("root_cause") && { root_cause: s("root_cause") }),
    ...(s("why_nothing_worked") && { why_nothing_worked: s("why_nothing_worked") }),
    ...(s("why_this_works") && { why_this_works: s("why_this_works") }),
    ...(s("syndrome_name") && { syndrome_name: s("syndrome_name") }),
    ...(s("product_name") && { product_name: s("product_name") }),
    ...(s("product_format") && { product_format: s("product_format") }),
    ...(s("product_contents") && { product_contents: s("product_contents") }),
    bonuses: a("bonuses"),
    ...(n("price") !== undefined && { price: n("price") }),
    ...(s("installment_info") && { installment_info: s("installment_info") }),
    ...(s("guarantee") && { guarantee: s("guarantee") }),
    ...(s("main_headline") && { main_headline: s("main_headline") }),
    alt_headlines: a("alt_headlines"),
    ...(s("quiz_hook") && { quiz_hook: s("quiz_hook") }),
    ...(s("vsl_opening") && { vsl_opening: s("vsl_opening") }),
    ...(s("absolution_phrase") && { absolution_phrase: s("absolution_phrase") }),
    ...(s("main_cta") && { main_cta: s("main_cta") }),
    ...(s("traffic_source") && { traffic_source: s("traffic_source") }),
    ...(s("page_1") && { page_1: s("page_1") }),
    ...(s("page_2") && { page_2: s("page_2") }),
    ...(s("post_purchase") && { post_purchase: s("post_purchase") }),
    ...(s("follow_up") && { follow_up: s("follow_up") }),
    ...(s("upsell_product") && { upsell_product: s("upsell_product") }),
    ...(n("upsell_price") !== undefined && { upsell_price: n("upsell_price") }),
    ...(s("upsell_pitch") && { upsell_pitch: s("upsell_pitch") }),
    ...(s("downsell_product") && { downsell_product: s("downsell_product") }),
    ...(n("downsell_price") !== undefined && { downsell_price: n("downsell_price") }),
    buckets: a("buckets"),
    deep_dive_phrases: a("deep_dive_phrases"),
  };
}

export default function BriefingForm({ initialData, onSubmit, onCancel, loading, error }: BriefingFormProps) {
  const isEdit = !!initialData;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => getInitialForm(initialData));

  useEffect(() => {
    setForm(getInitialForm(initialData));
    setStep(1);
  }, [initialData]);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setArr(key: string, index: number, value: string) {
    setForm((prev) => {
      const arr = [...(prev[key] as string[])];
      arr[index] = value;
      return { ...prev, [key]: arr };
    });
  }

  function addBonus() {
    setForm((prev) => ({ ...prev, bonuses: [...(prev.bonuses as string[]), ""] }));
  }

  function removeBonus(index: number) {
    setForm((prev) => ({ ...prev, bonuses: (prev.bonuses as string[]).filter((_, i) => i !== index) }));
  }

  const canSubmit = (form.offer_name as string).trim().length > 0;

  return (
    <div className="flex h-full">

      {/* ── Sidebar Steps ── */}
      <div className="w-56 flex-shrink-0 border-r border-border bg-bg-2/50 flex flex-col">
        <div className="px-5 pt-5 pb-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors mb-5"
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Voltar
          </button>
          <h2 className="text-xs font-semibold text-text-primary tracking-wide">
            {isEdit ? "Editar Oferta" : "Nova Oferta"}
          </h2>
          <p className="text-[10px] text-text-muted mt-0.5">Passo {step} de 7</p>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {STEPS.map((s) => {
            const isCurrent = step === s.num;
            const isPast = step > s.num;
            return (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                  isCurrent
                    ? "bg-gold/8 border border-gold/15"
                    : "border border-transparent hover:bg-white/[0.03]"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold mt-px transition-colors",
                  isCurrent
                    ? "bg-gold text-black"
                    : isPast
                      ? "bg-success/15 text-success border border-success/20"
                      : "bg-bg-4 text-text-muted border border-white/[0.06]"
                )}>
                  {isPast ? <Check size={11} strokeWidth={2.5} /> : String(s.num).padStart(2, "0")}
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    "text-[11px] font-medium leading-tight truncate",
                    isCurrent ? "text-text-primary" : "text-text-secondary"
                  )}>
                    {s.title}
                  </p>
                  <p className="text-[9px] text-text-muted mt-0.5 leading-tight truncate">
                    {s.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Progress bar */}
        <div className="px-5 pb-4 pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-text-muted uppercase tracking-wider">Progresso</span>
            <span className="text-[10px] font-mono text-text-secondary">{Math.round((step / 7) * 100)}%</span>
          </div>
          <div className="h-1 rounded-full bg-bg-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Step Header */}
        <div className="px-8 pt-6 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-gold bg-gold/10 border border-gold/15 rounded-md px-2 py-1">
              {String(step).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{STEPS[step - 1].title}</h3>
              <p className="text-[11px] text-text-muted mt-0.5">{STEPS[step - 1].desc}</p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-2xl space-y-5">

            {step === 1 && (
              <>
                <FormField label="Nome da oferta" required>
                  <FormInput placeholder="Ex: Protocolo Definicao Total" value={form.offer_name as string} onChange={(v) => set("offer_name", v)} disabled={loading} />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Nicho">
                    <FormInput placeholder="emagrecimento" value={form.niche as string} onChange={(v) => set("niche", v)} disabled={loading} />
                  </FormField>
                  <FormField label="Ticket (R$)">
                    <FormInput placeholder="97.00" type="number" value={form.ticket as string} onChange={(v) => set("ticket", v)} disabled={loading} />
                  </FormField>
                </div>

                {/* One Belief estruturada */}
                <div className="rounded-xl border border-gold/10 bg-gold/[0.02] p-4 space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-gold/60 font-semibold">Crenca #1</p>
                  <p className="text-[12px] text-text-muted leading-relaxed">
                    <strong className={cn("transition-colors", (form.new_opportunity as string) ? "text-nova" : "text-nova/30")}>{(form.new_opportunity as string) || "[Nova Oportunidade]"}</strong> é a chave para <strong className={cn("transition-colors", (form.desire as string) ? "text-nova" : "text-nova/30")}>{(form.desire as string) || "[Desejo]"}</strong>, e isso só é possível através do meu <strong className={cn("transition-colors", (form.new_mechanism as string) ? "text-nova" : "text-nova/30")}>{(form.new_mechanism as string) || "[Novo Mecanismo]"}</strong>.
                  </p>
                  <FormField label="Nova Oportunidade">
                    <FormInput placeholder="Ex: Protocolo de Reprogramacao Metabolica" value={form.new_opportunity as string} onChange={(v) => set("new_opportunity", v)} disabled={loading} />
                  </FormField>
                  <FormField label="Desejo">
                    <FormInput placeholder="Ex: emagrecer 10kg sem dieta restritiva" value={form.desire as string} onChange={(v) => set("desire", v)} disabled={loading} />
                  </FormField>
                  <FormField label="Novo Mecanismo">
                    <FormInput placeholder="Ex: Metodo de Micronutricao Celular em 3 Fases" value={form.new_mechanism as string} onChange={(v) => set("new_mechanism", v)} disabled={loading} />
                  </FormField>
                </div>
                <FormField label="Promessa central" hint="O que a oferta promete entregar">
                  <FormTextarea placeholder="Essa oferta promete..." value={form.promise as string} onChange={(v) => set("promise", v)} disabled={loading} />
                </FormField>
                <FormField label="Protocolo / Metodo">
                  <FormTextarea placeholder="Nome e descricao do metodo" value={form.protocol as string} onChange={(v) => set("protocol", v)} disabled={loading} />
                </FormField>
                <FormField label="Resultado tangivel" hint="O resultado concreto e mensuravel">
                  <FormTextarea placeholder="O cliente vai conseguir..." value={form.tangible_result as string} onChange={(v) => set("tangible_result", v)} disabled={loading} />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Prazo do resultado">
                    <FormInput placeholder="Ex: 21 dias" value={form.result_timeline as string} onChange={(v) => set("result_timeline", v)} disabled={loading} />
                  </FormField>
                  <FormField label="Prazo resultado completo">
                    <FormInput placeholder="Ex: 90 dias" value={form.full_result_timeline as string} onChange={(v) => set("full_result_timeline", v)} disabled={loading} />
                  </FormField>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <FormField label="Publico-alvo" hint="Descreva quem e o cliente ideal em detalhes">
                  <FormTextarea placeholder="Mulheres de 35-55 anos que..." value={form.target_audience as string} onChange={(v) => set("target_audience", v)} disabled={loading} rows={3} />
                </FormField>

                <DynamicList
                  label="Dores"
                  hint="Quais as maiores frustracoes e sofrimentos?"
                  items={form.main_pains as string[]}
                  placeholder="Ex: Nao consegue emagrecer mesmo fazendo dieta"
                  onAdd={() => setForm((p) => ({ ...p, main_pains: [...(p.main_pains as string[]), ""] }))}
                  onRemove={(i) => setForm((p) => ({ ...p, main_pains: (p.main_pains as string[]).filter((_, idx) => idx !== i) }))}
                  onChange={(i, v) => setArr("main_pains", i, v)}
                  disabled={loading}
                />

                <DynamicList
                  label="Desejos"
                  hint="O que mais deseja conquistar?"
                  items={form.main_desires as string[]}
                  placeholder="Ex: Emagrecer sem passar fome"
                  onAdd={() => setForm((p) => ({ ...p, main_desires: [...(p.main_desires as string[]), ""] }))}
                  onRemove={(i) => setForm((p) => ({ ...p, main_desires: (p.main_desires as string[]).filter((_, idx) => idx !== i) }))}
                  onChange={(i, v) => setArr("main_desires", i, v)}
                  disabled={loading}
                />

                <DynamicList
                  label="Tentativas frustradas"
                  hint="O que ja tentou e nao funcionou?"
                  items={form.failed_attempts as string[]}
                  placeholder="Ex: Ja tentou dieta restritiva e nao manteve"
                  onAdd={() => setForm((p) => ({ ...p, failed_attempts: [...(p.failed_attempts as string[]), ""] }))}
                  onRemove={(i) => setForm((p) => ({ ...p, failed_attempts: (p.failed_attempts as string[]).filter((_, idx) => idx !== i) }))}
                  onChange={(i, v) => setArr("failed_attempts", i, v)}
                  disabled={loading}
                />

                <DynamicList
                  label="Medos"
                  hint="O que o público tem medo que aconteça?"
                  items={form.fears as string[]}
                  placeholder="Ex: Medo de engordar ainda mais"
                  onAdd={() => setForm((p) => ({ ...p, fears: [...(p.fears as string[]), ""] }))}
                  onRemove={(i) => setForm((p) => ({ ...p, fears: (p.fears as string[]).filter((_, idx) => idx !== i) }))}
                  onChange={(i, v) => setArr("fears", i, v)}
                  disabled={loading}
                />

                <DynamicList
                  label="Crenças"
                  hint="No que o público acredita que é verdade?"
                  items={form.beliefs as string[]}
                  placeholder="Ex: Acredita que metabolismo lento é genético"
                  onAdd={() => setForm((p) => ({ ...p, beliefs: [...(p.beliefs as string[]), ""] }))}
                  onRemove={(i) => setForm((p) => ({ ...p, beliefs: (p.beliefs as string[]).filter((_, idx) => idx !== i) }))}
                  onChange={(i, v) => setArr("beliefs", i, v)}
                  disabled={loading}
                />

                <DynamicList
                  label="Padrões"
                  hint="Comportamentos e hábitos recorrentes do público"
                  items={form.patterns as string[]}
                  placeholder="Ex: Começa dieta na segunda e desiste na quarta"
                  onAdd={() => setForm((p) => ({ ...p, patterns: [...(p.patterns as string[]), ""] }))}
                  onRemove={(i) => setForm((p) => ({ ...p, patterns: (p.patterns as string[]).filter((_, idx) => idx !== i) }))}
                  onChange={(i, v) => setArr("patterns", i, v)}
                  disabled={loading}
                />
              </>
            )}

            {step === 3 && (
              <>
                <FormField label="Causa raiz" hint="Por que o problema realmente existe?">
                  <FormTextarea placeholder="O verdadeiro motivo por tras do problema e..." value={form.root_cause as string} onChange={(v) => set("root_cause", v)} disabled={loading} rows={3} />
                </FormField>
                <FormField label="Por que nada funcionou" hint="Por que as solucoes anteriores falharam?">
                  <FormTextarea placeholder="Nada funcionou porque..." value={form.why_nothing_worked as string} onChange={(v) => set("why_nothing_worked", v)} disabled={loading} rows={3} />
                </FormField>
                <FormField label="Por que isso funciona" hint="O diferencial da sua solucao">
                  <FormTextarea placeholder="Isso funciona porque ataca a causa raiz..." value={form.why_this_works as string} onChange={(v) => set("why_this_works", v)} disabled={loading} rows={3} />
                </FormField>
                <FormField label="Nome da sindrome / inimigo" hint="O vilao da historia da oferta">
                  <FormInput placeholder="Ex: Sindrome do Metabolismo Travado" value={form.syndrome_name as string} onChange={(v) => set("syndrome_name", v)} disabled={loading} />
                </FormField>
              </>
            )}

            {step === 4 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Nome do produto">
                    <FormInput placeholder="Ex: Guia Definicao Total" value={form.product_name as string} onChange={(v) => set("product_name", v)} disabled={loading} />
                  </FormField>
                  <FormField label="Formato">
                    <FormInput placeholder="E-book, Curso, App..." value={form.product_format as string} onChange={(v) => set("product_format", v)} disabled={loading} />
                  </FormField>
                </div>
                <FormField label="Conteudo" hint="O que tem dentro? Modulos, capitulos...">
                  <FormTextarea placeholder="Modulo 1: ..., Modulo 2: ..." value={form.product_contents as string} onChange={(v) => set("product_contents", v)} disabled={loading} rows={3} />
                </FormField>

                {/* Bonuses */}
                <FormField label="Bonus">
                  <div className="space-y-2">
                    {(form.bonuses as string[]).map((bonus, i) => (
                      <div key={i} className="flex gap-2">
                        <FormInput placeholder={`Bonus ${i + 1} — Ex: Planilha de acompanhamento`} value={bonus} onChange={(v) => setArr("bonuses", i, v)} disabled={loading} />
                        <button
                          type="button"
                          onClick={() => removeBonus(i)}
                          className="p-2.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/8 transition-all flex-shrink-0"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addBonus}
                      className="flex items-center gap-1.5 text-[11px] text-gold hover:text-gold-hover transition-colors font-medium"
                    >
                      <Plus size={12} strokeWidth={2} />
                      Adicionar bonus
                    </button>
                  </div>
                </FormField>

                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Preco (R$)">
                    <FormInput placeholder="97.00" type="number" value={form.price as string} onChange={(v) => set("price", v)} disabled={loading} />
                  </FormField>
                  <FormField label="Parcelamento">
                    <FormInput placeholder="12x de R$ 9,70" value={form.installment_info as string} onChange={(v) => set("installment_info", v)} disabled={loading} />
                  </FormField>
                  <FormField label="Garantia">
                    <FormInput placeholder="7 dias" value={form.guarantee as string} onChange={(v) => set("guarantee", v)} disabled={loading} />
                  </FormField>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <FormField label="Headline principal" hint="A headline matadora da VSL ou pagina">
                  <FormTextarea placeholder="Descubra o metodo que..." value={form.main_headline as string} onChange={(v) => set("main_headline", v)} disabled={loading} />
                </FormField>
                <FormField label="Headlines alternativas">
                  <div className="space-y-2">
                    {(form.alt_headlines as string[]).map((h, i) => (
                      <FormInput key={i} placeholder={`Alternativa ${i + 1}`} value={h} onChange={(v) => setArr("alt_headlines", i, v)} disabled={loading} />
                    ))}
                  </div>
                </FormField>
                <FormField label="Hook do quiz" hint="Pergunta isca para pre-qualificar">
                  <FormTextarea placeholder="Voce sabia que 87% das pessoas..." value={form.quiz_hook as string} onChange={(v) => set("quiz_hook", v)} disabled={loading} />
                </FormField>
                <FormField label="Abertura da VSL" hint="Primeiros 30 segundos do video">
                  <FormTextarea placeholder="Se voce esta assistindo esse video..." value={form.vsl_opening as string} onChange={(v) => set("vsl_opening", v)} disabled={loading} rows={3} />
                </FormField>
                <FormField label="Frase de absolvicao" hint="Tirando a culpa do lead">
                  <FormTextarea placeholder="Nao e culpa sua. O problema real e..." value={form.absolution_phrase as string} onChange={(v) => set("absolution_phrase", v)} disabled={loading} />
                </FormField>
                <FormField label="CTA principal">
                  <FormInput placeholder="Ex: Quero meu acesso agora" value={form.main_cta as string} onChange={(v) => set("main_cta", v)} disabled={loading} />
                </FormField>
              </>
            )}

            {step === 6 && (
              <>
                <FormField label="Fonte de trafego">
                  <FormInput placeholder="Facebook Ads, Google Ads, TikTok..." value={form.traffic_source as string} onChange={(v) => set("traffic_source", v)} disabled={loading} />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Pagina 1 (pre-sell)">
                    <FormInput placeholder="Quiz, artigo, LP..." value={form.page_1 as string} onChange={(v) => set("page_1", v)} disabled={loading} />
                  </FormField>
                  <FormField label="Pagina 2 (VSL/checkout)">
                    <FormInput placeholder="VSL, checkout direto..." value={form.page_2 as string} onChange={(v) => set("page_2", v)} disabled={loading} />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Pos-compra">
                    <FormInput placeholder="Obrigado, area de membros..." value={form.post_purchase as string} onChange={(v) => set("post_purchase", v)} disabled={loading} />
                  </FormField>
                  <FormField label="Follow-up">
                    <FormInput placeholder="Email, WhatsApp..." value={form.follow_up as string} onChange={(v) => set("follow_up", v)} disabled={loading} />
                  </FormField>
                </div>

                <div className="pt-3 border-t border-white/[0.04]">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gold/60 font-semibold mb-4">Upsell</p>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <FormField label="Produto upsell">
                      <FormInput placeholder="Pacote Premium" value={form.upsell_product as string} onChange={(v) => set("upsell_product", v)} disabled={loading} />
                    </FormField>
                    <FormField label="Preco upsell (R$)">
                      <FormInput placeholder="197.00" type="number" value={form.upsell_price as string} onChange={(v) => set("upsell_price", v)} disabled={loading} />
                    </FormField>
                  </div>
                  <FormField label="Pitch do upsell">
                    <FormTextarea placeholder="Como vender o upsell..." value={form.upsell_pitch as string} onChange={(v) => set("upsell_pitch", v)} disabled={loading} />
                  </FormField>
                </div>

                <div className="pt-3 border-t border-white/[0.04]">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted/50 font-semibold mb-4">Downsell</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Produto downsell">
                      <FormInput placeholder="Versao Lite" value={form.downsell_product as string} onChange={(v) => set("downsell_product", v)} disabled={loading} />
                    </FormField>
                    <FormField label="Preco downsell (R$)">
                      <FormInput placeholder="47.00" type="number" value={form.downsell_price as string} onChange={(v) => set("downsell_price", v)} disabled={loading} />
                    </FormField>
                  </div>
                </div>
              </>
            )}

            {step === 7 && (
              <>
                <DynamicList
                  label="Baldes"
                  hint="Segmentos ou grupos dentro do seu publico-alvo"
                  items={form.buckets as string[]}
                  placeholder="Ex: Mulheres 40+ que ja tentaram dieta restritiva"
                  onAdd={() => setForm((p) => ({ ...p, buckets: [...(p.buckets as string[]), ""] }))}
                  onRemove={(i) => setForm((p) => ({ ...p, buckets: (p.buckets as string[]).filter((_, idx) => idx !== i) }))}
                  onChange={(i, v) => setArr("buckets", i, v)}
                  disabled={loading}
                />

                <div className="pt-3 border-t border-white/[0.04]" />

                <p className="text-xs text-text-secondary leading-relaxed">
                  Frases reais que o seu publico usa em comentarios, reviews, foruns e grupos.
                  Essas frases sao ouro para copy e criativos.
                </p>
                <DynamicList
                  label="Frases do publico"
                  hint="Frases reais de comentarios, reviews e grupos"
                  items={form.deep_dive_phrases as string[]}
                  placeholder={`"Ja tentei de tudo e nada funciona..."`}
                  onAdd={() => setForm((p) => ({ ...p, deep_dive_phrases: [...(p.deep_dive_phrases as string[]), ""] }))}
                  onRemove={(i) => setForm((p) => ({ ...p, deep_dive_phrases: (p.deep_dive_phrases as string[]).filter((_, idx) => idx !== i) }))}
                  onChange={(i, v) => setArr("deep_dive_phrases", i, v)}
                  disabled={loading}
                />
              </>
            )}

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-8 pb-0 flex-shrink-0">
            <p className="text-xs text-danger bg-danger/8 border border-danger/15 rounded-lg px-4 py-2.5">
              {error}
            </p>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-border flex-shrink-0 bg-bg-2/30">
          <div>
            {step > 1 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} disabled={loading}>
                <ArrowLeft size={13} strokeWidth={1.5} />
                Anterior
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {step < 7 ? (
              <Button size="sm" onClick={() => setStep(step + 1)}>
                Proximo
                <ArrowRight size={13} strokeWidth={1.5} />
              </Button>
            ) : (
              <Button size="sm" onClick={() => onSubmit(buildInput(form))} disabled={loading || !canSubmit}>
                {loading ? "Salvando..." : isEdit ? "Salvar Alteracoes" : "Criar Oferta"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ Form primitives ═══

function FormField({ label, hint, required, children }: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="text-[11px] uppercase tracking-[0.12em] text-text-secondary font-semibold">
          {label}
          {required && <span className="text-gold ml-1">*</span>}
        </label>
        {hint && (
          <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{hint}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function FormInput({ placeholder, value, onChange, disabled, type }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  type?: string;
}) {
  return (
    <input
      type={type || "text"}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-bg-1 border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted/50 transition-all focus:outline-none focus:ring-1 focus:border-gold/30 focus:ring-gold/10 hover:border-white/[0.12] disabled:opacity-40"
    />
  );
}

function DynamicList({ label, hint, items, placeholder, onAdd, onRemove, onChange, disabled }: {
  label: string;
  hint?: string;
  items: string[];
  placeholder: string;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, v: string) => void;
  disabled: boolean;
}) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <FormField label={label} hint={hint}>
      <div className="space-y-2">
        {safeItems.map((item, i) => (
          <div key={i} className="flex gap-2">
            <FormInput placeholder={placeholder} value={item} onChange={(v) => onChange(i, v)} disabled={disabled} />
            {safeItems.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="p-2.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/8 transition-all flex-shrink-0"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 text-[11px] text-gold hover:text-gold-hover transition-colors font-medium"
        >
          <Plus size={12} strokeWidth={2} />
          Adicionar
        </button>
      </div>
    </FormField>
  );
}

function FormTextarea({ placeholder, value, onChange, disabled, rows }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  rows?: number;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={rows ?? 2}
      className="w-full bg-bg-1 border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted/50 transition-all focus:outline-none focus:ring-1 focus:border-gold/30 focus:ring-gold/10 hover:border-white/[0.12] disabled:opacity-40 resize-none leading-relaxed"
    />
  );
}
