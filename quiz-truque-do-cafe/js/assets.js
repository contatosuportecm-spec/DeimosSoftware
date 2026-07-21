/* ═══════════════════════════════════════════════════════════════════════
   assets.js — Logo + ícones + ilustrações em SVG inline (escaláveis).
   Todos usam `currentColor` / classe .lg → cor vem do CSS (tokens), zero hex.
   ESTE é o único conteúdo autorizado a passar por injeção de HTML
   (dom.trustedSvg) — nunca dados de usuária/quiz-data.
   ►► Para trocar um ícone por foto: no quiz-data, use `image: "img/x.png"`
      na opção — o render prioriza a foto quando existe. ◄◄
   ═══════════════════════════════════════════════════════════════════════ */

QuizApp.define("assets", function () {
  "use strict";

  // Monograma "Truque do Café" (T + xícara + vapor + pires gold)
  const LOGO =
    '<svg viewBox="0 0 120 120" role="img" aria-label="Truque do Café" fill="none">' +
      '<path class="lg" d="M64 26c4-3 4-8 0-11M72 28c4-3 4-9 0-12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity="0.9"/>' +
      '<path d="M34 40h40M54 40v46" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M44 52h34v14c0 12-8 20-17 20s-17-8-17-20V52z" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M78 56c9 0 13 5 13 11s-4 11-13 11" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' +
      '<path class="lg" d="M34 96c8 6 44 6 52 0" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
    '</svg>';

  // Ícones de linha (24x24, stroke currentColor)
  function ic(body) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }
  const ICONS = {
    coffee:   ic('<path d="M5 9h11v4a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 3c1 1 1 2 0 3M11 3c1 1 1 2 0 3"/>'),
    brain:    ic('<path d="M9 4a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 11a2.5 2.5 0 0 0 1.5 4.5A2.5 2.5 0 0 0 9 20a2 2 0 0 0 3-1.7V6A2 2 0 0 0 9 4z"/><path d="M15 4a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 19 11a2.5 2.5 0 0 1-1.5 4.5A2.5 2.5 0 0 1 15 20a2 2 0 0 1-3-1.7"/>'),
    flame:    ic('<path d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-1 .5-2 1.3-3C9 10 10 9 12 3z"/><path d="M12 20a2.5 2.5 0 0 0 2.5-2.5c0-1.5-1.2-2.2-2.5-3.5-1.3 1.3-2.5 2-2.5 3.5A2.5 2.5 0 0 0 12 20z"/>'),
    cupcake:  ic('<path d="M6 11h12l-1.3 8.2a1 1 0 0 1-1 .8H8.3a1 1 0 0 1-1-.8L6 11z"/><path d="M6.5 11a3 3 0 0 1 .4-5A3.2 3.2 0 0 1 12 4a3.2 3.2 0 0 1 5.1 2 3 3 0 0 1 .4 5"/>'),
    battery:  ic('<rect x="3" y="8" width="15" height="9" rx="2"/><path d="M21 11v3"/><path d="M6 11v3"/>'),
    sparkles: ic('<path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4z"/><path d="M18 15l.7 1.8L20.5 17l-1.8.7L18 19.5l-.7-1.8L15.5 17l1.8-.2L18 15z"/>'),
    ruler:    ic('<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 7v3M11 7v4M15 7v3M19 7v4"/>'),
    fork:     ic('<path d="M7 3v7a2 2 0 0 0 4 0V3M9 10v11"/><path d="M16 3c-1.5 0-2 3-2 5s1 3 2 3 2 0 2 0v10"/>'),
    feather:  ic('<path d="M20 4c-6 0-11 3-13 9l-3 7 7-3c6-2 9-7 9-13z"/><path d="M16 8L7 17"/>'),
    scale:    ic('<path d="M12 3v18"/><path d="M6 21h12"/><path d="M4 7l8-2 8 2"/><path d="M4 7l-2 6a3 3 0 0 0 6 0L4 7zM20 7l-2 6a3 3 0 0 0 6 0L20 7z"/>'),
    moon:     ic('<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/>'),
    clock:    ic('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'),
    heart:    ic('<path d="M12 20s-7-4.5-9.2-9C1.3 8 3 5 6 5c2 0 3 1.2 6 4 3-2.8 4-4 6-4 3 0 4.7 3 3.2 6-2.2 4.5-9.2 9-9.2 9z"/>'),
    shield:   ic('<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>'),
    mirror:   ic('<rect x="6" y="3" width="12" height="14" rx="6"/><path d="M12 17v4M9 21h6"/>'),
    droplet:  ic('<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>'),
    calendar: ic('<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>'),
    leaf:     ic('<path d="M4 20c0-9 6-15 16-15 0 10-6 16-16 15z"/><path d="M9 15c3-3 6-4 9-5"/>'),
    bolt:     ic('<path d="M13 3l-8 10h6l-1 8 8-10h-6l1-8z"/>'),
    repeat:   ic('<path d="M4 9a6 6 0 0 1 10-4l2 2M20 15a6 6 0 0 1-10 4l-2-2"/><path d="M16 3v4h-4M8 21v-4h4"/>'),
    person:   ic('<circle cx="12" cy="7" r="3.2"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/>'),
    question: ic('<circle cx="12" cy="12" r="9"/><path d="M9.2 9.2a2.8 2.8 0 0 1 5.3 1.1c0 1.8-2.5 2.2-2.5 3.7"/><path d="M12 17.2h.01"/>'),
    star:     ic('<path d="M12 3l2.5 6L21 9.6l-4.7 4.3L17.5 21 12 17.4 6.5 21l1.2-7.1L3 9.6 9.5 9 12 3z"/>'),
  };

  // Silhuetas de corpo (pergunta "silhueta") — trocáveis por foto via option.image
  function sil(body) {
    return '<svg viewBox="0 0 80 120" fill="currentColor" aria-hidden="true">' + body + '</svg>';
  }
  const BODY = {
    oval:      sil('<circle cx="40" cy="16" r="9"/><path d="M28 30h24c4 0 6 3 6 7 0 12 6 14 6 30 0 18-8 24-8 40H28c0-16-8-22-8-40 0-16 6-18 6-30 0-4 2-7 6-7z"/>'),
    pera:      sil('<circle cx="40" cy="16" r="9"/><path d="M30 30h20c3 0 5 2 5 6 0 8 3 10 3 20 0 22 6 24 6 44H27c0-20 6-22 6-44 0-10 3-12 3-20 0-4 2-6 5-6z"/>'),
    reto:      sil('<circle cx="40" cy="16" r="9"/><path d="M28 30h24c3 0 5 2 5 6v58c0 4-2 6-5 6H28c-3 0-5-2-5-6V36c0-4 2-6 5-6z"/>'),
    ampulheta: sil('<circle cx="40" cy="16" r="9"/><path d="M27 30h26c3 0 4 3 3 6l-5 20c-1 4-1 6 0 10l5 22c1 3 0 6-3 6H27c-3 0-4-3-3-6l5-22c1-4 1-6 0-10l-5-20c-1-3 0-6 3-6z"/>'),
  };

  // Xícara para hero/loading (anel de progresso gira via CSS)
  const CUP =
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M14 26h28v10a12 12 0 0 1-12 12H26a12 12 0 0 1-12-12V26z"/>' +
      '<path d="M42 28h4a5 5 0 0 1 0 10h-4"/>' +
      '<path class="lg" d="M24 12c2 2 2 4 0 6M32 12c2 2 2 4 0 6"/>' +
    '</svg>';

  return { logo: LOGO, icons: ICONS, body: BODY, cup: CUP };
});
