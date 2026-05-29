/**
 * Debug — testa se "Learn more" abre nova aba, tap, ou tenta URLs diretas do funil.
 */

import { chromium } from "playwright";
import * as fs from "fs";

const GET_BODY_TEXT = `document.body.innerText`;

async function navigateToNoomVibe(page: any) {
  await page.goto("https://www.noom.com/ps/main-survey/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(2000);

  // Helpers
  async function clickFirstSelectAndContinue(needsCta = false) {
    const opts = await page.locator('button[data-cy="single-select"]:visible').all();
    if (opts.length > 0) {
      await opts[0].click().catch(() => {});
      await page.waitForTimeout(500);
    }
    if (needsCta) {
      const cta = page.locator('button[data-cy="survey-next"]').first();
      if ((await cta.count()) > 0) await cta.click().catch(() => {});
    }
  }
  async function fillAndContinue(val = "50") {
    const inps = await page.locator("input:visible").all();
    for (const i of inps) {
      const t = await i.getAttribute("type");
      if (t === "email") continue;
      const v = await i.inputValue().catch(() => "");
      if (!v) await i.fill(val).catch(() => {});
    }
    const cta = page.locator('button[data-cy="survey-next"]').first();
    if ((await cta.count()) > 0) await cta.click().catch(() => {});
  }
  async function nextOnly() {
    const cta = page
      .locator('button[data-cy="survey-next"], button:has-text("Continue")')
      .first();
    if ((await cta.count()) > 0) await cta.click().catch(() => {});
  }
  async function clickCheckboxAndNext(label: string) {
    // Checkbox por label de texto
    const lbl = page.locator(`label:has-text("${label}")`).first();
    if ((await lbl.count()) > 0) {
      await lbl.click().catch(() => {});
      await page.waitForTimeout(400);
    }
    await nextOnly();
  }

  console.log("Caminhando até /noom-vibe...");

  // Tela 0: weight loss goal
  await clickFirstSelectAndContinue();
  await page.waitForTimeout(1500);
  // Tela 1: sex (Male)
  await clickFirstSelectAndContinue();
  await page.waitForTimeout(1500);
  // Tela 2: gender (Man) + Next
  await clickFirstSelectAndContinue(true);
  await page.waitForTimeout(1500);
  // Tela 3: age (20s)
  await clickFirstSelectAndContinue();
  await page.waitForTimeout(1500);
  // Tela 4: height (input + Next)
  await fillAndContinue("175");
  await page.waitForTimeout(1500);
  // Tela 5: weight (input + Next)
  await fillAndContinue("85");
  await page.waitForTimeout(1500);
  // Tela 6: conditions (multi-select with checkbox labels) — clica "None" e Next
  await clickCheckboxAndNext("None");
  await page.waitForTimeout(1500);
  // Tela 7: confirmation (Next only)
  await nextOnly();
  await page.waitForTimeout(1500);
  // Tela 8: diabetes (No)
  const noBtn = page.locator('button[value="no"]:visible').first();
  if ((await noBtn.count()) > 0) await noBtn.click().catch(() => {});
  await page.waitForTimeout(1500);
  // Tela 10: eating disorder (No)
  const noBtn2 = page.locator('button[value="no"]:visible').first();
  if ((await noBtn2.count()) > 0) await noBtn2.click().catch(() => {});
  await page.waitForTimeout(1500);
  // Tela 11: trusted hands (Continue)
  await nextOnly();
  await page.waitForTimeout(1500);
  // Tela 12: ideal weight (input + Continue)
  await fillAndContinue("70");
  await page.waitForTimeout(3000);

  console.log("URL final:", page.url());
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // === TEST 1: Detectar nova aba ao clicar Learn more ===
  console.log("\n========================================");
  console.log("TEST 1: Detectar nova aba/popup ao clicar Learn more");
  console.log("========================================\n");
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      locale: "en-US",
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    let popupOpened = false;
    let popupUrl = "";
    context.on("page", async (newPage) => {
      popupOpened = true;
      popupUrl = newPage.url();
      console.log("🆕 Nova aba detectada! URL:", popupUrl);
    });

    await navigateToNoomVibe(page);

    if (page.url().includes("/noom-vibe")) {
      console.log("Clicando 'Learn more' e aguardando popup...");
      const lm = page.locator('button:has-text("Learn more")').first();
      if ((await lm.count()) > 0) {
        try {
          await Promise.race([
            context.waitForEvent("page", { timeout: 10000 }),
            lm.click().then(() => page.waitForTimeout(8000)),
          ]);
        } catch (e: any) {
          console.log("Sem popup:", e.message);
        }
      }
      console.log("Popup aberto?", popupOpened, popupUrl);
      console.log("URL principal:", page.url());
    } else {
      console.log("⚠️ Não chegou em /noom-vibe");
    }
    await context.close();
  }

  // === TEST 2: Tap (touch) em vez de click ===
  console.log("\n========================================");
  console.log("TEST 2: Tap (touch) em vez de click");
  console.log("========================================\n");
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      locale: "en-US",
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    await navigateToNoomVibe(page);

    if (page.url().includes("/noom-vibe")) {
      const lm = page.locator('button:has-text("Learn more")').first();
      if ((await lm.count()) > 0) {
        console.log("Fazendo TAP em Learn more...");
        await lm.tap().catch((e) => console.log("tap erro:", e.message));
        await page.waitForTimeout(5000);
        console.log("URL após tap:", page.url());
        console.log("Texto:", ((await page.evaluate(GET_BODY_TEXT)) as string).slice(0, 300));
      }
    }
    await context.close();
  }

  // === TEST 3: Tentar URLs diretas DEPOIS de /idealWeight ===
  console.log("\n========================================");
  console.log("TEST 3: URLs diretas pós-idealWeight");
  console.log("========================================\n");
  const candidateUrls = [
    "https://www.noom.com/survey/focusArea",
    "https://www.noom.com/survey/event",
    "https://www.noom.com/survey/pace",
    "https://www.noom.com/survey/behavioralProfile",
    "https://www.noom.com/survey/email",
    "https://www.noom.com/survey/results",
    "https://www.noom.com/survey/checkout",
    "https://www.noom.com/survey/paywall",
    "https://www.noom.com/survey/intro",
    "https://www.noom.com/survey/mindfulness",
    "https://www.noom.com/survey/foodKnowledge",
  ];
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      locale: "en-US",
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    // Primeiro faz o funil até /noom-vibe pra estabelecer sessão
    await navigateToNoomVibe(page);

    for (const u of candidateUrls) {
      try {
        await page.goto(u, { waitUntil: "domcontentloaded", timeout: 10000 });
        await page.waitForTimeout(2000);
        const txt = ((await page.evaluate(GET_BODY_TEXT)) as string).slice(0, 200);
        const final = page.url();
        const ok = !txt.includes("Whoops") && !txt.includes("couldn't find");
        console.log(
          `${ok ? "✅" : "❌"} ${u}\n   → ${final}\n   "${txt.replace(/\n+/g, " ")}"`
        );
        if (ok && final !== u) {
          console.log(`   (redirected)`);
        }
      } catch (e: any) {
        console.log(`❌ ${u}: ${e.message}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log("\n✅ Done");
}

main().catch(function (e) {
  console.error("Fatal:", e);
  process.exit(1);
});
