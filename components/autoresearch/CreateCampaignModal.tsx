"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { COPYWRITERS } from "@/lib/copywriters";
import type { CreateCampaignInput, ElementType } from "@/types/autoresearch";
import type { OfferBriefing } from "@/types";

interface CreateCampaignModalProps {
  briefings: OfferBriefing[];
  onClose: () => void;
  onCreate: (input: CreateCampaignInput) => Promise<void>;
}

const ELEMENT_TYPES: { value: ElementType; label: string }[] = [
  { value: "headline", label: "Headline" },
  { value: "cta", label: "CTA" },
  { value: "hook", label: "Hook" },
  { value: "mechanism", label: "Mecanismo" },
  { value: "quiz_hook", label: "Quiz Hook" },
];

export default function CreateCampaignModal({ briefings, onClose, onCreate }: CreateCampaignModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    briefing_id: "",
    element_type: "headline" as ElementType,
    vturb_video_id: "",
    vturb_api_key: "",
    deploy_repo: "",
    deploy_branch: "main",
    deploy_file_path: "",
    min_sessions: 200,
    min_improvement_pct: 2.0,
    max_iterations: 50,
    iteration_hours: 48,
    require_approval: false,
    simulate_mode: false,
    copywriter_id: "gary-halbert",
    current_value: "",
    baseline_play_rate: 0,
  });

  const set = (key: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    const needsDeploy = !form.simulate_mode;
    if (!form.name || (needsDeploy && (!form.vturb_video_id || !form.deploy_repo || !form.deploy_file_path))) return;
    setSubmitting(true);
    try {
      await onCreate({
        ...form,
        briefing_id: form.briefing_id || undefined,
        vturb_video_id: form.vturb_video_id || "simulate",
        deploy_repo: form.deploy_repo || "simulate/repo",
        deploy_file_path: form.deploy_file_path || "simulate.txt",
        vturb_api_key: form.vturb_api_key || undefined,
        baseline_play_rate: form.baseline_play_rate || undefined,
        current_value: form.current_value || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-bg-1 border border-white/[0.07] rounded-lg px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-nova/40 transition-colors";
  const labelClass = "text-[9px] uppercase tracking-[0.15em] text-text-muted mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-bg-2 border border-white/[0.07] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h2 className="text-[14px] font-semibold text-text-primary">Nova Campanha AutoResearch</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.05] transition-colors">
            <X size={16} strokeWidth={1.5} className="text-text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Nome da campanha</label>
            <input className={inputClass} placeholder="Ex: VSL Principal — Headline" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          {/* Simulate Mode */}
          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <input
              type="checkbox"
              checked={form.simulate_mode}
              onChange={(e) => set("simulate_mode", e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/20 bg-bg-1 accent-amber-400"
            />
            <div>
              <span className="text-[11px] text-amber-400 font-medium">Modo Simulacao</span>
              <p className="text-[9px] text-text-muted mt-0.5">Pula VTurb e GitHub. Gera metricas fake para testar o fluxo completo.</p>
            </div>
          </label>

          {/* Briefing + Element */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Briefing</label>
              <select className={inputClass} value={form.briefing_id} onChange={(e) => set("briefing_id", e.target.value)}>
                <option value="">Nenhum</option>
                {briefings.map((b) => (
                  <option key={b.id} value={b.id}>{b.offer_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Elemento</label>
              <select className={inputClass} value={form.element_type} onChange={(e) => set("element_type", e.target.value)}>
                {ELEMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* VTurb + Deploy — hidden in simulate mode */}
          {!form.simulate_mode && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>VTurb Video ID</label>
                  <input className={inputClass} placeholder="abc123" value={form.vturb_video_id} onChange={(e) => set("vturb_video_id", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>VTurb API Key (opcional)</label>
                  <input className={inputClass} placeholder="Usa env se vazio" value={form.vturb_api_key} onChange={(e) => set("vturb_api_key", e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Repo GitHub (owner/repo)</label>
                <input className={inputClass} placeholder="user/landing-page" value={form.deploy_repo} onChange={(e) => set("deploy_repo", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Branch</label>
                  <input className={inputClass} value={form.deploy_branch} onChange={(e) => set("deploy_branch", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>File Path</label>
                  <input className={inputClass} placeholder="src/components/Hero.tsx" value={form.deploy_file_path} onChange={(e) => set("deploy_file_path", e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* Current value + Baseline */}
          <div>
            <label className={labelClass}>Headline Atual</label>
            <input className={inputClass} placeholder="Headline atual da LP" value={form.current_value} onChange={(e) => set("current_value", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Play Rate Baseline (%)</label>
            <input className={inputClass} type="number" step="0.01" placeholder="0.00" value={form.baseline_play_rate || ""} onChange={(e) => set("baseline_play_rate", parseFloat(e.target.value) || 0)} />
          </div>

          {/* Copywriter */}
          <div>
            <label className={labelClass}>Copywriter</label>
            <select className={inputClass} value={form.copywriter_id} onChange={(e) => set("copywriter_id", e.target.value)}>
              {COPYWRITERS.map((cw) => (
                <option key={cw.id} value={cw.id}>{cw.name} — {cw.era}</option>
              ))}
            </select>
          </div>

          {/* Thresholds */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Min Sessoes</label>
              <input className={inputClass} type="number" value={form.min_sessions} onChange={(e) => set("min_sessions", parseInt(e.target.value) || 200)} />
            </div>
            <div>
              <label className={labelClass}>Min Melhoria (%)</label>
              <input className={inputClass} type="number" step="0.1" value={form.min_improvement_pct} onChange={(e) => set("min_improvement_pct", parseFloat(e.target.value) || 2.0)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Max Iteracoes</label>
              <input className={inputClass} type="number" value={form.max_iterations} onChange={(e) => set("max_iterations", parseInt(e.target.value) || 50)} />
            </div>
            <div>
              <label className={labelClass}>Horas por Iteracao</label>
              <input className={inputClass} type="number" value={form.iteration_hours} onChange={(e) => set("iteration_hours", parseInt(e.target.value) || 48)} />
            </div>
          </div>

          {/* Approval gate */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.require_approval}
              onChange={(e) => set("require_approval", e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/20 bg-bg-1 accent-nova"
            />
            <span className="text-[11px] text-text-secondary">Requer aprovacao manual antes de deploy</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.07]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[11px] font-medium text-text-muted hover:text-text-secondary hover:bg-white/[0.04] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.name || (!form.simulate_mode && (!form.vturb_video_id || !form.deploy_repo || !form.deploy_file_path))}
            className="px-4 py-2 rounded-lg text-[11px] font-medium bg-nova text-black hover:bg-nova/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Criando..." : "Criar Campanha"}
          </button>
        </div>
      </div>
    </div>
  );
}
