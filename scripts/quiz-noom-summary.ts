/**
 * Gera resumo verbatim de todas as 82 telas do Noom capturadas.
 */
import * as fs from "fs";

const manifest = JSON.parse(
  fs.readFileSync(
    "research/quiz-analysis/quizzes_raw/screenshots/noom/manifest.json",
    "utf8"
  )
);

let out = `# Noom — Funil COMPLETO Capturado (${manifest.total_screens} telas)\n\n`;
out += `**Capturado em:** ${manifest.captured_at}\n\n`;
out += `Texto verbatim do DOM real. Path seguido: Male, 20s, 175cm/85kg, "None" para conditions, "No" para diabetes/eating disorder, goal 70kg, "Vacation" + skip date, "As fast as possible" pace, slider behavioral profile no extremo esquerdo.\n\n`;
out += `---\n\n`;

for (const s of manifest.screens) {
  const txt = (s.visibleText || "").trim();
  if (!txt) continue;
  out += `## Tela ${String(s.index).padStart(3, "0")} — ${s.url}\n\n`;
  out += "```\n" + txt + "\n```\n\n";
  if (s.action && s.action !== "PENDING") {
    out += `**→ Action:** \`${s.action}\`\n\n`;
  }
  out += `---\n\n`;
}

fs.writeFileSync(
  "research/quiz-analysis/quizzes_raw/noom_FULL_DUMP.md",
  out
);
console.log(`✅ noom_FULL_DUMP.md gerado: ${out.length} chars`);
console.log(`Total de telas com texto: ${manifest.screens.filter((s: any) => s.visibleText.trim()).length}`);
