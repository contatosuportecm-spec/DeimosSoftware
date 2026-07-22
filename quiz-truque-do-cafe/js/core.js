/* ═══════════════════════════════════════════════════════════════════════
   core.js — micro-registry de módulos.
   Substitui o acoplamento por window.*: cada módulo declara suas
   dependências recebendo `use` e é instanciado uma única vez (lazy).
   Sem build step — funciona com <script> clássico via file:// e http.
   ═══════════════════════════════════════════════════════════════════════ */

(function (global) {
  "use strict";

  const factories = {};
  const instances = {};

  function use(name) {
    if (name in instances) return instances[name];
    const factory = factories[name];
    if (!factory) throw new Error('QuizApp: módulo não registrado: "' + name + '"');
    instances[name] = factory(use);
    return instances[name];
  }

  global.QuizApp = {
    define: function (name, factory) { factories[name] = factory; },
    use: use,
  };
})(window);
