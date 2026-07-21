/* ═══════════════════════════════════════════════════════════════════════
   engine.js — Máquina de estados do quiz.
   Responsabilidades: navegação, ramificação, validação, progresso (por caminho),
   persistência (sessionStorage), tracking. NÃO desenha DOM (isso é render.js).
   Estado vive em UM objeto único: state = { current, answers, history, score, profile }.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const QUIZ = window.QUIZ;
  const CFG = QUIZ.config;
  const STEPS = QUIZ.steps;

  /* index por id */
  const byId = {};
  STEPS.forEach((s, i) => { byId[s.id] = { step: s, index: i }; });

  /* ── Estado único ── */
  const state = {
    current: STEPS[0].id,
    answers: {},         // { stepId: value }  (value: string | string[] | number)
    history: [],         // pilha de ids visitados (para voltar + progresso)
    score: {},           // acumulador de segmentação
    profile: null,       // definido no resultado
  };

  /* ── Persistência (sessionStorage) ── */
  function save() {
    try {
      sessionStorage.setItem(CFG.persistKey, JSON.stringify({
        current: state.current, answers: state.answers, history: state.history,
      }));
    } catch (e) { /* modo privado / file:// pode bloquear — degrada em silêncio */ }
  }
  function restore() {
    try {
      const raw = sessionStorage.getItem(CFG.persistKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !byId[data.current]) return false;
      state.current = data.current;
      state.answers = data.answers || {};
      state.history = Array.isArray(data.history) ? data.history : [];
      return true;
    } catch (e) { return false; }
  }
  function reset() {
    state.current = STEPS[0].id;
    state.answers = {};
    state.history = [];
    state.score = {};
    state.profile = null;
    try { sessionStorage.removeItem(CFG.persistKey); } catch (e) {}
  }

  /* ── Tracking isolado (plugável em Pixel/GA/webhook) ── */
  function track(event, payload) {
    const data = Object.assign({ event: event, quiz: QUIZ.meta.slug, ts: Date.now() }, payload || {});
    (window.dataLayer = window.dataLayer || []).push(data);
    window.dispatchEvent(new CustomEvent("quiz:track", { detail: data }));
    if (window.console && console.debug) console.debug("[track]", event, data);
  }

  /* ── Navegação / ramificação ── */
  function stepOf(id) { return byId[id] ? byId[id].step : null; }

  function nextId(id) {
    const step = stepOf(id);
    if (!step) return null;
    if (step.branch) {
      const ans = state.answers[id];
      const key = Array.isArray(ans) ? ans[0] : ans;
      const target = (step.branch.on && step.branch.on[key]) || step.branch.default;
      return target && byId[target] ? target : null;
    }
    if (step.next) return byId[step.next] ? step.next : null;
    /* fall-through linear: próximo step que não seja alvo-exclusivo de branch */
    for (let i = byId[id].index + 1; i < STEPS.length; i++) {
      if (!STEPS[i].skipInLinear) return STEPS[i].id;
    }
    return null;
  }

  function isLast(id) { return nextId(id) === null; }

  /* ── Progresso REAL baseado no caminho (não no total bruto) ── */
  function remainingFrom(id) {
    let count = 0, cur = id, guard = 0;
    while (cur && guard++ < STEPS.length + 5) {
      const nxt = nextId(cur);
      if (!nxt) break;
      count++; cur = nxt;
    }
    return count;
  }
  function progress() {
    const done = state.history.length;               // telas já concluídas
    const left = remainingFrom(state.current) + 1;   // atual + o que falta
    const total = done + left;
    return total > 0 ? Math.min(1, done / total) : 0;
  }

  /* ── Validação ── */
  function validate(id, value) {
    const step = stepOf(id);
    if (!step) return { ok: false, msg: "Etapa inválida." };
    const required = step.required !== false; // perguntas são obrigatórias por padrão

    switch (step.kind) {
      case "single":
        if (required && !value) return { ok: false, msg: "Selecione uma opção para continuar." };
        return { ok: true };
      case "multi":
        if (required && (!Array.isArray(value) || value.length === 0))
          return { ok: false, msg: "Selecione ao menos uma opção." };
        return { ok: true };
      case "scale":
        if (required && !(Number(value) >= step.scale.min && Number(value) <= step.scale.max))
          return { ok: false, msg: "Escolha um ponto na escala." };
        return { ok: true };
      case "open": {
        const inp = step.input || {};
        if (required && (value === undefined || value === null || String(value).trim() === ""))
          return { ok: false, msg: "Preencha o campo para continuar." };
        if (inp.type === "number") {
          const n = Number(String(value).replace(",", "."));
          if (Number.isNaN(n)) return { ok: false, msg: "Digite um número válido." };
          if (inp.min != null && n < inp.min) return { ok: false, msg: "Valor abaixo do mínimo (" + inp.min + inp.unit + ")." };
          if (inp.max != null && n > inp.max) return { ok: false, msg: "Valor acima do máximo (" + inp.max + inp.unit + ")." };
        }
        return { ok: true };
      }
      case "email": {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(String(value || "").trim()))
          return { ok: false, msg: "Digite um e-mail válido." };
        return { ok: true };
      }
      default:
        return { ok: true }; // statement / loading / result não exigem valor
    }
  }

  function needsInput(id) {
    const k = stepOf(id).kind;
    return k === "single" || k === "multi" || k === "scale" || k === "open" || k === "email";
  }

  /* ── Transições ── */
  function setAnswer(id, value) { state.answers[id] = value; save(); }

  function goNext() {
    const id = state.current;
    const step = stepOf(id);

    if (needsInput(id)) {
      const v = state.answers[id];
      const res = validate(id, v);
      if (!res.ok) return { ok: false, msg: res.msg };
    }

    if (step.kind === "email") {
      track("lead_submit", { email: state.answers[id], answers: exportAnswers() });
    }

    const nxt = nextId(id);
    if (!nxt) return { ok: true, done: true };

    state.history.push(id);
    state.current = nxt;
    save();
    track("quiz_step", { step: nxt, index: state.history.length });
    return { ok: true, done: false };
  }

  function goBack() {
    if (state.history.length === 0) return false;
    state.current = state.history.pop();
    save();
    return true;
  }

  /* ── Export das respostas (payload de tracking / lead) ── */
  function exportAnswers() {
    const out = {};
    Object.keys(state.answers).forEach((k) => { out[k] = state.answers[k]; });
    return out;
  }

  /* ── API pública ── */
  window.QuizEngine = {
    state,
    steps: STEPS,
    stepOf,
    current: () => stepOf(state.current),
    isLast: () => isLast(state.current),
    progress,
    validate,
    needsInput,
    setAnswer,
    goNext,
    goBack,
    canBack: () => state.history.length > 0,
    reset,
    restore,
    save,
    track,
    exportAnswers,
  };
})();
