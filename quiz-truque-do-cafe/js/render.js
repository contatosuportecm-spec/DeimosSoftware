/* ═══════════════════════════════════════════════════════════════════════
   render.js — Cria o DOM a partir dos dados + liga eventos ao QuizEngine.
   Nenhuma string de pergunta mora aqui: tudo vem de window.QUIZ (via engine).
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const E = window.QuizEngine;
  const QUIZ = window.QUIZ;

  const el = {
    progress: document.getElementById("progress-bar"),
    stage: document.getElementById("stage"),
    back: document.getElementById("back-btn"),
    kicker: document.getElementById("act-kicker"),
  };

  /* util: cria elemento */
  function h(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach((k) => {
      if (k === "class") node.className = attrs[k];
      else if (k === "dataset") Object.assign(node.dataset, attrs[k]);
      else if (k.startsWith("on") && typeof attrs[k] === "function")
        node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function interpolate(str) {
    if (!str) return str;
    return str.replace(/\{socialProofCount\}/g, QUIZ.config.socialProofCount);
  }

  /* ── Erro de validação (acessível) ── */
  function showError(container, msg) {
    let box = container.querySelector(".q-error");
    if (!box) {
      box = h("p", { class: "q-error", role: "alert", "aria-live": "assertive" });
      container.appendChild(box);
    }
    box.textContent = msg;
    box.classList.add("is-shown");
  }
  function clearError(container) {
    const box = container.querySelector(".q-error");
    if (box) box.classList.remove("is-shown");
  }

  /* ── Rodapé com botão avançar ── */
  function footer(label, onClick) {
    return h("div", { class: "q-footer" }, [
      h("button", { class: "btn btn-primary", type: "button", onClick: onClick }, [label || "CONTINUAR"]),
    ]);
  }

  /* ── Renderizadores por tipo ── */
  const renderers = {
    statement(step, card) {
      if (step.signature) card.classList.add("card--signature");
      card.appendChild(h("h1", { class: "q-title q-title--lg" }, [interpolate(step.question)]));
      if (step.body) card.appendChild(h("p", { class: "q-body" }, [interpolate(step.body)]));
      if (step.proof) card.appendChild(h("p", { class: "q-proof" }, [interpolate(step.proof)]));
      card.appendChild(footer(step.cta, advance));
    },

    single(step, card) {
      card.appendChild(titleBlock(step));
      const group = h("div", { class: "opt-group", role: "radiogroup", "aria-label": step.question });
      const selected = E.state.answers[step.id];
      step.options.forEach((opt) => {
        const active = selected === opt.id;
        group.appendChild(h("button", {
          class: "opt" + (active ? " is-selected" : ""),
          type: "button", role: "radio", "aria-checked": active ? "true" : "false",
          onClick: () => {
            E.setAnswer(step.id, opt.id);
            clearError(card);
            // seleção única avança automaticamente (ritmo das referências)
            advance();
          },
        }, [h("span", { class: "opt-label" }, [opt.label])]));
      });
      card.appendChild(group);
    },

    multi(step, card) {
      card.appendChild(titleBlock(step));
      const chosen = new Set(Array.isArray(E.state.answers[step.id]) ? E.state.answers[step.id] : []);
      const group = h("div", { class: "opt-group", role: "group", "aria-label": step.question });
      step.options.forEach((opt) => {
        const btn = h("button", {
          class: "opt opt--multi" + (chosen.has(opt.id) ? " is-selected" : ""),
          type: "button", "aria-pressed": chosen.has(opt.id) ? "true" : "false",
          onClick: () => {
            if (chosen.has(opt.id)) chosen.delete(opt.id); else chosen.add(opt.id);
            btn.classList.toggle("is-selected");
            btn.setAttribute("aria-pressed", chosen.has(opt.id) ? "true" : "false");
            E.setAnswer(step.id, Array.from(chosen));
            clearError(card);
          },
        }, [h("span", { class: "opt-check", "aria-hidden": "true" }), h("span", { class: "opt-label" }, [opt.label])]);
        group.appendChild(btn);
      });
      card.appendChild(group);
      card.appendChild(footer(step.cta || "CONTINUAR", advance));
    },

    scale(step, card) {
      card.appendChild(titleBlock(step));
      const current = Number(E.state.answers[step.id]);
      const scale = h("div", { class: "scale", role: "radiogroup", "aria-label": step.question });
      for (let n = step.scale.min; n <= step.scale.max; n++) {
        const active = current === n;
        scale.appendChild(h("button", {
          class: "scale-dot" + (active ? " is-selected" : ""),
          type: "button", role: "radio", "aria-checked": active ? "true" : "false",
          "aria-label": String(n), dataset: { val: n },
          onClick: () => {
            E.setAnswer(step.id, n);
            clearError(card);
            advance();
          },
        }, [String(n)]));
      }
      card.appendChild(scale);
      card.appendChild(h("div", { class: "scale-legend" }, [
        h("span", null, [step.scale.minLabel]),
        h("span", null, [step.scale.maxLabel]),
      ]));
    },

    open(step, card) {
      card.appendChild(titleBlock(step));
      const inp = step.input || {};
      const wrap = h("div", { class: "field" });
      const input = h("input", {
        class: "field-input", type: inp.type === "number" ? "number" : "text",
        inputmode: inp.type === "number" ? "decimal" : "text",
        placeholder: inp.placeholder || "", id: "field-" + step.id,
        min: inp.min, max: inp.max, step: inp.step || "any",
        value: E.state.answers[step.id] != null ? E.state.answers[step.id] : "",
        oninput: (ev) => { E.setAnswer(step.id, ev.target.value); clearError(card); },
        onkeydown: (ev) => { if (ev.key === "Enter") { ev.preventDefault(); advance(); } },
      });
      wrap.appendChild(input);
      if (inp.unit) wrap.appendChild(h("span", { class: "field-unit" }, [inp.unit]));
      card.appendChild(wrap);
      card.appendChild(footer(step.cta || "CONTINUAR", advance));
      setTimeout(() => input.focus(), 60);
    },

    email(step, card) {
      card.appendChild(h("h1", { class: "q-title" }, [interpolate(step.question)]));
      if (step.body) card.appendChild(h("p", { class: "q-body" }, [interpolate(step.body)]));
      const wrap = h("div", { class: "field" });
      const input = h("input", {
        class: "field-input", type: "email", placeholder: step.input.placeholder,
        autocomplete: "email", id: "field-" + step.id,
        value: E.state.answers[step.id] != null ? E.state.answers[step.id] : "",
        oninput: (ev) => { E.setAnswer(step.id, ev.target.value); clearError(card); },
        onkeydown: (ev) => { if (ev.key === "Enter") { ev.preventDefault(); advance(); } },
      });
      wrap.appendChild(input);
      card.appendChild(wrap);
      if (step.optIn) {
        const optId = "optin-" + step.id;
        card.appendChild(h("label", { class: "optin", for: optId }, [
          h("input", {
            type: "checkbox", id: optId,
            onchange: (ev) => E.setAnswer("_optin", ev.target.checked),
          }),
          h("span", null, [step.optIn]),
        ]));
      }
      card.appendChild(footer(step.cta || "CONTINUAR", advance));
      setTimeout(() => input.focus(), 60);
    },

    loading(step, card) {
      card.classList.add("card--loading");
      card.appendChild(h("div", { class: "loader", "aria-hidden": "true" }, [h("span"), h("span"), h("span")]));
      const line = h("p", { class: "loading-line", "aria-live": "polite" }, [step.question]);
      card.appendChild(line);
      const bar = h("div", { class: "loading-track" }, [h("div", { class: "loading-fill" })]);
      card.appendChild(bar);
      const fill = bar.querySelector(".loading-fill");

      const frames = step.frames || [];
      const per = step.durationMs || 3500;
      const total = per * (frames.length + 1);
      let i = 0;
      // anima a barra
      requestAnimationFrame(() => { fill.style.transitionDuration = total + "ms"; fill.style.width = "100%"; });
      const tick = () => {
        if (i < frames.length) { line.textContent = frames[i]; i++; loadingTimer = setTimeout(tick, per); }
        else { advance(); }
      };
      loadingTimer = setTimeout(tick, per);
    },

    result(step, card) {
      // Delegado ao módulo de resultado (cálculo de perfil + CTA).
      window.QuizResult.render(step, card, { h: h, restart: restart });
    },
  };

  function titleBlock(step) {
    const frag = document.createDocumentFragment();
    frag.appendChild(h("h1", { class: "q-title" }, [interpolate(step.question)]));
    if (step.microcopy) frag.appendChild(h("p", { class: "q-microcopy" }, [interpolate(step.microcopy)]));
    return frag;
  }

  /* ── Avançar (com validação) ── */
  let loadingTimer = null;
  function advance() {
    const card = el.stage.querySelector(".card");
    const res = E.goNext();
    if (!res.ok) { if (card) showError(card, res.msg); return; }
    paint("forward");
  }

  function restart() {
    E.reset();
    E.track("quiz_start", { restart: true });
    paint("forward");
  }

  /* ── Pintura de tela com transição ── */
  function paint(direction) {
    if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = null; }
    const step = E.current();

    // progresso (esconde na abertura e no resultado)
    const showProgress = step.kind !== "result" && step.id !== "intro";
    el.progress.parentElement.style.visibility = showProgress ? "visible" : "hidden";
    el.progress.style.width = Math.round(E.progress() * 100) + "%";

    // kicker do ato
    el.kicker.textContent = step.act || "";
    el.kicker.style.visibility = (step.kind === "result" || step.kind === "loading") ? "hidden" : "visible";

    // botão voltar
    const canBack = E.canBack() && step.kind !== "loading" && step.kind !== "result";
    el.back.style.visibility = canBack ? "visible" : "hidden";
    el.back.disabled = !canBack;

    // monta card
    const card = h("div", { class: "card", tabindex: "-1" });
    (renderers[step.kind] || renderers.statement)(step, card);

    // transição
    const outgoing = el.stage.querySelector(".card");
    if (outgoing) {
      outgoing.classList.add(direction === "back" ? "card--out-back" : "card--out");
      outgoing.addEventListener("animationend", () => outgoing.remove(), { once: true });
      setTimeout(() => { if (outgoing.parentElement) outgoing.remove(); }, 500);
    }
    card.classList.add(direction === "back" ? "card--in-back" : "card--in");
    el.stage.appendChild(card);

    // acessibilidade: foco no novo card + aria-live
    el.stage.setAttribute("aria-busy", "false");
    setTimeout(() => card.focus(), 40);
  }

  /* ── Voltar ── */
  el.back.addEventListener("click", () => { if (E.goBack()) paint("back"); });

  /* ── Boot ── */
  function boot() {
    const resumed = E.restore();
    E.track(resumed ? "quiz_resume" : "quiz_start", { resumed: resumed });
    paint("forward");
  }

  window.QuizRender = { boot: boot, paint: paint };
})();
