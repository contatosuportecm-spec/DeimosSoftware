/* ═══════════════════════════════════════════════════════════════════════
   render.js — Monta o DOM a partir dos dados. Layout espelha o mockup da
   marca: logo no topo, progresso gold com %, cards em grid com ícone,
   botão gold "Continuar →", link "Voltar", loading em anel.
   Nenhuma string de pergunta mora aqui.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const E = window.QuizEngine;
  const QUIZ = window.QUIZ;
  const A = window.ASSETS;

  const el = {
    logo: document.getElementById("logo"),
    progressRow: document.getElementById("progress-row"),
    progress: document.getElementById("progress-bar"),
    pct: document.getElementById("progress-pct"),
    stage: document.getElementById("stage"),
    back: document.getElementById("back-btn"),
  };

  function h(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach((k) => {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.startsWith("on") && typeof attrs[k] === "function") n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach((c) => { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  function tokens(str) {
    return String(str || "").replace(/\{socialProofCount\}/g, QUIZ.config.socialProofCount);
  }
  /* **destaque** → <span class="hi"> (escapa o resto) */
  function titleHTML(str) {
    const esc = tokens(str).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    return esc.replace(/\*\*(.+?)\*\*/g, '<span class="hi">$1</span>');
  }

  function showError(card, msg) {
    let box = card.querySelector(".q-error");
    if (!box) { box = h("p", { class: "q-error", role: "alert", "aria-live": "assertive" }); card.appendChild(box); }
    box.textContent = msg; box.classList.add("is-shown");
  }
  function clearError(card) { const b = card.querySelector(".q-error"); if (b) b.classList.remove("is-shown"); }

  /* rodapé: CTA gold + voltar */
  function footer(step) {
    const kids = [
      h("button", { class: "btn btn-primary", type: "button", onClick: advance }, [
        step.cta || "CONTINUAR", h("span", { class: "arrow", "aria-hidden": "true" }, ["→"]),
      ]),
    ];
    if (E.canBack()) kids.push(h("button", { class: "link-back", type: "button", onClick: goBack }, ["Voltar"]));
    return h("div", { class: "q-footer" }, kids);
  }

  function titleBlock(step) {
    const f = document.createDocumentFragment();
    f.appendChild(h("h1", { class: "q-title", html: titleHTML(step.question) }));
    if (step.microcopy) f.appendChild(h("p", { class: "q-microcopy" }, [tokens(step.microcopy)]));
    return f;
  }

  function iconNode(opt) {
    if (opt.image) return h("img", { class: "opt-img", src: opt.image, alt: "" });
    if (opt.body && A.body[opt.body]) return h("span", { class: "opt-ic body-ic", html: A.body[opt.body] });
    if (opt.icon && A.icons[opt.icon]) return h("span", { class: "opt-ic", html: A.icons[opt.icon] });
    return null;
  }
  function hasVisuals(step) {
    return (step.options || []).some((o) => o.icon || o.body || o.image);
  }

  const renderers = {
    statement(step, card) {
      if (step.center) card.classList.add("card--center");
      if (step.hero) card.appendChild(h("div", { class: "hero" }, [h("span", { class: "cup-illus", html: A.cup })]));
      card.appendChild(h("h1", { class: "q-title q-title--lg", html: titleHTML(step.question) }));
      if (step.body) card.appendChild(h("p", { class: "q-body" }, [tokens(step.body)]));
      if (step.benefits) {
        const ul = h("ul", { class: "benefits" });
        step.benefits.forEach((b) => ul.appendChild(h("li", null, [b])));
        card.appendChild(ul);
      }
      if (step.reassure) card.appendChild(h("p", { class: "reassure" }, [tokens(step.reassure)]));
      if (step.estimatedTime)
        card.appendChild(h("p", { class: "est-time" }, ["⏱ Tempo estimado: ", h("b", null, [step.estimatedTime])]));
      card.appendChild(footer(step));
    },

    single(step, card) {
      card.appendChild(titleBlock(step));
      const grid = step.layout === "grid" || hasVisuals(step);
      const box = h("div", { class: grid ? "opt-grid" : "opt-list", role: "radiogroup", "aria-label": tokens(step.question) });
      const sel = E.state.answers[step.id];
      step.options.forEach((opt) => {
        const on = sel === opt.id;
        const kids = grid
          ? [iconNode(opt), h("span", { class: "opt-label" }, [opt.label]), h("span", { class: "opt-check", "aria-hidden": "true" })]
          : [h("span", { class: "opt-radio", "aria-hidden": "true" }), h("span", { class: "opt-label" }, [opt.label])];
        const b = h("button", {
          class: (grid ? "opt-card" : "opt-row") + (on ? " is-selected" : ""),
          type: "button", role: "radio", "aria-checked": on ? "true" : "false",
          onClick: () => {
            E.setAnswer(step.id, opt.id); clearError(card);
            box.querySelectorAll("[role=radio]").forEach((x) => { x.classList.remove("is-selected"); x.setAttribute("aria-checked", "false"); });
            b.classList.add("is-selected"); b.setAttribute("aria-checked", "true");
          },
        }, kids.filter(Boolean));
        box.appendChild(b);
      });
      card.appendChild(box);
      card.appendChild(footer(step));
    },

    multi(step, card) {
      card.appendChild(titleBlock(step));
      const grid = step.layout === "grid" || hasVisuals(step);
      const chosen = new Set(Array.isArray(E.state.answers[step.id]) ? E.state.answers[step.id] : []);
      const box = h("div", { class: grid ? "opt-grid" : "opt-list", role: "group", "aria-label": tokens(step.question) });
      step.options.forEach((opt) => {
        const on = chosen.has(opt.id);
        const kids = grid
          ? [iconNode(opt), h("span", { class: "opt-label" }, [opt.label]), h("span", { class: "opt-check", "aria-hidden": "true" })]
          : [h("span", { class: "opt-radio", "aria-hidden": "true" }), h("span", { class: "opt-label" }, [opt.label])];
        const b = h("button", {
          class: (grid ? "opt-card" : "opt-row opt--multi") + (on ? " is-selected" : ""),
          type: "button", "aria-pressed": on ? "true" : "false",
          onClick: () => {
            if (chosen.has(opt.id)) chosen.delete(opt.id); else chosen.add(opt.id);
            b.classList.toggle("is-selected");
            b.setAttribute("aria-pressed", chosen.has(opt.id) ? "true" : "false");
            E.setAnswer(step.id, Array.from(chosen)); clearError(card);
          },
        }, kids.filter(Boolean));
        box.appendChild(b);
      });
      card.appendChild(box);
      card.appendChild(footer(step));
    },

    scale(step, card) {
      card.appendChild(titleBlock(step));
      const cur = Number(E.state.answers[step.id]);
      const row = h("div", { class: "scale", role: "radiogroup", "aria-label": tokens(step.question) });
      for (let n = step.scale.min; n <= step.scale.max; n++) {
        const on = cur === n;
        const b = h("button", {
          class: "scale-dot" + (on ? " is-selected" : ""), type: "button", role: "radio",
          "aria-checked": on ? "true" : "false", "aria-label": String(n),
          onClick: () => {
            E.setAnswer(step.id, n); clearError(card);
            row.querySelectorAll("[role=radio]").forEach((x) => { x.classList.remove("is-selected"); x.setAttribute("aria-checked", "false"); });
            b.classList.add("is-selected"); b.setAttribute("aria-checked", "true");
          },
        }, [String(n)]);
        row.appendChild(b);
      }
      card.appendChild(row);
      card.appendChild(h("div", { class: "scale-legend" }, [
        h("span", null, [step.scale.minLabel]), h("span", null, [step.scale.maxLabel]),
      ]));
      card.appendChild(footer(step));
    },

    open(step, card) {
      card.appendChild(titleBlock(step));
      const inp = step.input || {};
      const field = h("div", { class: "field" });
      const input = h("input", {
        class: "field-input", type: "number", inputmode: "decimal",
        placeholder: inp.placeholder || "", min: inp.min, max: inp.max, step: inp.step || "any",
        value: E.state.answers[step.id] != null ? E.state.answers[step.id] : "",
        oninput: (ev) => { E.setAnswer(step.id, ev.target.value); clearError(card); },
        onkeydown: (ev) => { if (ev.key === "Enter") { ev.preventDefault(); advance(); } },
      });
      field.appendChild(input);
      if (inp.unit) field.appendChild(h("span", { class: "field-unit" }, [inp.unit]));
      card.appendChild(field);
      card.appendChild(footer(step));
      setTimeout(() => input.focus(), 80);
    },

    email(step, card) {
      if (step.center) card.classList.add("card--center");
      card.appendChild(h("h1", { class: "q-title", html: titleHTML(step.question) }));
      if (step.body) card.appendChild(h("p", { class: "q-body" }, [tokens(step.body)]));
      const field = h("div", { class: "field" });
      const input = h("input", {
        class: "field-input", type: "email", placeholder: step.input.placeholder, autocomplete: "email",
        value: E.state.answers[step.id] != null ? E.state.answers[step.id] : "",
        oninput: (ev) => { E.setAnswer(step.id, ev.target.value); clearError(card); },
        onkeydown: (ev) => { if (ev.key === "Enter") { ev.preventDefault(); advance(); } },
      });
      field.appendChild(input);
      card.appendChild(field);
      if (step.optIn) {
        const id = "optin-" + step.id;
        card.appendChild(h("label", { class: "optin", for: id }, [
          h("input", { type: "checkbox", id: id, onchange: (ev) => E.setAnswer("_optin", ev.target.checked) }),
          h("span", null, [step.optIn]),
        ]));
      }
      card.appendChild(footer(step));
      setTimeout(() => input.focus(), 80);
    },

    loading(step, card) {
      card.classList.add("card--loading");
      const ring = h("div", { class: "ring" }, [h("span", { class: "cup-illus", html: A.cup })]);
      const pct = h("p", { class: "loading-pct" }, ["0%"]);
      const line = h("p", { class: "loading-line", "aria-live": "polite" }, [tokens(step.question).replace(/\*\*/g, "")]);
      card.appendChild(ring); card.appendChild(pct); card.appendChild(line);
      if (step.foot) card.appendChild(h("p", { class: "reassure" }, [step.foot]));
      card.appendChild(h("p", { class: "loading-heart" }, ["♥"]));

      const frames = step.frames || [];
      const per = step.durationMs || 3000;
      let i = 0;
      const total = per * frames.length;
      const t0 = Date.now();
      const tickPct = () => {
        const p = Math.min(100, Math.round(((Date.now() - t0) / total) * 100));
        ring.style.setProperty("--pct", p); pct.textContent = p + "%";
        if (p < 100) pctTimer = setTimeout(tickPct, 80);
      };
      tickPct();
      const nextFrame = () => {
        if (i < frames.length) { line.textContent = frames[i]; i++; loadingTimer = setTimeout(nextFrame, per); }
        else { advance(); }
      };
      loadingTimer = setTimeout(nextFrame, per);
    },

    result(step, card) { window.QuizResult.render(step, card, { h: h, restart: restart, titleHTML: titleHTML }); },
  };

  let loadingTimer = null, pctTimer = null;
  function clearTimers() {
    if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = null; }
    if (pctTimer) { clearTimeout(pctTimer); pctTimer = null; }
  }

  function advance() {
    const card = el.stage.querySelector(".card:not(.card--out):not(.card--out-back)");
    const res = E.goNext();
    if (!res.ok) { if (card) showError(card, res.msg); return; }
    paint("forward");
  }
  function goBack() { if (E.goBack()) paint("back"); }
  function restart() { E.reset(); E.track("quiz_start", { restart: true }); paint("forward"); }

  function paint(dir) {
    clearTimers();
    const step = E.current();
    const isChrome = step.kind !== "result" && step.id !== "intro" && step.kind !== "loading";

    el.progressRow.style.visibility = isChrome ? "visible" : "hidden";
    const p = Math.round(E.progress() * 100);
    el.progress.style.width = p + "%";
    el.pct.textContent = p + "%";
    el.back.style.visibility = E.canBack() && isChrome ? "visible" : "hidden";

    const card = h("div", { class: "card", tabindex: "-1" });
    (renderers[step.kind] || renderers.statement)(step, card);

    const out = el.stage.querySelector(".card");
    if (out) {
      out.classList.add(dir === "back" ? "card--out-back" : "card--out");
      setTimeout(() => { if (out.parentElement) out.remove(); }, 320);
    }
    card.classList.add(dir === "back" ? "card--in-back" : "card--in");
    el.stage.appendChild(card);
    setTimeout(() => card.focus(), 40);
  }

  el.back.addEventListener("click", goBack);

  function boot() {
    el.logo.innerHTML = A.logo;
    const resumed = E.restore();
    E.track(resumed ? "quiz_resume" : "quiz_start", { resumed: resumed });
    paint("forward");
  }

  window.QuizRender = { boot: boot, paint: paint };
})();
