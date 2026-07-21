/* ═══════════════════════════════════════════════════════════════════════
   dom.js — Helpers de construção de DOM.
   API explícita e segura: conteúdo vira SEMPRE nó de texto (nunca
   innerHTML). O único ponto de injeção de HTML é trustedSvg(), reservado
   ao SVG estático de assets.js.
   ═══════════════════════════════════════════════════════════════════════ */

QuizApp.define("dom", function () {
  "use strict";

  /**
   * Cria um elemento.
   * attrs:
   *   class    → className
   *   dataset  → { chave: valor } (vira data-*)
   *   on       → { evento: handler }
   *   demais   → setAttribute (aria-*, role, type, href…)
   * children: array de Node | string (string vira TextNode)
   */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        const value = attrs[key];
        if (value == null) return;
        if (key === "class") node.className = value;
        else if (key === "dataset") Object.assign(node.dataset, value);
        else if (key === "on") Object.keys(value).forEach(function (evt) { node.addEventListener(evt, value[evt]); });
        else node.setAttribute(key, value);
      });
    }
    if (children) {
      children.forEach(function (child) {
        if (child == null) return;
        node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
      });
    }
    return node;
  }

  /**
   * "texto com **destaque**" → fragmento com <span class="hi">destaque</span>.
   * Tudo vira nó de texto — zero innerHTML, à prova de injeção.
   */
  function richText(str) {
    const frag = document.createDocumentFragment();
    String(str || "").split(/\*\*(.+?)\*\*/g).forEach(function (part, i) {
      if (!part) return;
      if (i % 2 === 1) frag.appendChild(el("span", { class: "hi" }, [part]));
      else frag.appendChild(document.createTextNode(part));
    });
    return frag;
  }

  /**
   * ÚNICO ponto de innerHTML do projeto. Aceita apenas o SVG estático e
   * confiável de assets.js — jamais passe conteúdo de quiz-data ou da usuária.
   */
  function trustedSvg(markup, className) {
    const span = el("span", { class: className, "aria-hidden": "true" });
    span.innerHTML = markup;
    return span;
  }

  return { el: el, richText: richText, trustedSvg: trustedSvg };
});
