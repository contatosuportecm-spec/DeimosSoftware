/* ═══════════════════════════════════════════════════════════════════════
   result.js — Tela final: perfil (segmentação), achados (as respostas da
   usuária devolvidas como diagnóstico), projeção de peso e oferta.
   Perfil primário = "pergunta_balde"; fallbacks por resposta_corpo /
   corpo_travado / sai_dieta. Sempre resolve para um perfil válido.
   ═══════════════════════════════════════════════════════════════════════ */

QuizApp.define("result", function (use) {
  "use strict";

  const data = use("data");
  const engine = use("engine");
  const dom = use("dom");
  const el = dom.el;

  let completeTracked = false;

  /* ── Segmentação ── */
  function computeProfile(answers) {
    const bucket = answers.pergunta_balde;
    if (bucket && data.profiles[bucket]) return bucket;
    if (answers.resposta_corpo === "volta") return "sanfona";
    if (answers.resposta_corpo === "luta") return "plato";
    if (answers.resposta_corpo === "estaciona") return "metabolismo";
    const trava = Array.isArray(answers.corpo_travado) ? answers.corpo_travado : [];
    if (trava.indexOf("inflamacao") >= 0) return "plato";
    if (trava.indexOf("metabolismo") >= 0) return "metabolismo";
    const sai = Array.isArray(answers.sai_dieta) ? answers.sai_dieta : [];
    if (sai.indexOf("compulsao") >= 0 || sai.indexOf("ansiedade") >= 0) return "compulsao";
    return "recomeco";
  }

  /* ── Projeção de peso (20 dias por bloco de ~7kg, mínimo 20 dias) ── */
  function projection(answers) {
    const atual = parseFloat(String(answers.peso_atual || "").replace(",", "."));
    const meta = parseFloat(String(answers.meta_peso || "").replace(",", "."));
    if (!atual || !meta || meta >= atual) return null;
    const perder = Math.round((atual - meta) * 10) / 10;
    const dias = Math.max(20, Math.round((perder / 7) * 20));
    return { atual: atual, meta: meta, perder: perder, dias: dias };
  }

  /* ── Achados: devolve o label da opção que a usuária escolheu ── */
  function findingValue(source) {
    const step = engine.stepOf(source);
    const answer = engine.answerOf(source);
    if (!step || answer == null) return null;
    if (Array.isArray(step.options)) {
      const opt = step.options.find(function (o) { return o.id === answer; });
      return opt ? opt.label : null;
    }
    return String(answer);
  }

  function fmt(template, vars) {
    return String(template || "").replace(/\{(\w+)\}/g, function (_, key) {
      return vars[key] != null ? vars[key] : "";
    });
  }

  /* ── Blocos ── */
  function findingsBlock(step) {
    const rows = (step.findings || [])
      .map(function (f) {
        const value = findingValue(f.source);
        return value ? el("li", { class: "finding" }, [
          el("span", { class: "finding-label" }, [f.label]),
          el("span", { class: "finding-value" }, [value]),
        ]) : null;
      })
      .filter(Boolean);
    if (rows.length === 0) return null;
    return el("section", { class: "findings" }, [
      el("p", { class: "section-label" }, [step.copy.findingsTitle]),
      el("ul", { class: "finding-list" }, rows),
    ]);
  }

  function projectionBlock(step, proj) {
    if (!proj) return null;
    const copy = step.copy;
    const fill = el("div", { class: "proj-fill" });
    const block = el("section", { class: "proj" }, [
      el("p", { class: "proj-lead" }, [copy.projectionLead]),
      el("div", { class: "proj-row" }, [
        el("div", null, [
          el("span", { class: "proj-num" }, ["-" + proj.perder]),
          el("span", { class: "proj-unit" }, [" " + copy.unitKg]),
        ]),
        el("div", { class: "proj-arrow", "aria-hidden": "true" }, ["→"]),
        el("div", null, [
          el("span", { class: "proj-num" }, [String(proj.dias)]),
          el("span", { class: "proj-unit" }, [" " + copy.unitDays]),
        ]),
      ]),
      el("div", { class: "proj-track" }, [fill]),
      el("p", { class: "proj-foot" }, [fmt(copy.projectionFoot, proj)]),
    ]);
    requestAnimationFrame(function () {
      fill.style.width = Math.max(10, Math.round((proj.meta / proj.atual) * 100)) + "%";
    });
    return block;
  }

  function offerBlock(step, profile) {
    const offer = step.offer;
    return el("section", { class: "offer" }, [
      el("p", { class: "offer-name" }, [offer.name]),
      el("ul", { class: "offer-bullets" }, offer.bullets.map(function (b) { return el("li", null, [b]); })),
      el("div", { class: "offer-price" }, [
        el("span", { class: "offer-anchor" }, [offer.anchor]),
        el("span", { class: "offer-now" }, [offer.priceLabel]),
      ]),
      /* CTA de COMPRA: única aparição da cor --buy em todo o funil */
      el("a", {
        class: "cta cta--buy", href: data.config.checkoutUrl,
        on: { click: function () { engine.track("cta_click", { profile: profile.key, price: offer.price }); } },
      }, [profile.cta, el("span", { class: "cta-arrow", "aria-hidden": "true" }, ["→"])]),
      el("p", { class: "offer-guarantee" }, [offer.guarantee]),
    ]);
  }

  /**
   * Monta a tela de resultado dentro de `screen`.
   * ctx.restart é injetado pelo render (evita dependência circular).
   */
  function render(step, screen, ctx) {
    const answers = engine.exportAnswers();
    const profileKey = computeProfile(answers);
    engine.state.profile = profileKey;
    const profile = data.profiles[profileKey];

    if (!completeTracked) {
      engine.track("quiz_complete", { profile: profileKey, answers: answers });
      completeTracked = true;
    }

    screen.classList.add("screen--result");
    [
      el("p", { class: "result-badge" }, [profile.badge]),
      el("h1", { class: "title title--statement" }, [dom.richText(profile.title)]),
      findingsBlock(step),
      projectionBlock(step, projection(answers)),
      el("p", { class: "body-text" }, [profile.diagnosis]),
      el("section", { class: "mechanism" }, [
        el("p", { class: "section-label" }, [step.copy.mechanismLabel]),
        el("p", { class: "body-text" }, [profile.why_coffee]),
      ]),
      offerBlock(step, profile),
      el("button", { class: "link-restart", type: "button", on: { click: ctx.restart } }, [step.copy.restart]),
    ].forEach(function (node) { if (node) screen.appendChild(node); });
  }

  return {
    render: render,
    computeProfile: computeProfile,
    reset: function () { completeTracked = false; },
  };
});
