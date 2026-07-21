/* ═══════════════════════════════════════════════════════════════════════
   result.js — Segmentação (perfil) + projeção + oferta.
   Perfil primário = "pergunta_balde"; reforços por resposta_corpo /
   corpo_travado / sai_dieta. Sempre resolve para um perfil válido.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const QUIZ = window.QUIZ;
  const E = window.QuizEngine;

  const BALDE = { metabolismo: 1, compulsao: 1, plato: 1, sanfona: 1, recomeco: 1 };

  function computeProfile(a) {
    const b = a.pergunta_balde;
    if (b && BALDE[b]) return b;
    if (a.resposta_corpo === "volta") return "sanfona";
    if (a.resposta_corpo === "luta") return "plato";
    if (a.resposta_corpo === "estaciona") return "metabolismo";
    const t = Array.isArray(a.corpo_travado) ? a.corpo_travado : [];
    if (t.indexOf("inflamacao") >= 0) return "plato";
    if (t.indexOf("metabolismo") >= 0) return "metabolismo";
    const s = Array.isArray(a.sai_dieta) ? a.sai_dieta : [];
    if (s.indexOf("compulsao") >= 0 || s.indexOf("ansiedade") >= 0) return "compulsao";
    return "recomeco";
  }

  function projection(a) {
    const atual = parseFloat(String(a.peso_atual || "").replace(",", "."));
    const meta = parseFloat(String(a.meta_peso || "").replace(",", "."));
    if (!atual || !meta || meta >= atual) return null;
    const perder = Math.round((atual - meta) * 10) / 10;
    const dias = Math.max(20, Math.round((perder / 7) * 20));
    return { atual: atual, meta: meta, perder: perder, dias: dias };
  }

  function render(step, card, ctx) {
    const h = ctx.h, T = ctx.titleHTML;
    const a = E.exportAnswers();
    const key = computeProfile(a);
    E.state.profile = key;
    const p = QUIZ.profiles[key];
    const proj = projection(a);
    const offer = step.offer;

    E.track("quiz_complete", { profile: key, answers: a });
    card.classList.add("card--result");

    card.appendChild(h("p", { class: "result-badge" }, [p.badge]));
    card.appendChild(h("h1", { class: "q-title q-title--lg", html: T(p.title) }));

    if (proj) {
      const box = h("div", { class: "proj" });
      box.appendChild(h("p", { class: "proj-lead" }, ["Com base no seu peso atual e na sua meta:"]));
      const track = h("div", { class: "proj-track" }, [h("div", { class: "proj-fill" })]);
      box.appendChild(h("div", { class: "proj-row" }, [
        h("div", null, [h("span", { class: "proj-num" }, ["-" + proj.perder]), h("span", { class: "proj-unit" }, [" kg"])]),
        h("div", { class: "proj-arrow", "aria-hidden": "true" }, ["→"]),
        h("div", null, [h("span", { class: "proj-num" }, [String(proj.dias)]), h("span", { class: "proj-unit" }, [" dias"])]),
      ]));
      box.appendChild(track);
      box.appendChild(h("p", { class: "proj-foot" }, ["de " + proj.atual + "kg para " + proj.meta + "kg com o Ritual Matinal"]));
      card.appendChild(box);
      requestAnimationFrame(() => {
        const f = track.querySelector(".proj-fill");
        f.style.width = Math.max(10, Math.round((proj.meta / proj.atual) * 100)) + "%";
      });
    }

    card.appendChild(h("p", { class: "q-body" }, [p.diagnosis]));
    card.appendChild(h("div", { class: "result-mechanism" }, [
      h("p", { class: "result-mechanism-label" }, ["Por que o Truque do Café resolve"]),
      h("p", { class: "q-body" }, [p.why_coffee]),
    ]));

    const box = h("div", { class: "offer" });
    box.appendChild(h("p", { class: "offer-name" }, [offer.name]));
    const ul = h("ul", { class: "offer-bullets" });
    offer.bullets.forEach((b) => ul.appendChild(h("li", null, [b])));
    box.appendChild(ul);
    box.appendChild(h("div", { class: "offer-price" }, [
      h("span", { class: "offer-anchor" }, [offer.anchor]),
      h("span", { class: "offer-now" }, [offer.priceLabel]),
    ]));
    box.appendChild(h("a", {
      class: "btn btn-primary btn-cta", href: QUIZ.config.checkoutUrl,
      onClick: () => E.track("cta_click", { profile: key, price: offer.price }),
    }, [p.cta, h("span", { class: "arrow", "aria-hidden": "true" }, ["→"])]));
    box.appendChild(h("p", { class: "offer-guarantee" }, [offer.guarantee]));
    card.appendChild(box);

    card.appendChild(h("button", { class: "link-reset", type: "button", onClick: ctx.restart }, ["Refazer o quiz"]));
  }

  window.QuizResult = { render: render, computeProfile: computeProfile };
})();
