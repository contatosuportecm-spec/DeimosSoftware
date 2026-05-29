/**
 * Quiz Funnel Crawler — coleta sistemática de quizzes de direct response.
 *
 * Uso:
 *   npx tsx scripts/quiz-crawler.ts <slug> <url> [--headless]
 *
 * Exemplo:
 *   npx tsx scripts/quiz-crawler.ts noom https://www.noom.com/ps/main-survey/
 *
 * O que faz:
 *  1. Abre o quiz em viewport mobile (iPhone 14)
 *  2. A cada tela: salva screenshot + HTML + texto visível
 *  3. Decide automaticamente como avançar:
 *     - Input numérico → preenche default sensato (idade 35, peso 80kg, etc.)
 *     - Botões/radio/checkbox → seleciona a PRIMEIRA opção visível
 *     - "Continue/Next/Submit" → clica
 *     - Email gate → preenche desenvolvimento+quiz@institutopanapana.org.br
 *  4. Para após N telas idênticas (loop) ou após 200 telas (safety)
 *  5. Gera manifest.json com sequência completa
 *
 * Output em: research/quiz-analysis/quizzes_raw/screenshots/<slug>/
 */

import { chromium, type Page, type Browser } from "playwright";
import * as fs from "fs";
import * as path from "path";

const SAFETY_MAX_SCREENS = 200;
const REPEAT_LIMIT = 4; // se mesma tela aparece 4x seguidas, sai
const ACTION_TIMEOUT = 15_000;
const NETWORK_IDLE_TIMEOUT = 8_000;
const ANIMATION_WAIT = 1_500;

// Defaults para preencher inputs
const DEFAULTS = {
  age: "35",
  weight_kg: "85",
  weight_lb: "187",
  height_cm: "175",
  height_ft: "5",
  height_in: "9",
  goal_weight_kg: "70",
  goal_weight_lb: "154",
  email: "pesquisa+quiz@institutopanapana.org.br",
  name: "Pesquisa",
  zip: "10001",
  phone: "5551234567",
  generic_number: "5",
};

