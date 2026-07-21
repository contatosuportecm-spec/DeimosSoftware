/* ═══════════════════════════════════════════════════════════════════════
   render.js — Camada de apresentação. Desenha cada tela a partir dos
   dados; nenhuma string de pergunta mora aqui.

   Gramática de interação (spec):
   • escolha única / escala → AUTO-AVANÇA ~260ms após o toque (sem botão)
   • múltipla escolha       → CTA sticky, desabilitado até ≥1 seleção
   • inputs / interstitials → CTA habilita com valor válido
   • indicador decorativo: ● círculo = auto-avança · ■ quadrado = confirmar
   ═══════════════════════════════════════════════════════════════════════ */

QuizApp.define("render", function (use) {
  "use strict";

  const data = use("data");
  const engine = use("engine");
  const assets = use("assets");
  const result = use("result");
  const dom = use("dom");
  const el = dom.el;

  const UI = data.ui;
  const AUTO_ADVANCE_MS = data.config.autoAdvanceMs;
  const SWAP_MS = 320; // = --dur-base do CSS (saída da tela anterior)

  let refs = null; // esqueleto estático (index.html), preenchido no boot

  /* ── Controlador de efeitos: todo timer pertence à tela corrente e
        morre no dispose() — nada vaza ao trocar de tela ── */
  function createFx() {
    const timeouts = new Set();
    const intervals = new Set();
    return {
      delay: function (ms, fn) {
        const t = setTimeout(function () { timeouts.delete(t); fn(); }, ms);
        timeouts.add(t);
      },
      every: function (ms, fn) { intervals.add(setInterval(fn, ms)); },
      dispose: function () {
        timeouts.forEach(clearTimeout);
        intervals.forEach(clearInterval);
        timeouts.clear();
        intervals.clear();
      },
    };
  }
  let fx = createFx();

  /* ── Texto ── */
  function interpolate(str) {
    return String(str || "").replace(/\{socialProofCount\}/g, data.config.socialProofCount);
  }
  function questionTitle(step, modifier) {
    return el("h1", { class: "title" + (modifier ? " " + modifier : "") }, [dom.richText(interpolate(step.question))]);
  }
  function questionHead(step) {
    const kids = [questionTitle(step)];
    if (step.microcopy) kids.push(el("p", { class: "microcopy" }, [interpolate(step.microcopy)]));
    return el("header", { class: "question-head" }, kids);
  }

  /* ── Visual da opção (foto > silhueta > ícone), na calha fixa de 40px ── */
  function optionVisual(opt) {
    if (opt.image) return el("img", { class: "opt-photo", src: opt.image, alt: "" });
    if (opt.body && assets.body[opt.body]) return dom.trustedSvg(assets.body[opt.body], "opt-icon opt-icon--body");
    if (opt.icon && assets.icons[opt.icon]) return dom.trustedSvg(assets.icons[opt.icon], "opt-icon");
    return null;
  }

  /**
   * Componente ÚNICO de lista de opções (single / multi / scale).
   * opts:
   *   mode        "single" | "multi"  (single seleciona 1 e auto-avança)
   *   variant     "list" (padrão) | "scale" (quadrados 1–5 em linha)
   *   options     [{ id, label, … }]
   *   initial     seleção atual (string | string[] | number)
   *   commit(ids) persiste a resposta (recebe array de ids selecionados)
   *   onCount(n)  multi: notifica o CTA a cada mudança
   * Um único listener de clique por container (event delegation).
   */
  function optionList(step, opts) {
    const single = opts.mode === "single";
    const scale = opts.variant === "scale";
    const selected = new Set(
      (Array.isArray(opts.initial) ? opts.initial : opts.initial != null ? [opts.initial] : []).map(String)
    );

    function buildOption(opt) {
      const children = [];
      if (!scale) {
        const visual = optionVisual(opt);
        if (visual) children.push(el("span", { class: "opt-gutter" }, [visual]));
      }
      children.push(el("span", { class: "opt-label" }, [opt.label]));
      if (!scale) {
        // indicador decorativo que ensina o modo: ● auto-avança · ■ confirmar
        children.push(el("span", {
          class: "opt-indicator " + (single ? "opt-indicator--radio" : "opt-indicator--check"),
          "aria-hidden": "true",
        }));
      }
      return el("button", {
        class: scale ? "opt-dot" : "opt-card",
        type: "button",
        role: single ? "radio" : "checkbox",
        "aria-checked": String(selected.has(String(opt.id))),
        dataset: { opt: String(opt.id) },
      }, children);
    }

    const container = el("div", {
      class: scale ? "opt-scale" : "opt-list",
      role: single ? "radiogroup" : "group",
      "aria-label": opts.ariaLabel || interpolate(step.question),
    }, opts.options.map(buildOption));

    function sync() {
      container.querySelectorAll("[data-opt]").forEach(function (btn) {
        const isOn = selected.has(btn.dataset.opt);
        btn.classList.toggle("is-selected", isOn);
        btn.setAttribute("aria-checked", String(isOn));
      });
    }
    sync();

    container.addEventListener("click", function (ev) {
      const btn = ev.target.closest("[data-opt]");
      if (!btn || container.dataset.locked) return;
      const id = btn.dataset.opt;

      if (single) {
        selected.clear();
        selected.add(id);
        sync();
        opts.commit(Array.from(selected));
        // trava o container e deixa a seleção visível antes de avançar
        container.dataset.locked = "true";
        fx.delay(AUTO_ADVANCE_MS, advance);
      } else {
        if (selected.has(id)) selected.delete(id); else selected.add(id);
        sync();
        opts.commit(Array.from(selected));
        if (opts.onCount) opts.onCount(selected.size);
      }
    });

    // setas navegam entre as opções (radiogroup acessível)
    container.addEventListener("keydown", function (ev) {
      const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
      if (!delta) return;
      const items = Array.prototype.slice.call(container.querySelectorAll("[data-opt]"));
      const idx = items.indexOf(document.activeElement);
      if (idx < 0) return;
      ev.preventDefault();
      items[(idx + delta + items.length) % items.length].focus();
    });

    return container;
  }

  /* ── CTA sticky do rodapé ── */
  function ctaFooter(label, options) {
    const disabled = options && options.disabled;
    const button = el("button", { class: "cta", type: "button", on: { click: advance } }, [
      label, el("span", { class: "cta-arrow", "aria-hidden": "true" }, ["→"]),
    ]);
    button.disabled = !!disabled;
    return { root: el("div", { class: "footer" }, [button]), button: button };
  }

  /* ── Campo de texto com CTA que habilita quando o valor é válido ── */
  function validatedField(step, screen, inputAttrs) {
    const footer = ctaFooter(step.cta || UI.continueLabel, { disabled: true });
    const hint = el("p", { class: "field-hint", role: "status" });

    const input = el("input", Object.assign({
      class: "field-input",
      placeholder: (step.input && step.input.placeholder) || "",
      value: engine.answerOf(step.id) != null ? engine.answerOf(step.id) : "",
      on: {
        input: function (ev) {
          const value = ev.target.value;
          engine.setAnswer(step.id, value);
          const check = engine.validate(step.id, value);
          footer.button.disabled = !check.ok;
          hint.textContent = !check.ok && value.trim() !== "" ? check.msg : "";
        },
        keydown: function (ev) {
          if (ev.key === "Enter" && !footer.button.disabled) { ev.preventDefault(); advance(); }
        },
      },
    }, inputAttrs));

    // estado inicial (resposta restaurada da sessão)
    footer.button.disabled = !engine.validate(step.id, engine.answerOf(step.id)).ok;

    const wrap = el("div", { class: "field" }, [input]);
    if (step.input && step.input.unit) wrap.appendChild(el("span", { class: "field-unit" }, [step.input.unit]));
    screen.appendChild(wrap);
    screen.appendChild(hint);
    screen.appendChild(footer.root);
    fx.delay(80, function () { input.focus(); });
  }

  /* ── Telas (uma função por kind) ── */
  const screens = {
    statement: function (step, screen) {
      screen.classList.add("screen--statement");
      if (step.hero) screen.appendChild(el("div", { class: "hero" }, [dom.trustedSvg(assets.cup, "hero-cup")]));
      screen.appendChild(questionTitle(step, "title--statement"));
      if (step.body) screen.appendChild(el("p", { class: "body-text" }, [interpolate(step.body)]));
      if (step.benefits) {
        screen.appendChild(el("ul", { class: "benefits" }, step.benefits.map(function (b) {
          return el("li", null, [b]);
        })));
      }
      if (step.reassure) screen.appendChild(el("p", { class: "reassure" }, [interpolate(step.reassure)]));
      if (step.estimatedTime) {
        screen.appendChild(el("p", { class: "est-time" }, ["⏱ ", el("b", null, [step.estimatedTime])]));
      }
      screen.appendChild(ctaFooter(step.cta || UI.continueLabel).root);
    },

    single: function (step, screen) {
      screen.appendChild(questionHead(step));
      screen.appendChild(optionList(step, {
        mode: "single",
        options: step.options,
        initial: engine.answerOf(step.id),
        commit: function (ids) { engine.setAnswer(step.id, ids[0]); },
      }));
      // sem botão: escolha única auto-avança
    },

    multi: function (step, screen) {
      const initial = engine.answerOf(step.id);
      const footer = ctaFooter(UI.continueLabel, { disabled: !(Array.isArray(initial) && initial.length > 0) });
      screen.appendChild(questionHead(step));
      screen.appendChild(optionList(step, {
        mode: "multi",
        options: step.options,
        initial: initial,
        commit: function (ids) { engine.setAnswer(step.id, ids); },
        onCount: function (n) { footer.button.disabled = n === 0; },
      }));
      screen.appendChild(footer.root);
    },

    scale: function (step, screen) {
      const range = [];
      for (let n = step.scale.min; n <= step.scale.max; n++) range.push({ id: String(n), label: String(n) });
      screen.appendChild(questionHead(step));
      screen.appendChild(optionList(step, {
        mode: "single",
        variant: "scale",
        options: range,
        initial: engine.answerOf(step.id),
        ariaLabel: interpolate(step.question) + " (" + step.scale.min + " = " + step.scale.minLabel +
          ", " + step.scale.max + " = " + step.scale.maxLabel + ")",
        commit: function (ids) { engine.setAnswer(step.id, Number(ids[0])); },
      }));
      screen.appendChild(el("div", { class: "scale-legend", "aria-hidden": "true" }, [
        el("span", null, [step.scale.minLabel]),
        el("span", null, [step.scale.maxLabel]),
      ]));
      // sem botão: escala auto-avança
    },

    open: function (step, screen) {
      screen.appendChild(questionHead(step));
      validatedField(step, screen, { type: "text", inputmode: "decimal", autocomplete: "off" });
    },

    email: function (step, screen) {
      screen.appendChild(questionHead(step));
      if (step.body) screen.appendChild(el("p", { class: "body-text body-text--center" }, [interpolate(step.body)]));
      validatedField(step, screen, { type: "email", inputmode: "email", autocomplete: "email" });
      if (step.optIn) {
        const checkboxId = "optin-" + step.id;
        const optin = el("label", { class: "optin", for: checkboxId }, [
          el("input", {
            type: "checkbox", id: checkboxId,
            on: { change: function (ev) { engine.setAnswer("email_optin", ev.target.checked); } },
          }),
          el("span", null, [step.optIn]),
        ]);
        // o opt-in entra antes do rodapé sticky
        screen.insertBefore(optin, screen.querySelector(".footer"));
      }
    },

    loading: function (step, screen) {
      screen.classList.add("screen--loading");
      const ring = el("div", { class: "ring" }, [dom.trustedSvg(assets.cup, "ring-cup")]);
      const pct = el("p", { class: "loading-pct" }, ["0%"]);
      const line = el("p", { class: "loading-line" }, [""]);
      screen.appendChild(ring);
      screen.appendChild(pct);
      screen.appendChild(el("h1", { class: "loading-title" }, [dom.richText(interpolate(step.question))]));
      screen.appendChild(line);
      if (step.foot) screen.appendChild(el("p", { class: "reassure" }, [step.foot]));

      const frames = step.frames || [];
      const total = step.durationMs || 5000;
      const startedAt = Date.now();
      let finished = false;

      fx.every(80, function () {
        const elapsed = Date.now() - startedAt;
        const p = Math.min(100, Math.round((elapsed / total) * 100));
        ring.style.setProperty("--pct", p);
        pct.textContent = p + "%";
        if (frames.length) {
          const i = Math.min(frames.length - 1, Math.floor((elapsed / total) * frames.length));
          if (line.textContent !== frames[i]) line.textContent = frames[i];
        }
        if (p >= 100 && !finished) {
          finished = true;
          fx.delay(400, advance);
        }
      });
    },

    result: function (step, screen) {
      result.render(step, screen, { restart: restart });
    },
  };

  /* ── Header: barra segmentada por capítulo OU logo (interstitials) ── */
  function renderHeader() {
    const progress = engine.progressInfo();
    const showBack = progress.visible && engine.canBack();

    refs.back.classList.toggle("is-hidden", !showBack);
    refs.center.hidden = !progress.visible;
    refs.logoBox.hidden = progress.visible;

    if (!progress.visible) return;
    refs.chapter.textContent = progress.label;
    refs.progress.setAttribute("aria-valuenow", String(progress.percent));
    progress.segments.forEach(function (fill, i) {
      refs.segments[i].style.width = Math.round(fill * 100) + "%";
    });
  }

  /* ── Troca de tela com limpeza determinística ── */
  function swapScreen(next, dir) {
    // remove qualquer tela cuja animação de saída tenha ficado órfã
    refs.stage.querySelectorAll(".screen--leaving").forEach(function (n) { n.remove(); });

    const prev = refs.stage.querySelector(".screen");
    if (prev) {
      prev.classList.add("screen--leaving", dir === "back" ? "screen--out-back" : "screen--out");
      fx.delay(SWAP_MS, function () { prev.remove(); });
    }
    next.classList.add(dir === "back" ? "screen--in-back" : "screen--in");
    refs.stage.appendChild(next);

    // foco para leitores de tela (inputs assumem o foco nos kinds de campo)
    const kind = next.dataset.kind;
    if (kind !== "open" && kind !== "email") {
      fx.delay(60, function () { next.focus({ preventScroll: true }); });
    }
  }

  function paint(dir) {
    fx.dispose();
    fx = createFx();

    const step = engine.current();
    renderHeader();

    const screen = el("section", { class: "screen", tabindex: "-1", dataset: { kind: step.kind } });
    (screens[step.kind] || screens.statement)(step, screen);
    swapScreen(screen, dir);
    window.scrollTo(0, 0);
  }

  function advance() {
    const res = engine.goNext();
    if (!res.ok || res.done) return; // CTAs desabilitados tornam o !ok raro
    paint("forward");
  }
  function goBack() {
    if (engine.goBack()) paint("back");
  }
  function restart() {
    engine.reset();
    result.reset();
    engine.track("quiz_start", { restart: true });
    paint("forward");
  }

  /* ── Boot ── */
  function boot() {
    const progressEl = document.getElementById("progress");
    refs = {
      back: document.getElementById("btn-back"),
      center: document.getElementById("header-center"),
      chapter: document.getElementById("chapter-label"),
      progress: progressEl,
      logoBox: document.getElementById("header-logo"),
      stage: document.getElementById("stage"),
      segments: [],
    };

    refs.back.setAttribute("aria-label", UI.back);
    refs.back.addEventListener("click", goBack);
    refs.logoBox.appendChild(dom.trustedSvg(assets.logo, "logo"));

    progressEl.setAttribute("aria-label", UI.progressLabel);
    data.chapters.forEach(function () {
      const fill = el("span", { class: "seg-fill" });
      progressEl.appendChild(el("span", { class: "seg" }, [fill]));
      refs.segments.push(fill);
    });

    const resumed = engine.restore();
    engine.track(resumed ? "quiz_resume" : "quiz_start", { resumed: resumed });
    paint("forward");
  }

  return { boot: boot };
});
