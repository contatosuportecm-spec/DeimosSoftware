/**
 * Quiz Extract — lê todos os manifests do batch e gera relatórios.
 *
 *  - dump_por_quiz.md : texto verbatim de cada tela, organizado por marca
 *  - dump_consolidado.md : tabela cruzando padrões entre marcas
 */

import * as fs from "fs";
import * as path from "path";

type Screen = {
  index: number;
  url: string;
  title: string;
  visibleText: string;
  htmlLength: number;
  action: string;
  optionsSeen: string[];
};

type Manifest = {
  slug: string;
  url: string;
  captured_at: string;
  total_screens: number;
  screens: Screen[];
};

const baseDir = path.join(
  process.cwd(),
  "research/quiz-analysis/quizzes_raw/screenshots"
);
const outDir = path.join(process.cwd(), "research/quiz-analysis");

const slugs = fs
  .readdirSync(baseDir)
  .filter((d) => fs.statSync(path.join(baseDir, d)).isDirectory());

const manifests: Manifest[] = [];

for (const slug of slugs) {
  const mp = path.join(baseDir, slug, "manifest.json");
  if (!fs.existsSync(mp)) continue;
  const m: Manifest = JSON.parse(fs.readFileSync(mp, "utf8"));
  manifests.push(m);
}

manifests.sort((a, b) => b.total_screens - a.total_screens);

// 1. DUMP POR QUIZ
let dump = `# Dump Verbatim — Texto Extraído de Cada Quiz\n\n`;
dump += `**Capturado:** ${new Date().toISOString()}\n`;
dump += `**Total de marcas:** ${manifests.length}\n`;
dump += `**Total de telas:** ${manifests.reduce((s, m) => s + m.total_screens, 0)}\n\n`;
dump += `Cada seção mostra a sequência real capturada pelo crawler. Texto **verbatim do DOM**, não summarized.\n\n---\n\n`;

for (const m of manifests) {
  dump += `## ${m.slug.toUpperCase()} (${m.total_screens} telas)\n\n`;
  dump += `- **URL inicial:** ${m.url}\n`;
  dump += `- **Capturado:** ${m.captured_at}\n\n`;

  for (const s of m.screens) {
    dump += `### Tela ${String(s.index).padStart(3, "0")} — ${s.url}\n\n`;
    const txt = (s.visibleText || "").trim();
    if (txt) {
      dump += "```\n" + txt.slice(0, 2000) + "\n```\n\n";
    } else {
      dump += "*(texto vazio)*\n\n";
    }
    if (s.action && s.action !== "PENDING") {
      dump += `**→ Action:** \`${s.action}\`\n\n`;
    }
  }
  dump += `\n---\n\n`;
}

fs.writeFileSync(path.join(outDir, "dump_por_quiz.md"), dump);
console.log(`✅ Gerado: dump_por_quiz.md (${dump.length} chars)`);

// 2. DUMP CONSOLIDADO — primeiros textos de cada quiz lado-a-lado
let cons = `# Primeira Pergunta Capturada — Comparativo entre 19 Marcas\n\n`;
cons += `Mostra a "tela 0" de cada quiz capturado, lado a lado. Útil para identificar padrões de abertura.\n\n`;
cons += `| Marca | Primeira tela (texto inicial) |\n`;
cons += `|---|---|\n`;

for (const m of manifests) {
  const first = m.screens[0];
  if (!first) {
    cons += `| **${m.slug}** | ❌ Não capturou |\n`;
    continue;
  }
  const txt = (first.visibleText || "")
    .replace(/\n+/g, " ")
    .replace(/\|/g, "\\|")
    .slice(0, 250);
  cons += `| **${m.slug}** | ${txt}... |\n`;
}

cons += `\n\n## Mapa de Telas Capturadas\n\n`;
cons += `| Marca | Telas | Status | URL final |\n|---|---|---|---|\n`;
for (const m of manifests) {
  const last = m.screens[m.screens.length - 1];
  const lastUrl = last?.url || "—";
  const status = m.total_screens >= 10 ? "✅ Bom" : m.total_screens >= 5 ? "🟡 OK" : "🔴 Pouco";
  cons += `| ${m.slug} | ${m.total_screens} | ${status} | ${lastUrl} |\n`;
}

fs.writeFileSync(path.join(outDir, "dump_consolidado.md"), cons);
console.log(`✅ Gerado: dump_consolidado.md (${cons.length} chars)`);

// 3. EXTRAÇÃO DE PERGUNTAS — para análise downstream
type Question = {
  slug: string;
  index: number;
  url: string;
  questionText: string;
  options: string[];
};

const questions: Question[] = [];

for (const m of manifests) {
  for (const s of m.screens) {
    const text = (s.visibleText || "").trim();
    if (!text) continue;

    // Heurística: pergunta é geralmente a primeira linha que termina em ? ou começa com "What/Do/Are/Have/How/Is"
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const questionLine = lines.find(
      (l) =>
        /\?$/.test(l) ||
        /^(What|Do|Are|Have|How|Is|When|Where|Why|Which|Tell us|Select|Choose)/i.test(l)
    );

    if (!questionLine) continue;

    // Heurística: opções são as linhas curtas após a pergunta
    const qIdx = lines.indexOf(questionLine);
    const opts = lines
      .slice(qIdx + 1, qIdx + 10)
      .filter(
        (l) =>
          l.length < 100 &&
          !/^(by continuing|terms|privacy|cookie|copyright|footer|©|next|continue)/i.test(l)
      );

    questions.push({
      slug: m.slug,
      index: s.index,
      url: s.url,
      questionText: questionLine,
      options: opts,
    });
  }
}

let qDump = `# Perguntas Extraídas — Heurística Automática\n\n`;
qDump += `**Total identificado:** ${questions.length}\n\n`;
qDump += `*Nota: heurística simples — pode ter falso-positivos (linhas que parecem pergunta mas são headlines de marketing).*\n\n`;

const byQuiz: Record<string, Question[]> = {};
for (const q of questions) {
  byQuiz[q.slug] = byQuiz[q.slug] || [];
  byQuiz[q.slug].push(q);
}

for (const slug of Object.keys(byQuiz).sort()) {
  qDump += `## ${slug.toUpperCase()}\n\n`;
  for (const q of byQuiz[slug]) {
    qDump += `**[${q.index}]** ${q.questionText}\n`;
    if (q.options.length > 0) {
      qDump += `  Opções: ${q.options.map((o) => `\`${o}\``).join(" / ")}\n`;
    }
    qDump += `\n`;
  }
  qDump += `\n---\n\n`;
}

fs.writeFileSync(path.join(outDir, "perguntas_extraidas.md"), qDump);
console.log(`✅ Gerado: perguntas_extraidas.md (${qDump.length} chars)`);

console.log(`\nTotal de manifests processados: ${manifests.length}`);
console.log(`Total de telas: ${manifests.reduce((s, m) => s + m.total_screens, 0)}`);
console.log(`Total de perguntas heurísticas: ${questions.length}`);
