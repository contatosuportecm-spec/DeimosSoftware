/* ═══════════════════════════════════════════════════════════════════════
   engine.js — Máquina de estados do quiz. Não toca no DOM.
   Responsabilidades: estado único, navegação/ramificação, validação,
   progresso segmentado por capítulo, persistência (sessionStorage,
   degradando em silêncio) e tracking plugável.
   ═══════════════════════════════════════════════════════════════════════ */

QuizApp.define("engine", function (use) {
  "use strict";

  const data = use("data");
  const CFG = data.config;
  const ERR = data.ui.errors;
  const STEPS = data.steps;
  const CHAPTERS = data.chapters;

  const indexById = {};
  STEPS.forEach(function (step, i) { indexById[step.id] = i; });

  const QUESTION_KINDS = { single: 1, multi: 1, scale: 1, open: 1, email: 1 };

  /* ── Estado único ── */
  const state = {
    current: STEPS[0].id,
    answers: {},    // { stepId: string | string[] | number } (+ email_optin)
    history: [],    // pilha de ids visitados (voltar + progresso)
    profile: null,  // definido no resultado
  };

  function stepOf(id) { return id in indexById ? STEPS[indexById[id]] : null; }
  function answerOf(id) { return state.answers[id]; }

  /* ── Persistência (sessionStorage pode estar bloqueado — degrada) ── */
  function save() {
    try {
      sessionStorage.setItem(CFG.persistKey, JSON.stringify({
        current: state.current, answers: state.answers, history: state.history,
      }));
    } catch (e) { /* modo privado / file:// — segue sem persistir */ }
  }
  function restore() {
    try {
      const raw = sessionStorage.getItem(CFG.persistKey);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved || !stepOf(saved.current)) return false;
      state.current = saved.current;
      state.answers = saved.answers && typeof saved.answers === "object" ? saved.answers : {};
      state.history = Array.isArray(saved.history) ? saved.history.filter(stepOf) : [];
      return true;
    } catch (e) { return false; }
  }
  function reset() {
    state.current = STEPS[0].id;
    state.answers = {};
    state.history = [];
    state.profile = null;
    try { sessionStorage.removeItem(CFG.persistKey); } catch (e) { /* idem */ }
  }

  /* ── Tracking (dataLayer + CustomEvent + webhook opcional de lead) ── */
  function track(event, payload) {
    const detail = Object.assign({ event: event, quiz: data.meta.slug, ts: Date.now() }, payload || {});
    (window.dataLayer = window.dataLayer || []).push(detail);
    window.dispatchEvent(new CustomEvent("quiz:track", { detail: detail }));
    if (event === "lead_submit" && CFG.leadWebhook) sendLead(detail);
    if (CFG.debug && window.console) console.debug("[quiz]", event, detail);
  }
  function sendLead(detail) {
    try {
      const body = JSON.stringify(detail);
      if (navigator.sendBeacon) navigator.sendBeacon(CFG.leadWebhook, body);
      else fetch(CFG.leadWebhook, { method: "POST", body: body, keepalive: true }).catch(function () {});
    } catch (e) { /* rede/CSP indisponível — o quiz segue */ }
  }

  /* ── Navegação / ramificação ── */
  function nextId(id) {
    const step = stepOf(id);
    if (!step) return null;
    if (step.branch) {
      const answer = answerOf(id);
      const key = Array.isArray(answer) ? answer[0] : answer;
      const target = (step.branch.on && step.branch.on[key]) || step.branch.default;
      return stepOf(target) ? target : null;
    }
    if (step.next) return stepOf(step.next) ? step.next : null;
    // fall-through linear: pula alvos exclusivos de branch
    for (let i = indexById[id] + 1; i < STEPS.length; i++) {
      if (!STEPS[i].skipInLinear) return STEPS[i].id;
    }
    return null;
  }

  /* Caminho projetado do step atual até o fim (respeitando o branch) */
  function pathAhead(fromId) {
    const ids = [];
    let cursor = fromId, guard = 0;
    while (cursor && guard++ <= STEPS.length) {
      ids.push(cursor);
      cursor = nextId(cursor);
    }
    return ids;
  }

  /* ── Progresso segmentado por capítulo (spec: sem número, nunca 0/100%) ── */
  function progressInfo() {
    const step = stepOf(state.current);
    if (!step || !step.chapter) {
      return { visible: false, label: "", segments: CHAPTERS.map(function () { return 0; }), percent: 0 };
    }

    const doneByChapter = {};
    const totalByChapter = {};
    function count(map, chapter) { if (chapter) map[chapter] = (map[chapter] || 0) + 1; }

    state.history.forEach(function (id) {
      const s = stepOf(id);
      count(doneByChapter, s.chapter);
      count(totalByChapter, s.chapter);
    });
    pathAhead(state.current).forEach(function (id) {
      count(totalByChapter, stepOf(id).chapter);
    });

    const currentIdx = CHAPTERS.findIndex(function (c) { return c.id === step.chapter; });
    const segments = CHAPTERS.map(function (chapter, i) {
      if (i < currentIdx) return 1;
      if (i > currentIdx) return 0;
      const total = totalByChapter[chapter.id] || 1;
      const done = doneByChapter[chapter.id] || 0;
      // capítulo ativo: nunca vazio (progresso "começa em ~7%") nem cheio
      return Math.min(0.95, Math.max(0.12, (done + 0.4) / total));
    });

    const percent = Math.round((segments.reduce(function (sum, f) { return sum + f; }, 0) / CHAPTERS.length) * 100);
    return {
      visible: true,
      label: CHAPTERS[currentIdx].label,
      segments: segments,
      percent: Math.max(7, Math.min(99, percent)),
    };
  }

  /* ── Validação ── */
  function fmt(msg, vars) {
    return msg.replace(/\{(\w+)\}/g, function (_, key) { return vars[key] != null ? vars[key] : ""; });
  }

  function validate(id, value) {
    const step = stepOf(id);
    if (!step) return { ok: false, msg: "" };

    switch (step.kind) {
      case "single":
        return value ? { ok: true } : { ok: false, msg: ERR.selectOne };
      case "multi":
        return Array.isArray(value) && value.length > 0 ? { ok: true } : { ok: false, msg: ERR.selectAtLeastOne };
      case "scale": {
        const n = Number(value);
        return n >= step.scale.min && n <= step.scale.max ? { ok: true } : { ok: false, msg: ERR.scale };
      }
      case "open": {
        const input = step.input || {};
        const text = String(value == null ? "" : value).trim();
        if (!text) return { ok: false, msg: ERR.required };
        const n = Number(text.replace(",", "."));
        if (Number.isNaN(n)) return { ok: false, msg: ERR.invalidNumber };
        if (input.min != null && n < input.min) return { ok: false, msg: fmt(ERR.numberMin, input) };
        if (input.max != null && n > input.max) return { ok: false, msg: fmt(ERR.numberMax, input) };
        return { ok: true };
      }
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim())
          ? { ok: true } : { ok: false, msg: ERR.invalidEmail };
      default:
        return { ok: true }; // statement / loading / result não exigem valor
    }
  }

  function needsInput(id) { return stepOf(id).kind in QUESTION_KINDS; }

  /* ── Transições ── */
  function setAnswer(id, value) { state.answers[id] = value; save(); }

  function goNext() {
    const id = state.current;
    const step = stepOf(id);

    if (needsInput(id)) {
      const check = validate(id, answerOf(id));
      if (!check.ok) return { ok: false, msg: check.msg };
    }
    if (step.kind === "email") {
      track("lead_submit", { email: answerOf(id), optin: !!state.answers.email_optin, answers: exportAnswers() });
    }

    const next = nextId(id);
    if (!next) return { ok: true, done: true };

    state.history.push(id);
    state.current = next;
    save();
    track("quiz_step", { step: next, index: state.history.length });
    return { ok: true, done: false };
  }

  function goBack() {
    if (state.history.length === 0) return false;
    state.current = state.history.pop();
    save();
    return true;
  }

  function exportAnswers() { return Object.assign({}, state.answers); }

  /* ── API pública ── */
  return {
    state: state,
    stepOf: stepOf,
    current: function () { return stepOf(state.current); },
    answerOf: answerOf,
    setAnswer: setAnswer,
    validate: validate,
    needsInput: needsInput,
    goNext: goNext,
    goBack: goBack,
    canBack: function () { return state.history.length > 0; },
    progressInfo: progressInfo,
    exportAnswers: exportAnswers,
    save: save,
    restore: restore,
    reset: reset,
    track: track,
  };
});