type Screen = {
  index: number;
  url: string;
  title: string;
  visibleText: string;
  htmlLength: number;
  action: string;
  optionsSeen: string[];
};

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Uso: npx tsx scripts/quiz-crawler.ts <slug> <url> [--headless]");
    process.exit(1);
  }
  const slug = args[0];
  const url = args[1];
  const headless = args.includes("--headless");

  const outDir = path.join(
    process.cwd(),
    "research/quiz-analysis/quizzes_raw/screenshots",
    slug
  );
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n[${slug}] Iniciando crawl: ${url}`);
  console.log(`[${slug}] Output: ${outDir}\n`);

  const browser: Browser = await chromium.launch({ headless });
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
  page.setDefaultTimeout(ACTION_TIMEOUT);

  const screens: Screen[] = [];
  let lastText = "";
  let repeatCount = 0;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await waitForStable(page);

    for (let i = 0; i < SAFETY_MAX_SCREENS; i++) {
      const screen = await captureScreen(page, i, outDir);
      screens.push(screen);

      console.log(
        `[${slug}] Tela ${String(i).padStart(3, "0")} — ${screen.title.slice(0, 60)}`
      );
      console.log(
        `         Texto: ${screen.visibleText.slice(0, 120).replace(/\s+/g, " ")}...`
      );

      // Detecta loop
      const currentText = screen.visibleText.slice(0, 500);
      if (currentText === lastText) {
        repeatCount++;
        if (repeatCount >= REPEAT_LIMIT) {
          console.log(`\n[${slug}] LOOP detectado (mesma tela ${REPEAT_LIMIT}x). Parando.`);
          break;
        }
      } else {
        repeatCount = 0;
        lastText = currentText;
      }

      // Tenta avançar
      const action = await tryAdvance(page, screen.visibleText);
      screen.action = action;
      console.log(`         Action: ${action}\n`);

      if (action === "DEAD_END") {
        console.log(`[${slug}] DEAD END (sem ação possível). Parando.`);
        break;
      }

      // Detecta interstitial/upsell (página com poucas opções, fora do path principal)
      // → espera mais tempo (Noom-vibe abre drawer lazy)
      const isInterstitial = /noom-vibe|interstitial|upsell|app-promo/i.test(
        screen.url
      ) || /^learn more$/i.test(action.match(/"([^"]+)"/)?.[1] || "");
      await waitForStable(page, isInterstitial ? 4000 : 0);
    }
  } catch (e: any) {
    console.error(`[${slug}] ERRO: ${e.message}`);
  } finally {
    // Salva manifest
    const manifestPath = path.join(outDir, "manifest.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          slug,
          url,
          captured_at: new Date().toISOString(),
          total_screens: screens.length,
          screens,
        },
        null,
        2
      )
    );
    console.log(`\n[${slug}] Manifest: ${manifestPath}`);
    console.log(`[${slug}] Total de telas capturadas: ${screens.length}`);

    await browser.close();
  }
}

async function waitForStable(page: Page, extraWait = 0) {
  try {
    await page.waitForLoadState("networkidle", { timeout: NETWORK_IDLE_TIMEOUT });
  } catch {
    // ok, alguns sites têm long-polling; segue
  }
  // Payment/checkout pages → wait extra pro JS renderizar
  const url = page.url();
  if (/payment|checkout|paywall|results|trial|offer/i.test(url)) {
    extraWait = Math.max(extraWait, 5000);
  }
  await page.waitForTimeout(ANIMATION_WAIT + extraWait);
}

async function captureScreen(
  page: Page,
  index: number,
  outDir: string
): Promise<Screen> {
  const padded = String(index).padStart(3, "0");

  const url = page.url();
  const title = await page.title().catch(() => "");
  const html = await page.content();
  const visibleText = await page
    .evaluate(() => (document.body?.innerText || "").trim())
    .catch(() => "");

  // Lista opções visíveis (buttons + radio labels + clickable divs com role=button)
  const optionsSeen = await page
    .evaluate(() => {
      const isVisible = (el: Element) => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
      };
      const seen = new Set<string>();
      document
        .querySelectorAll(
          'button, [role="button"], label, [role="radio"], [role="checkbox"], a[href], [data-cy*="select"]'
        )
        .forEach((el) => {
          if (!isVisible(el)) return;
          const txt = (
            (el as HTMLElement).innerText ||
            el.textContent ||
            ""
          ).trim();
          if (txt && txt.length < 200) seen.add(txt);
        });
      return Array.from(seen).slice(0, 30);
    })
    .catch(() => []);

  fs.writeFileSync(path.join(outDir, `screen_${padded}.html`), html);
  fs.writeFileSync(path.join(outDir, `screen_${padded}.txt`), visibleText);
  try {
    // Detecta interstitial / upsell → screenshot fullPage + scroll antes
    const isInterstitial = /noom-vibe|interstitial|upsell|app-promo/i.test(url);
    if (isInterstitial) {
      await page.evaluate(
        `window.scrollTo(0, document.body.scrollHeight)` as any
      );
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(outDir, `screen_${padded}_full.png`),
        fullPage: true,
      });
      await page.evaluate(`window.scrollTo(0, 0)` as any);
      await page.waitForTimeout(300);
    }
    await page.screenshot({
      path: path.join(outDir, `screen_${padded}.png`),
      fullPage: false,
    });
  } catch (e: any) {
    console.log(`         (screenshot falhou: ${e.message})`);
  }

  return {
    index,
    url,
    title,
    visibleText,
    htmlLength: html.length,
    action: "PENDING",
    optionsSeen,
  };
}

const CTA_PATTERNS = [
  /^continue$/i,
  /^next$/i,
  /^submit$/i,
  /^get started$/i,
  /^get my plan/i,
  /^see my result/i,
  /^show me my plan/i,
  /^reveal/i,
  /^start$/i,
  /^begin$/i,
  /^ok$/i,
  /^proceed$/i,
  /^go$/i,
  /^take the quiz/i,
  /^start the quiz/i,
  /^start (my )?(free )?quiz/i,
  /^let'?s go/i,
  /^let'?s start/i,
];

// Cookie consent banners — clicar nessas tem prioridade ALTA
const COOKIE_ACCEPT_PATTERNS = [
  /^accept all/i,
  /^accept (cookies?|& close)/i,
  /^allow all/i,
  /^agree( & continue)?$/i,
  /^i accept$/i,
  /^ok, got it$/i,
  /^got it$/i,
  /^consent$/i,
];

const SKIP_PATTERNS = [
  /sign in/i,
  /^login/i,
  /^log in/i,
  /^close$/i,
  /^cancel$/i,
  /^exit$/i,
  /^back$/i,
  /^previous$/i,
  /^prev$/i,
  /^×$/,
  /^✕$/,
  /reject all/i,
  /decline/i,
  /manage (cookies|preferences)/i,
  /customize/i,
  /save (and )?customize/i,
];

// Links de menu/navegação que NÃO são parte do quiz
const NAV_MENU_PATTERNS = [
  /^how it works$/i,
  /^pricing$/i,
  /^medication$/i,
  /^medications$/i,
  /^program$/i,
  /^results$/i,
  /^faqs?$/i,
  /^for business$/i,
  /^blog$/i,
  /^about( us)?$/i,
  /^careers$/i,
  /^contact( us)?$/i,
  /^reviews$/i,
  /^patient login$/i,
  /^help center$/i,
  /^download the app$/i,
  /^cancel membership$/i,
  /^supported diets$/i,
  /^for professionals$/i,
  /^sign up$/i,
  /^docs$/i,
  /^subscription policy$/i,
  /^money-back policy$/i,
  /^privacy policy$/i,
  /^terms( of (use|service))?$/i,
  /^cookie policy$/i,
  /^app & program faqs$/i,
];

function isCTA(txt: string) {
  return CTA_PATTERNS.some((re) => re.test(txt.trim()));
}
function isSkip(txt: string) {
  return SKIP_PATTERNS.some((re) => re.test(txt.trim()));
}
function isCookieAccept(txt: string) {
  return COOKIE_ACCEPT_PATTERNS.some((re) => re.test(txt.trim()));
}
function isNavMenu(txt: string) {
  return NAV_MENU_PATTERNS.some((re) => re.test(txt.trim()));
}

// Tópicos sensíveis que disparam waivers/modais — escolher "No" / "Prefer not to say"
const SENSITIVE_KEYWORDS =
  /eating disorder|bulimia|anorexia|self.?harm|suicid|pregnan|breastfeed|nursing|under 18|minor|cancer|chemo|kidney/i;

// Perguntas de multi-select sobre condições/saúde — escolher "None" pra evitar branch alternativo
const MULTISELECT_HEALTH_KEYWORDS =
  /following conditions|diagnosed with|chronic|medical condition|any of the following.*(condition|health|disease|symptom)/i;

function pickOption(options: { txt: string }[], questionText: string): number {
  if (SENSITIVE_KEYWORDS.test(questionText)) {
    // Prefere "No" / "Prefer not to say" / "None"
    const safeIdx = options.findIndex((o) =>
      /^(no|none|prefer not|i'?m not sure|not sure|n\/a)$/i.test(o.txt.trim())
    );
    if (safeIdx >= 0) return safeIdx;
  }

  if (MULTISELECT_HEALTH_KEYWORDS.test(questionText)) {
    // Em conditions/diagnosed questions, prefere "None" / "No" / "Never"
    // — selecionar uma condição pode levar a branch alternativo (upsell)
    const safeIdx = options.findIndex((o) =>
      /^(none|none of (the )?(above|these)|nothing|no health (conditions?|issues?)|no|never)$/i.test(
        o.txt.trim()
      )
    );
    if (safeIdx >= 0) return safeIdx;
  }

  return 0;
}

/**
 * Lógica de avanço:
 *  1. Preenche todos os inputs visíveis
 *  2. Identifica opções (botões/cards) e separa de CTAs (Continue/Next/Submit)
 *  3. Se há opções não-selecionadas → clica a PRIMEIRA opção
 *  4. Aguarda 500ms (animação/state update)
 *  5. Procura CTA visível → clica
 *  6. Senão considera que a opção já avançou
 */
async function tryAdvance(page: Page, visibleText: string): Promise<string> {
  const actions: string[] = [];

  // 1. Email
  const emailFilled = await fillIfPresent(
    page,
    'input[type="email"], input[name*="email" i], input[placeholder*="email" i]',
    DEFAULTS.email
  );
  if (emailFilled) actions.push("FILLED_EMAIL");

  // 2. Inputs numéricos vazios
  // Usa o texto da PÁGINA pra determinar contexto (mais confiável que placeholder)
  const pageContext = visibleText.toLowerCase();
  const isHeightPage = /\bheight\b|\btall\b/.test(pageContext);
  const isCurrentWeightPage = /current weight|how much do you weigh|your weight\b(?!.*goal)/.test(
    pageContext
  );
  const isGoalWeightPage =
    /ideal weight|target weight|weight goal|goal weight|what is your.*goal/.test(
      pageContext
    );
  const isAgePage = /\bage\b|how old/.test(pageContext);

  const numericInputs = await page
    .locator(
      'input[type="number"]:visible, input[type="tel"]:visible, input[inputmode="numeric"]:visible, input[inputmode="decimal"]:visible'
    )
    .all();
  for (const inp of numericInputs) {
    const value = await inp.inputValue().catch(() => "");
    if (value) continue;
    const placeholder = (
      (await inp.getAttribute("placeholder")) || ""
    ).toLowerCase();
    const name = ((await inp.getAttribute("name")) || "").toLowerCase();
    const ariaLabel = (
      (await inp.getAttribute("aria-label")) || ""
    ).toLowerCase();
    const ctx = `${placeholder} ${name} ${ariaLabel}`;

    // Detecta unidade do INPUT específico
    const isLb = /lb|pound/.test(ctx);
    const isFt = /ft|feet/.test(ctx);
    const isIn = /inch|^in$/.test(ctx);
    const isCm = /cm/.test(ctx);
    const isKg = /kg/.test(ctx);

    let val = DEFAULTS.generic_number;

    // PRIORIDADE 1: input attributes específicos
    if (isFt) val = DEFAULTS.height_ft;
    else if (isIn) val = DEFAULTS.height_in;
    // PRIORIDADE 2: page context combinado com unit
    else if (isHeightPage && isCm) val = DEFAULTS.height_cm;
    else if (isHeightPage) val = DEFAULTS.height_cm;
    else if (isGoalWeightPage && isLb) val = DEFAULTS.goal_weight_lb;
    else if (isGoalWeightPage) val = DEFAULTS.goal_weight_kg;
    else if (isCurrentWeightPage && isLb) val = DEFAULTS.weight_lb;
    else if (isCurrentWeightPage) val = DEFAULTS.weight_kg;
    else if (isAgePage) val = DEFAULTS.age;
    // PRIORIDADE 3: fallback por placeholder
    else if (/age/.test(ctx)) val = DEFAULTS.age;
    else if (isLb && /weight/.test(ctx)) val = DEFAULTS.weight_lb;
    else if (/weight/.test(ctx)) val = DEFAULTS.weight_kg;
    else if (isCm) val = DEFAULTS.height_cm;
    else if (/goal/.test(ctx)) val = DEFAULTS.goal_weight_kg;
    else if (/zip|postal/.test(ctx)) val = DEFAULTS.zip;
    else if (/phone|tel/.test(ctx)) val = DEFAULTS.phone;

    await inp.fill(val).catch(() => {});
    actions.push(`FILLED_${val}`);
  }

  // 2.5 Selects HTML nativos
  const selects = await page.locator("select:visible").all();
  for (const sel of selects) {
    const value = await sel.inputValue().catch(() => "");
    if (value && value !== "" && value !== "Choose one") continue;
    // Pega todas as options não-vazias
    const opts = await sel.locator("option").all();
    for (const opt of opts) {
      const v = (await opt.getAttribute("value")) || "";
      const t = (await opt.innerText().catch(() => "")).trim();
      if (v && v !== "" && !/choose|select/i.test(t)) {
        await sel.selectOption(v).catch(() => {});
        actions.push(`SELECT_DROPDOWN: "${t.slice(0, 40)}"`);
        break;
      }
    }
  }

  // 3. Text inputs vazios (não-email)
  const textInputs = await page.locator('input[type="text"]:visible').all();
  for (const inp of textInputs) {
    const value = await inp.inputValue().catch(() => "");
    if (value) continue;
    const ctx = (
      ((await inp.getAttribute("placeholder")) || "") +
      " " +
      ((await inp.getAttribute("name")) || "")
    ).toLowerCase();
    if (/name/.test(ctx)) {
      await inp.fill(DEFAULTS.name).catch(() => {});
      actions.push("FILLED_NAME");
    } else if (/zip|postal/.test(ctx)) {
      await inp.fill(DEFAULTS.zip).catch(() => {});
      actions.push("FILLED_ZIP");
    }
  }

  // 4. Identifica opções (botões/cards/labels clicáveis)
  // Inclui: button, [role=button], label envolvendo input[radio|checkbox],
  //        [data-cy*=select], divs com onclick
  // EXCLUI: back-button, close, modal-close
  const clickables = await page
    .locator(
      'button:visible, [role="button"]:visible, label:visible, [role="radio"]:visible, [role="checkbox"]:visible, [data-cy*="select"]:visible'
    )
    .filter({
      hasNot: page.locator(
        '[data-cy*="back"], [data-cy*="close"], [aria-label*="back" i], [aria-label*="close" i], [aria-label*="menu" i]'
      ),
    })
    .all();

  // Classifica em CTAs vs Options
  const ctas: { el: typeof clickables[0]; txt: string }[] = [];
  const options: { el: typeof clickables[0]; txt: string }[] = [];

  for (const el of clickables) {
    const txt = (await el.innerText().catch(() => "")).trim();
    if (!txt || txt.length > 200) continue;
    if (isSkip(txt)) continue;

    if (isCTA(txt)) {
      ctas.push({ el, txt });
    } else {
      options.push({ el, txt });
    }
  }

  // Antes das opções: detecta date picker / "Select a date" / "Skip" pattern
  // Esses funis pedem data e oferecem "Skip" como alternativa segura
  if (/select a date|when (is|will)|pick a date|choose.*date/i.test(visibleText)) {
    const skipBtn = page.locator('[data-cy="skip-button"]:visible, button:has-text("Skip"):visible').first();
    if ((await skipBtn.count()) > 0 && (await skipBtn.isVisible().catch(() => false))) {
      const t = (await skipBtn.innerText().catch(() => "Skip")).trim();
      await skipBtn.click({ timeout: 3000 }).catch(() => {});
      actions.push(`CLICKED_SKIP: "${t}"`);
      return actions.join(" + ");
    }
  }

  // Detecta slider (behavioral profile do Noom etc.) — mover para um extremo via keyboard
  const slider = page.locator('[role="slider"]:visible').first();
  if ((await slider.count()) > 0) {
    await slider.focus().catch(() => {});
    // Pressiona ArrowLeft 10x pra ir ao extremo "Agree most" do lado esquerdo
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    actions.push("SLIDER_MOVED_LEFT");

    // Tenta clicar Continue/Next agora (que deve estar habilitado)
    const cta = page
      .locator(
        'button[data-cy="survey-next"]:visible:not([disabled]), button:has-text("Continue"):visible:not([disabled]), button:has-text("Next"):visible:not([disabled])'
      )
      .first();
    if ((await cta.count()) > 0) {
      const t = (await cta.innerText().catch(() => "")).trim();
      await cta.click({ timeout: 3000 }).catch(() => {});
      actions.push(`CLICKED_CTA: "${t}"`);
      return actions.join(" + ");
    }
  }

  // Se há opções → escolhe opção segura (default: primeira), depois CTA (se houver)
  if (options.length > 0) {
    const pickIdx = pickOption(options, visibleText);
    const picked = options[pickIdx];
    await picked.el.click({ timeout: 3000 }).catch(() => {});
    actions.push(`SELECTED[${pickIdx}]: "${picked.txt.slice(0, 50)}"`);
    await page.waitForTimeout(500);

    // Refetch CTAs (DOM pode ter mudado)
    if (ctas.length > 0) {
      // tenta clicar o primeiro CTA que ainda existe
      for (const cta of ctas) {
        try {
          if (await cta.el.isVisible({ timeout: 500 })) {
            await cta.el.click({ timeout: 3000 });
            actions.push(`CLICKED_CTA: "${cta.txt}"`);
            return actions.join(" + ");
          }
        } catch {}
      }
    }
    return actions.join(" + ");
  }

  // Sem opções, só CTAs
  if (ctas.length > 0) {
    await ctas[0].el.click({ timeout: 3000 }).catch(() => {});
    actions.push(`CLICKED_CTA_ONLY: "${ctas[0].txt}"`);
    return actions.join(" + ");
  }

  // Fallback: clica em qualquer link
  const links = await page.locator('a[href]:visible').all();
  for (const lnk of links) {
    const txt = (await lnk.innerText().catch(() => "")).trim();
    if (!txt || txt.length > 60) continue;
    if (isSkip(txt)) continue;
    await lnk.click({ timeout: 3000 }).catch(() => {});
    actions.push(`CLICKED_LINK: "${txt}"`);
    return actions.join(" + ");
  }

  // Detecta loading/splash screen — aguarda navegação por até 30s antes de declarar dead-end
  // Inclui também URLs de payment results onde splash screens são comuns
  const currentUrl = page.url();
  const isLoadingOrSplash =
    /preparing|loading|calculating|analyzing|building (your|plan)|building plan|personalizing|computing|generating|creating your|welcome to|let'?s get started|\d+%/i.test(
      visibleText
    ) || /payment\/results|welcome|splash|intro/i.test(currentUrl);
  if (isLoadingOrSplash) {
    const startUrl = page.url();
    actions.push("LOADING_DETECTED");
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      const newUrl = page.url();
      if (newUrl !== startUrl) {
        actions.push(`URL_CHANGED_AFTER_${i + 1}s`);
        return actions.join(" + ");
      }
      // Detecta novo conteúdo na mesma URL (splash → real content)
      const newText = await page
        .evaluate(`document.body.innerText`)
        .catch(() => "");
      if (
        typeof newText === "string" &&
        newText.length > visibleText.length + 200
      ) {
        actions.push(`CONTENT_LOADED_AFTER_${i + 1}s`);
        return actions.join(" + ");
      }
    }
    actions.push("LOADING_TIMEOUT_30s");
  }

  return actions.length > 0 ? actions.join(" + ") + " (no advance)" : "DEAD_END";
}

async function fillIfPresent(
  page: Page,
  selector: string,
  value: string
): Promise<boolean> {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0) return false;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) return false;
  await el.fill(value).catch(() => {});
  return true;
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
