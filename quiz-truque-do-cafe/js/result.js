/* ═══════════════════════════════════════════════════════════════════════
   result.js — Segmentação (perfil) + projeção + CTA por perfil.
   Perfil primário vem da "pergunta_balde"; reforçado por "corpo_travado" e
   "resposta_corpo". Fallback = "recomeco". Sempre resolve p/ um perfil válido.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const QUIZ = window.QUIZ;
  const E = window.QuizEngine;

  /* Mapa balde → perfil (mesmas chaves de QUIZ.profiles) */
  const BALDE_TO_PROFILE = {
    metabolismo: "metabolismo",
    compulsao: "compulsao",
    plato: "plato",
    sanfona: "sanfona",
    recomeco: "recomeco",
  };

  function computeProfile(a) {
    // 1) pergunta-balde é a fonte primária
    const balde = a.pergunta_balde;
    if (balde && BALDE_TO_PROFILE[balde]) return BALDE_TO_PROFILE[balde];

    // 2) reforço por "resposta_corpo"
    if (a.resposta_corpo === "volta") return "sanfona";
    if (a.resposta_corpo === "luta") return "plato";
    if (a.resposta_corpo === "estaciona") return "metabolismo";

    // 3) reforço por crença "corpo_travado" (multi)
    const travado = Array.isArray(a.corpo_travado) ? a.corpo_travado : [];
    if (travado.indexOf("inflamacao") >= 0) return "plato";
    if (travado.indexOf("metabolismo") >= 0) return "metabolismo";

    // 4) compulsão explícita
    const saiDieta = Array.isArray(a.sai_dieta) ? a.sai_dieta : [];
    if (saiDieta.indexOf("compulsao") >= 0 || saiDieta.indexOf("ansiedade") >= 0) return "compulsao";

    return "recomeco";
  }

  /* Projeção de peso simples a partir de peso atual + meta (guardas de sanidade) */
  function projection(a) {
    const atual = parseFloat(String(a.peso_atual || "").replace(",", "."));
    const meta = parseFloat(String(a.meta_peso || "").replace(",", "."));
    if (!atual || !meta || meta >= atual) return null;
    const perder = Math.round((atual - meta) * 10) / 10;
    // ritmo comunicado na promessa: ~7kg / 20 dias → ~0.35 kg/dia (mensagem, não prescrição)
    const dias = Math.max(20, Math.round((perder / 7) * 20));
    return { atual: atual, meta: meta, perder: perder, dias: dias };
  }

  function render(step, card, ctx) {
    const h = ctx.h;
    const a = E.exportAnswers();
    const key = computeProfile(a);
    E.state.profile = key;
    const p = QUIZ.profiles[key];
    const proj = projection(a);
    const offer = step.offer;

    E.track("quiz_complete", { profile: key, answers: a });

    card.classList.add("card--result");

    // Cabeçalho / badge do perfil
    card.appendChild(h("p", { class: "result-kicker" }, ["SEU DIAGNÓSTICO"]));
    card.appendChild(h("p", { class: "result-badge" }, [p.badge]));
    card.appendChild(h("h1", { class: "q-title q-title--lg" }, [p.title]));

    // Projeção (se peso/meta preenchidos)
    if (proj) {
      const projBox = h("div", { class: "proj" });
      projBox.appendChild(h("p", { class: "proj-lead" }, ["Com base no seu peso atual e na sua meta:"]));
      const row = h("div", { class: "proj-row" }, [
        h("div", { class: "proj-stat" }, [
          h("span", { class: "proj-num" }, ["-" + proj.perder]),
          h("span", { class: "proj-unit" }, ["kg"]),
        ]),
        h("div", { class: "proj-arrow", "aria-hidden": "true" }, ["→"]),
        h("div", { class: "proj-stat" }, [
          h("span", { class: "proj-num" }, [String(proj.dias)]),
          h("span", { class: "proj-unit" }, ["dias"]),
        ]),
      ]);
      projBox.appendChild(row);
      // barra visual atual → meta
      const track = h("div", { class: "proj-track" }, [h("div", { class: "proj-fill" })]);
      projBox.appendChild(track);
      projBox.appendChild(h("p", { class: "proj-foot" }, [
        "de " + proj.atual + "kg para " + proj.meta + "kg com o Ritual Matinal",
      ]));
      card.appendChild(projBox);
      requestAnimationFrame(() => {
        const fill = track.querySelector(".proj-fill");
        const pct = Math.max(8, Math.round((proj.meta / proj.atual) * 100));
        fill.style.width = pct + "%";
      });
    }

    // Diagnóstico + porquê do café
    card.appendChild(h("p", { class: "q-body" }, [p.diagnosis]));
    card.appendChild(h("div", { class: "result-mechanism" }, [
      h("p", { class: "result-mechanism-label" }, ["POR QUE O TRUQUE DO CAFÉ RESOLVE"]),
      h("p", { class: "q-body" }, [p.why_coffee]),
    ]));

    // Oferta
    const box = h("div", { class: "offer" });
    box.appendChild(h("p", { class: "offer-name" }, [offer.name]));
    const bullets = h("ul", { class: "offer-bullets" });
    offer.bullets.forEach((b) => bullets.appendChild(h("li", null, [b])));
    box.appendChild(bullets);
    box.appendChild(h("div", { class: "offer-price" }, [
      h("span", { class: "offer-anchor" }, [offer.anchor]),
      h("span", { class: "offer-now" }, [offer.priceLabel]),
    ]));
    box.appendChild(h("a", {
      class: "btn btn-primary btn-cta", href: QUIZ.config.checkoutUrl,
      onClick: () => E.track("cta_click", { profile: key, price: offer.price }),
    }, [p.cta]));
    box.appendChild(h("p", { class: "offer-guarantee" }, [offer.guarantee]));
    card.appendChild(box);

    // reiniciar (discreto)
    card.appendChild(h("button", {
      class: "link-reset", type: "button", onClick: ctx.restart,
    }, ["Refazer o quiz"]));
  }

  window.QuizResult = { render: render, computeProfile: computeProfile };
})();
