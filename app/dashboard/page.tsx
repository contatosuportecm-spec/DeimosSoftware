import LayoutApp from "@/app/layout-app";
import Link from "next/link";

/* ── Sparkline SVG decorativo ── */
function Sparkline({ up = true }: { up?: boolean }) {
  const upPath =
    "M0,18 C8,18 12,22 22,16 C32,10 38,20 48,14 C58,8 64,16 74,11 C84,6 92,12 100,9";
  const downPath =
    "M0,10 C8,10 12,6 22,12 C32,18 38,8 48,14 C58,20 64,12 74,17 C84,22 92,16 100,19";
  const d   = up ? upPath : downPath;
  const clr = up ? "#E07B30" : "#FF5C5C";

  return (
    <svg viewBox="0 0 100 28" className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${up ? "u" : "d"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={clr} stopOpacity="0.35" />
          <stop offset="100%" stopColor={clr} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={clr} strokeWidth="1.5" />
      <path d={`${d} L100,28 L0,28 Z`} fill={`url(#sg-${up ? "u" : "d"})`} />
    </svg>
  );
}

/* ── Dados estáticos ── */
const STATS = [
  { label: "Campanhas ativas",  value: "8",         change: "↑ 15% vs. semana passada", up: true  },
  { label: "Receita (MTD)",     value: "R$ 124.5k",  change: "↑ 8.4% vs. meta",          up: true  },
  { label: "Insights gerados",  value: "2.341",      change: "↑ 312 em 24h",             up: true  },
  { label: "ROAS médio",        value: "3.82x",      change: "↓ 1 oferta abaixo do alvo", up: false },
];

const TOP_OFFERS = [
  { name: "Protocolo Phoenix", roas: "4.82×", pct: 88 },
  { name: "Método Oráculo",    roas: "3.14×", pct: 64 },
  { name: "Fórmula Halcyon",   roas: "2.41×", pct: 46 },
  { name: "Blueprint Aeon",    roas: "1.88×", pct: 30 },
];

const ALERTS = [
  { msg: "Criativo A7 em fadiga — CTR caiu 34% nas últimas 48h.", sub: "Trocar hook recomendado · Phoenix", time: "2s",  dot: "bg-danger" },
  { msg: "CPA Phoenix caiu 22% após ajuste de público.",           sub: "Escalar budget em +R$ 500/dia",    time: "14s", dot: "bg-success" },
  { msg: "Nova variação sugerida para Halcyon VSL.",               sub: "Ângulo: prova social · 30s",       time: "1h",  dot: "bg-text-muted" },
];

export default function DashboardPage() {
  return (
    <LayoutApp>
      <div className="p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[23px] font-light text-text-primary leading-tight tracking-tight">
              Boa tarde,{" "}
              <span className="italic text-nova font-light">Caio.</span>
            </h1>
            <p className="text-[12px] text-text-muted mt-1.5 font-normal">
              3 campanhas pedindo atenção e 12 novos insights desde ontem.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_6px_#7CFFB2]" />
              <span className="text-[11px] text-text-muted">Sincronizado · 2min</span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-nova text-[11px] text-nova hover:text-nova transition-all font-medium">
              + Nova campanha
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="glass glass-hover rounded-xl p-4 overflow-hidden">
              <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted mb-2 font-semibold">
                {s.label}
              </p>
              <p className="text-[22px] font-mono font-medium text-text-primary leading-none">
                {s.value}
              </p>
              <p className={`text-[10px] mt-1.5 font-mono ${s.up ? "text-success" : "text-danger"}`}>
                {s.change}
              </p>
              <div className="mt-3 -mx-1">
                <Sparkline up={s.up} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Main area ── */}
        <div className="grid grid-cols-[1fr_296px] gap-4">

          {/* NOVA chat widget */}
          <div className="glass rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-nova shadow-[0_0_8px_rgba(224,123,48,0.6)]" />
                <span className="text-xs font-semibold text-text-primary tracking-widest uppercase">
                  NOVA
                </span>
              </div>
              <span className="text-[10px] text-text-muted">Contexto: Espaço Phoenix</span>
            </div>

            <div className="flex-1 p-4 space-y-4 min-h-[260px]">
              {/* Assistant */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-nova flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(224,123,48,0.4)]">
                  <span className="text-[8px] font-bold text-white">N</span>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted mb-1.5 font-medium">
                    NOVA · Direct Response Analyst
                  </p>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    Boa tarde, Caio. Analisei suas 8 campanhas ativas desta manhã.
                    <br />
                    Identifiquei{" "}
                    <span className="text-text-primary font-semibold">3 oportunidades de escala</span>{" "}
                    e{" "}
                    <span className="text-danger font-semibold">1 ponto de fadiga</span>{" "}
                    no criativo A7 do Phoenix. Por onde você quer começar?
                  </p>
                </div>
              </div>

              {/* User */}
              <div className="flex justify-end">
                <div className="rounded-xl px-3 py-2 max-w-[78%]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-[12px] text-text-primary leading-relaxed">
                    Gera 5 variações de hook para o Phoenix — nicho de finanças, tom direto, ângulo de prova social.
                  </p>
                </div>
              </div>

              {/* Thinking */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-nova flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(224,123,48,0.4)]">
                  <span className="text-[8px] font-bold text-white">N</span>
                </div>
                <p className="text-[11px] text-text-muted">
                  Trabalhando nas 5 variações agora · analisando 342 criativos top performers · ~8s
                </p>
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] p-3 space-y-2">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-white/[0.07]" style={{ background: "rgba(0,0,0,0.3)" }}>
                <input
                  className="flex-1 bg-transparent text-[12px] text-text-secondary placeholder:text-text-muted outline-none"
                  placeholder="Pergunte à NOVA, ou descreva o criativo que você precisa..."
                />
                <button className="w-6 h-6 rounded-md bg-nova flex items-center justify-center flex-shrink-0 hover:bg-nova-hover transition-colors shadow-[0_0_10px_rgba(224,123,48,0.3)]">
                  <span className="text-white text-sm leading-none">→</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {["Modelo: NOVA 2 Pro", "⭐ Nicho: Finanças", "Tom: Direto"].map((chip) => (
                  <span key={chip} className="px-2 py-1 rounded-md text-[10px] text-text-muted cursor-pointer hover:text-text-secondary transition-colors border border-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}>
                    {chip} ∨
                  </span>
                ))}
                {["Anexar", "Oferta", "Criativo"].map((c) => (
                  <span key={c} className="px-2 py-1 rounded-md text-[10px] text-text-muted cursor-pointer hover:text-text-secondary transition-colors border border-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}>
                    {c}
                  </span>
                ))}
                <span className="ml-auto text-[10px] text-text-muted">⌘↵ enviar</span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Top Ofertas */}
            <div className="glass glass-hover rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-semibold">
                  Top ofertas · ROAS
                </p>
                <Link href="/spy" className="text-[10px] text-text-muted hover:text-gold transition-colors">
                  Ver tudo →
                </Link>
              </div>
              <div className="space-y-3.5">
                {TOP_OFFERS.map((offer, i) => (
                  <div key={offer.name} className="flex items-center gap-2.5">
                    <span className="text-[9px] text-text-muted font-mono w-4 flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-text-secondary truncate mb-1 font-medium">
                        {offer.name}
                      </p>
                      <div className="h-px rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="h-full rounded" style={{ width: `${offer.pct}%`, background: `rgba(224,123,48,${0.3 + (offer.pct / 200)})` }} />
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-text-primary flex-shrink-0 font-medium">
                      {offer.roas}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas */}
            <div className="glass glass-hover rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-semibold">
                  Alertas inteligentes
                </p>
                <button className="text-[10px] text-text-muted hover:text-text-secondary transition-colors">
                  Filtrar ▽
                </button>
              </div>
              <div className="space-y-3.5">
                {ALERTS.map((alert, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${alert.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-text-secondary leading-snug font-medium">
                        {alert.msg}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">{alert.sub}</p>
                    </div>
                    <span className="text-[9px] text-text-muted flex-shrink-0">{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutApp>
  );
}
