/**
 * Quiz Batch Runner — roda quiz-crawler em todos os 19 funis em sequência.
 *
 * Uso:
 *   npx tsx scripts/quiz-batch.ts
 *
 * Output em research/quiz-analysis/quizzes_raw/screenshots/<slug>/
 * Resumo final em research/quiz-analysis/quizzes_raw/batch_summary.json
 */

import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const QUIZZES = [
  { slug: "noom", url: "https://www.noom.com/ps/main-survey/" },
  { slug: "betterme", url: "https://quiz.betterme.world/" },
  { slug: "lasta", url: "https://lasta.app/quiz/en/281" },
  { slug: "simple", url: "https://simple.life/survey/" },
  { slug: "weightwatchers", url: "https://www.weightwatchers.com/us/personalassessment/" },
  { slug: "found", url: "https://joinfound.com/" },
  { slug: "dofasting", url: "https://dofasting.com/" },
  { slug: "klinio", url: "https://funnel.klinio.com/quiz" },
  { slug: "unimeal", url: "https://unimeal.com/quiz/step-gender" },
  { slug: "calibrate", url: "https://www.joincalibrate.com/" },
  { slug: "ro-body", url: "https://ro.co/weight-loss/" },
  { slug: "muscle-booster", url: "https://start.muscle-booster.io/" },
  { slug: "reverse-health", url: "https://reverse.health/" },
  { slug: "hers-weight-loss", url: "https://www.forhers.com/tools/why-cant-i-lose-weight" },
  { slug: "form-health", url: "https://www.formhealth.co/start-quiz" },
  { slug: "nutrisystem", url: "https://www.nutrisystem.com/r/my-plan-quiz" },
  { slug: "platejoy", url: "https://www.platejoy.com/" },
  { slug: "eat-this-much", url: "https://www.eatthismuch.com/" },
  { slug: "lifesum", url: "https://lifesum.com/plan-quiz/" },
];

const TIMEOUT_PER_QUIZ_MS = 5 * 60_000; // 5 min cap

type Result = {
  slug: string;
  url: string;
  screens: number;
  exitCode: number;
  durationMs: number;
  status: "ok" | "timeout" | "error" | "no-output";
  firstQuestion?: string;
  lastUrl?: string;
};

async function runOne(slug: string, url: string): Promise<Result> {
  console.log(`\n${"=".repeat(70)}\n▶ ${slug.toUpperCase()} — ${url}\n${"=".repeat(70)}`);
  const start = Date.now();

  return new Promise((resolve) => {
    const proc = spawn(
      "npx",
      ["tsx", "scripts/quiz-crawler.ts", slug, url, "--headless"],
      { stdio: "inherit" }
    );

    let killed = false;
    const timeout = setTimeout(() => {
      killed = true;
      proc.kill("SIGTERM");
      console.error(`⏱️  TIMEOUT ${slug} after ${TIMEOUT_PER_QUIZ_MS / 1000}s`);
    }, TIMEOUT_PER_QUIZ_MS);

    proc.on("exit", (code) => {
      clearTimeout(timeout);
      const durationMs = Date.now() - start;
      const result = inspectOutput(slug, url, code ?? -1, durationMs, killed);
      console.log(
        `✅ ${slug}: ${result.screens} telas em ${(durationMs / 1000).toFixed(0)}s (${result.status})`
      );
      resolve(result);
    });
  });
}

function inspectOutput(
  slug: string,
  url: string,
  exitCode: number,
  durationMs: number,
  timedOut: boolean
): Result {
  const dir = path.join(
    process.cwd(),
    "research/quiz-analysis/quizzes_raw/screenshots",
    slug
  );
  const manifestPath = path.join(dir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    return {
      slug,
      url,
      screens: 0,
      exitCode,
      durationMs,
      status: "no-output",
    };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const screens = manifest.total_screens || 0;
  const firstScreen = (manifest.screens || [])[0];
  const lastScreen = (manifest.screens || [])[screens - 1];

  return {
    slug,
    url,
    screens,
    exitCode,
    durationMs,
    status: timedOut ? "timeout" : screens > 0 ? "ok" : "error",
    firstQuestion: firstScreen?.visibleText?.slice(0, 200),
    lastUrl: lastScreen?.url,
  };
}

async function main() {
  const start = Date.now();
  const results: Result[] = [];

  for (const { slug, url } of QUIZZES) {
    try {
      const r = await runOne(slug, url);
      results.push(r);
    } catch (e: any) {
      console.error(`❌ ${slug}: ${e.message}`);
      results.push({
        slug,
        url,
        screens: 0,
        exitCode: -1,
        durationMs: 0,
        status: "error",
      });
    }
  }

  const summary = {
    started_at: new Date(start).toISOString(),
    finished_at: new Date().toISOString(),
    total_duration_seconds: Math.round((Date.now() - start) / 1000),
    total_quizzes: QUIZZES.length,
    successful: results.filter((r) => r.status === "ok").length,
    total_screens_captured: results.reduce((sum, r) => sum + r.screens, 0),
    by_quiz: results,
  };

  const summaryPath = path.join(
    process.cwd(),
    "research/quiz-analysis/quizzes_raw/batch_summary.json"
  );
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`\n${"=".repeat(70)}`);
  console.log(`BATCH COMPLETO`);
  console.log(`Duração: ${summary.total_duration_seconds}s`);
  console.log(`Quizzes OK: ${summary.successful}/${QUIZZES.length}`);
  console.log(`Telas totais capturadas: ${summary.total_screens_captured}`);
  console.log(`Resumo: ${summaryPath}`);
  console.log(`${"=".repeat(70)}\n`);

  for (const r of results) {
    const status =
      r.status === "ok" ? "✅" : r.status === "timeout" ? "⏱️" : "❌";
    console.log(`${status} ${r.slug.padEnd(20)} ${String(r.screens).padStart(3)} telas`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
