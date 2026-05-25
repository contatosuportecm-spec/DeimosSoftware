"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Video, ArrowRight, ChevronRight } from "lucide-react";
import { COPYWRITERS } from "@/lib/copywriters";
import type { CreateCampaignInput, ElementType, VideoSlot } from "@/types/autoresearch";
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

const SLOT_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function CreateCampaignModal({
  briefings,
  onClose,
  onCreate,
}: CreateCampaignModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState({
    name: "",
    briefing_id: "",
    element_type: "headline" as ElementType,
    vturb_api_key: "",
    deploy_repo: "",
    deploy_branch: "main",
    deploy_file_path: "autoresearch-config.json",
    min_sessions: "" as number | "",
    max_rounds: "" as number | "",
    iteration_time_value: "48",
    iteration_time_unit: "hours" as "minutes" | "hours" | "days",
    require_approval: false,
    simulate_mode: false,
    copywriter_id: "gary-halbert",
    current_value: "",
    baseline_play_rate: "" as number | "",
  });

  const [slots, setSlots] = useState<VideoSlot[]>([
    { video_id: "", label: "Slot A" },
    { video_id: "", label: "Slot B" },
  ]);

  const set = (key: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateSlot = (index: number, videoId: string) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, video_id: videoId } : s))
    );
  };

  const addSlot = () => {
    if (slots.length >= 8) return;
    setSlots((prev) => [
      ...prev,
      { video_id: "", label: `Slot ${SLOT_LABELS[prev.length] ?? prev.length + 1}` },
    ]);
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 2) return;
    setSlots((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, label: `Slot ${SLOT_LABELS[i] ?? i + 1}` }))
    );
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    setSubmitting(true);
    try {
      const multiplier =
        form.iteration_time_unit === "days"
          ? 1440
          : form.iteration_time_unit === "hours"
            ? 60
            : 1;
      const parsedTimeValue = parseInt(form.iteration_time_value) || 1;
      const iteration_minutes = parsedTimeValue * multiplier;

      await onCreate({
        name: form.name,
        briefing_id: form.briefing_id || undefined,
        element_type: form.element_type,
        slots: form.simulate_mode ? undefined : slots.filter((s) => s.video_id.trim()),
        vturb_api_key: form.vturb_api_key || undefined,
        deploy_repo: form.deploy_repo || undefined,
        deploy_branch: form.deploy_branch,
        deploy_file_path: form.deploy_file_path || "autoresearch-config.json",
        min_sessions: form.min_sessions === "" ? undefined : form.min_sessions,
        max_rounds: form.max_rounds === "" ? undefined : form.max_rounds,
        iteration_minutes,
        require_approval: form.require_approval,
        simulate_mode: form.simulate_mode,
        copywriter_id: form.copywriter_id,
        current_value: form.current_value || undefined,
        baseline_play_rate:
          form.baseline_play_rate === "" ? undefined : form.baseline_play_rate,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-nova/50 focus:bg-white/[0.06] transition-all";
  const selectClass = `${inputClass} appearance-none`;

  const validSlots = slots.filter((s) => s.video_id.trim()).length;
  const canProceed =
    step === 1 ? form.name && (form.simulate_mode || validSlots >= 2) : true;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop — translucent blur over entire page */}
        <motion.div
          className="fixed inset-0 backdrop-blur-2xl bg-black/40"
          style={{ WebkitBackdropFilter: "blur(40px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Card — slides up with spring */}
        <motion.div
          className="relative w-full max-w-[540px] max-h-[88vh] overflow-y-auto rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-white/[0.04] bg-[#0B0B0C]/90 backdrop-blur-md"
          style={{ WebkitBackdropFilter: "blur(20px)" }}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", damping: 28, stiffness: 380, mass: 0.8 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-nova/15 flex items-center justify-center">
                <Video size={18} strokeWidth={1.5} className="text-nova" />
              </div>
              <div>
                <h2 className="text-[16px] font-semibold text-white">Nova Campanha A/B</h2>
                <p className="text-[12px] text-white/35 mt-0.5">
                  {step === 1
                    ? "Configure os slots e o conteudo da sua campanha"
                    : "Ajuste fino — thresholds e copywriter"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
            >
              <X size={18} strokeWidth={1.5} className="text-white/30" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {step === 1 && (
              <>
                {/* 1. Nome */}
                <div>
                  <p className="text-[14px] font-semibold text-white mb-1.5">
                    1. Nome da campanha
                  </p>
                  <input
                    className={inputClass}
                    placeholder="Ex: VSL Principal — Headline A/B"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                  <p className="text-[11px] text-white/25 mt-1.5">
                    De um nome claro para identificar sua campanha.
                  </p>
                </div>

                {/* Simulate Mode */}
                <div
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    form.simulate_mode
                      ? "border-nova/40 bg-nova/10"
                      : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                  onClick={() => set("simulate_mode", !form.simulate_mode)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        form.simulate_mode ? "bg-nova/20" : "bg-white/[0.06]"
                      }`}
                    >
                      <span className="text-[14px]">
                        {form.simulate_mode ? "\u26A1" : "\uD83E\uDDEA"}
                      </span>
                    </div>
                    <div>
                      <p
                        className={`text-[13px] font-semibold ${
                          form.simulate_mode ? "text-nova" : "text-white/70"
                        }`}
                      >
                        Modo Simulacao
                      </p>
                      <p className="text-[11px] text-white/30">
                        IA avalia as headlines como publico-alvo. Sem VTurb ou GitHub.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full p-0.5 transition-all ${
                      form.simulate_mode ? "bg-nova" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        form.simulate_mode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>

                <div className="border-t border-white/[0.05]" />

                {/* 2. Headline Atual */}
                <div>
                  <p className="text-[14px] font-semibold text-white mb-1.5">
                    2. Headline atual <span className="font-normal text-white/30">(controle)</span>
                  </p>
                  <input
                    className={inputClass}
                    placeholder="Headline atual da sua LP"
                    value={form.current_value}
                    onChange={(e) => set("current_value", e.target.value)}
                  />
                  <p className="text-[11px] text-white/25 mt-1.5">
                    Informe a headline que esta no ar hoje.
                  </p>
                </div>

                <div className="border-t border-white/[0.05]" />

                {/* 3. Video Slots */}
                {!form.simulate_mode && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-[14px] font-semibold text-white">
                        3. Video slots <span className="font-normal text-white/30">(VTurb)</span>
                      </p>
                    </div>
                    <p className="text-[11px] text-white/25 mb-3">
                      Use videos diferentes (mesmo conteudo) para cada slot.
                    </p>

                    <div className="space-y-2.5">
                      {slots.map((slot, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0"
                            style={{
                              backgroundColor:
                                i === 0 ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)",
                              color: i === 0 ? "#f59e0b" : "#3b82f6",
                            }}
                          >
                            {SLOT_LABELS[i]}
                          </div>
                          <span className="text-[12px] text-white/40 w-12 shrink-0">
                            {slot.label}
                          </span>
                          <div className="flex-1 relative">
                            <Video
                              size={14}
                              strokeWidth={1.5}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                            />
                            <input
                              className={`${inputClass} pl-9`}
                              placeholder={
                                i === 0 ? "Video ID do controle" : `Video ID do challenger ${i}`
                              }
                              value={slot.video_id}
                              onChange={(e) => updateSlot(i, e.target.value)}
                            />
                          </div>
                          {slots.length > 2 && (
                            <button
                              onClick={() => removeSlot(i)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      ))}

                      {slots.length < 8 && (
                        <button
                          onClick={addSlot}
                          className="flex items-center gap-1.5 text-[12px] text-nova hover:text-nova/80 font-medium transition-colors ml-12 mt-1"
                        >
                          <Plus size={12} strokeWidth={2} />
                          Adicionar slot
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-white/20 mt-2.5">
                      Slot A = controle (headline atual). Slots B-
                      {SLOT_LABELS[slots.length - 1]} = challengers gerados pela IA.
                    </p>
                  </div>
                )}

                <div className="border-t border-white/[0.05]" />

                {/* 4. Briefing */}
                <div>
                  <p className="text-[14px] font-semibold text-white mb-3">
                    {form.simulate_mode ? "3" : "4"}. Briefing
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-white/35 mb-1.5">Objetivo</p>
                      <select
                        className={selectClass}
                        value={form.briefing_id}
                        onChange={(e) => set("briefing_id", e.target.value)}
                      >
                        <option value="">Nenhum</option>
                        {briefings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.offer_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/35 mb-1.5">Elemento em destaque</p>
                      <select
                        className={selectClass}
                        value={form.element_type}
                        onChange={(e) => set("element_type", e.target.value)}
                      >
                        {ELEMENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Deploy */}
                {!form.simulate_mode && (
                  <>
                    <div>
                      <p className="text-[14px] font-semibold text-white mb-3">Deploy</p>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[11px] text-white/35 mb-1.5">Repo GitHub (owner/repo)</p>
                          <input
                            className={inputClass}
                            placeholder="user/landing-page"
                            value={form.deploy_repo}
                            onChange={(e) => set("deploy_repo", e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[11px] text-white/35 mb-1.5">Branch</p>
                            <input
                              className={inputClass}
                              value={form.deploy_branch}
                              onChange={(e) => set("deploy_branch", e.target.value)}
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-white/35 mb-1.5">Config file path</p>
                            <input
                              className={inputClass}
                              placeholder="autoresearch-config.json"
                              value={form.deploy_file_path}
                              onChange={(e) => set("deploy_file_path", e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] text-white/35 mb-1.5">
                            VTurb API Key{" "}
                            <span className="text-white/15">opcional — usa env se vazio</span>
                          </p>
                          <input
                            className={inputClass}
                            placeholder="Usa VTURB_API_KEY do env"
                            value={form.vturb_api_key}
                            onChange={(e) => set("vturb_api_key", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-white/[0.05]" />
                  </>
                )}

                {/* Parametros */}
                <div>
                  <p className="text-[14px] font-semibold text-white mb-3">Parametros</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] text-white/35 mb-1.5">
                        Play Rate Baseline (%){" "}
                        <span className="text-white/15">opcional — medido no round 1</span>
                      </p>
                      <input
                        className={inputClass}
                        type="number"
                        step="0.01"
                        placeholder="Medido automaticamente"
                        value={form.baseline_play_rate}
                        onChange={(e) =>
                          set(
                            "baseline_play_rate",
                            e.target.value === "" ? "" : parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>

                    {/* Copywriter */}
                    <div>
                      <p className="text-[11px] text-white/35 mb-1.5">Copywriter IA</p>
                      <select
                        className={selectClass}
                        value={form.copywriter_id}
                        onChange={(e) => set("copywriter_id", e.target.value)}
                      >
                        {COPYWRITERS.map((cw) => (
                          <option key={cw.id} value={cw.id}>
                            {cw.name} — {cw.era}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Min sessions */}
                    <div>
                      <p className="text-[11px] text-white/35 mb-1.5">
                        Min sessoes por slot{" "}
                        <span className="text-white/15">opcional — so tempo</span>
                      </p>
                      <input
                        className={inputClass}
                        type="number"
                        placeholder="Sem limite"
                        value={form.min_sessions}
                        onChange={(e) =>
                          set("min_sessions", e.target.value === "" ? "" : parseInt(e.target.value))
                        }
                      />
                    </div>

                    {/* Max rounds */}
                    <div>
                      <p className="text-[11px] text-white/35 mb-1.5">
                        Max rounds{" "}
                        <span className="text-white/15">opcional — roda indefinidamente</span>
                      </p>
                      <input
                        className={inputClass}
                        type="number"
                        placeholder="Sem limite"
                        value={form.max_rounds}
                        onChange={(e) =>
                          set("max_rounds", e.target.value === "" ? "" : parseInt(e.target.value))
                        }
                      />
                    </div>

                    {/* Tempo por round */}
                    <div>
                      <p className="text-[11px] text-white/35 mb-1.5">Tempo por round</p>
                      <div className="grid grid-cols-[1fr_140px] gap-2">
                        <input
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-nova/50 focus:bg-white/[0.06] transition-all"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="48"
                          value={form.iteration_time_value}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, "");
                            set("iteration_time_value", v);
                          }}
                        />
                        <select
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-white appearance-none focus:outline-none focus:border-nova/50 focus:bg-white/[0.06] transition-all"
                          value={form.iteration_time_unit}
                          onChange={(e) => set("iteration_time_unit", e.target.value)}
                        >
                          <option value="minutes">Minutos</option>
                          <option value="hours">Horas</option>
                          <option value="days">Dias</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/[0.05]" />

                {/* Approval */}
                <div
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    form.require_approval
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                  onClick={() => set("require_approval", !form.require_approval)}
                >
                  <div>
                    <p
                      className={`text-[13px] font-medium ${
                        form.require_approval ? "text-amber-400" : "text-white/60"
                      }`}
                    >
                      Aprovacao manual
                    </p>
                    <p className="text-[11px] text-white/25">
                      Revisar cada round antes do deploy
                    </p>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full p-0.5 transition-all ${
                      form.require_approval ? "bg-amber-500" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        form.require_approval ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-5 border-t border-white/[0.06]">
            <div>
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                >
                  Voltar
                </button>
              )}
              {step === 1 && (
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>

            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                disabled={!canProceed}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold bg-nova text-black hover:bg-nova/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Proximo
                <ArrowRight size={14} strokeWidth={2} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold bg-nova text-black hover:bg-nova/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? "Criando..." : "Criar Campanha"}
                {!submitting && <ChevronRight size={14} strokeWidth={2} />}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
