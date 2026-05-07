import LayoutApp from "@/app/layout-app";
import Link from "next/link";

const STATS = [
  { label: "Ofertas monitoradas", value: "—", sub: "Adicione ofertas no Spy" },
  { label: "Receita (MTD)",       value: "—", sub: "Sem dados ainda"         },
  { label: "Insights gerados",    value: "—", sub: "Sem dados ainda"         },
  { label: "ROAS médio",          value: "—", sub: "Sem dados ainda"         },
];

export default function DashboardPage() {
  return (
    <LayoutApp>
      <div className="p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[23px] font-light text-text-primary leading-tight tracking-tight">
              Bem-vindo,{" "}
              <span className="italic text-nova font-light">Caio.</span>
            </h1>
            <p className="text-[12px] text-text-muted mt-1.5 font-normal">
              Adicione suas ofertas no Spy para começar a monitorar.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted/40" />
              <span className="text-[11px] text-text-muted">Sem dados ativos</span>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="glass glass-hover rounded-xl p-4 overflow-hidden">
              <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted mb-2 font-semibold">
                {s.label}
              </p>
              <p className="text-[22px] font-mono font-medium text-text-muted/40 leading-none">
                {s.value}
              </p>
              <p className="text-[10px] mt-1.5 font-mono text-text-muted/60">
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Main area ── */}
        <div className="grid grid-cols-[1fr_296px] gap-4">

          {/* NOVA chat widget */}
          <div className="glass rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-nova shadow-[0_0_8px_rgba(255,138,31,0.6)]" />
                <span className="text-xs font-semibold text-text-primary tracking-widest uppercase">
                  NOVA
                </span>
              </div>
              <span className="text-[10px] text-text-muted">Direct Response Analyst</span>
            </div>

            <div className="flex-1 p-4 flex items-center justify-center min-h-[260px]">
              <div className="text-center space-y-2">
                <p className="text-[12px] text-text-muted">
                  Adicione ofertas no Spy para ativar análise automática.
                </p>
                <Link href="/spy" className="text-[11px] text-gold hover:text-gold-hover transition-colors">
                  Ir para o Spy →
                </Link>
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] p-3 space-y-2">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-white/[0.07]" style={{ background: "rgba(0,0,0,0.3)" }}>
                <input
                  className="flex-1 bg-transparent text-[12px] text-text-secondary placeholder:text-text-muted outline-none"
                  placeholder="Pergunte à NOVA, ou descreva o criativo que você precisa..."
                />
                <button className="w-6 h-6 rounded-md bg-nova flex items-center justify-center flex-shrink-0 hover:bg-nova-hover transition-colors shadow-[0_0_10px_rgba(255,138,31,0.3)]">
                  <span className="text-white text-sm leading-none">→</span>
                </button>
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
                  Adicionar →
                </Link>
              </div>
              <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                <p className="text-[11px] text-text-muted/60">Nenhuma oferta monitorada</p>
                <Link href="/spy" className="text-[10px] text-gold/70 hover:text-gold transition-colors">
                  Ir para o Spy
                </Link>
              </div>
            </div>

            {/* Alertas */}
            <div className="glass glass-hover rounded-xl p-4">
              <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-semibold mb-4">
                Alertas inteligentes
              </p>
              <div className="flex items-center justify-center py-6">
                <p className="text-[11px] text-text-muted/60">Nenhum alerta ativo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutApp>
  );
}
