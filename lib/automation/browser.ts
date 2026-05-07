import { chromium, Browser, BrowserContext, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

const COOKIES_DIR = path.join(process.cwd(), ".automation");
const SCREENSHOTS_DIR = path.join(COOKIES_DIR, "screenshots");

// Garante que diretórios existam
function ensureDirs() {
  if (!fs.existsSync(COOKIES_DIR)) fs.mkdirSync(COOKIES_DIR, { recursive: true });
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

export async function launchBrowser(headless = true): Promise<{ browser: Browser; context: BrowserContext }> {
  ensureDirs();

  const browser = await chromium.launch({
    headless,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  return { browser, context };
}

export function getCookiesPath(platform: string): string {
  ensureDirs();
  return path.join(COOKIES_DIR, `${platform}_cookies.json`);
}

export async function loadCookies(context: BrowserContext, platform: string): Promise<boolean> {
  const cookiesPath = getCookiesPath(platform);
  if (!fs.existsSync(cookiesPath)) return false;

  try {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, "utf-8"));
    await context.addCookies(cookies);
    return true;
  } catch {
    return false;
  }
}

export async function saveCookies(context: BrowserContext, platform: string): Promise<void> {
  const cookiesPath = getCookiesPath(platform);
  const cookies = await context.cookies();
  fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
}

export async function screenshot(page: Page, step: string): Promise<string> {
  ensureDirs();
  const filename = `${Date.now()}_${step.replace(/\s+/g, "_")}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  return filepath;
}

export interface AutomationLogEntry {
  step: string;
  timestamp: string;
  status: "ok" | "error";
  detail?: string;
  screenshot?: string;
}

export function logStep(
  log: AutomationLogEntry[],
  step: string,
  status: "ok" | "error",
  detail?: string,
  screenshotPath?: string
): void {
  log.push({
    step,
    timestamp: new Date().toISOString(),
    status,
    detail,
    screenshot: screenshotPath,
  });
}
