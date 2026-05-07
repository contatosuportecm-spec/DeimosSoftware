import { chromium, Browser } from "playwright";

/**
 * Scraper Playwright para a Meta Ads Library.
 * Abre a página pública da biblioteca de anúncios e extrai o total de ads ativos.
 * Não depende da API REST (que só retorna ads políticos).
 */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Constrói a URL da Ad Library para uma página específica.
 */
function buildLibraryUrl(pageId: string, countryCode: string): string {
  return (
    `https://www.facebook.com/ads/library/` +
    `?active_status=active` +
    `&ad_type=all` +
    `&country=${countryCode}` +
    `&view_all_page_id=${pageId}` +
    `&search_type=page` +
    `&media_type=all`
  );
}

/**
 * Extrai o número de anúncios ativos do texto da página.
 * A Ad Library mostra textos como:
 *  - "X results"  /  "X resultados"
 *  - "Showing X ads"
 *  - "About X ads use this creative"
 *  - Ou apenas o número nos cards renderizados
 */
function extractCountFromText(text: string): number | null {
  // Normaliza espaços e pontuação
  const clean = text.replace(/\s+/g, " ").replace(/\u00a0/g, " ");

  // Padrão 1: "X results" / "X resultados"  (PT/EN)
  const resultMatch = clean.match(
    /(\d[\d.,]*)\s*(?:results?|resultados?)/i
  );
  if (resultMatch) return parseFormattedNumber(resultMatch[1]);

  // Padrão 2: "Mostrando X anúncios" / "Showing X ads"
  const showingMatch = clean.match(
    /(?:mostrando|showing|exibindo)\s+(\d[\d.,]*)\s*(?:anúncios?|ads?)/i
  );
  if (showingMatch) return parseFormattedNumber(showingMatch[1]);

  // Padrão 3: "About X ads" / "Cerca de X anúncios"
  const aboutMatch = clean.match(
    /(?:about|cerca de)\s+(\d[\d.,]*)\s*(?:ads?|anúncios?)/i
  );
  if (aboutMatch) return parseFormattedNumber(aboutMatch[1]);

  // Padrão 4: "X ads use" / "X anúncios usam"
  const adsUseMatch = clean.match(
    /(\d[\d.,]*)\s*(?:ads?\s+use|anúncios?\s+usam)/i
  );
  if (adsUseMatch) return parseFormattedNumber(adsUseMatch[1]);

  // Padrão 5: "Total: X" ou "Total de X"
  const totalMatch = clean.match(
    /total(?:\s+de)?\s*:?\s*(\d[\d.,]*)/i
  );
  if (totalMatch) return parseFormattedNumber(totalMatch[1]);

  return null;
}

/**
 * Converte números formatados como "1,234" ou "1.234" para número.
 */
function parseFormattedNumber(str: string): number {
  // Remove separadores de milhar (vírgula ou ponto)
  const cleaned = str.replace(/[.,]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Conta os cards de anúncios visíveis na página, scrollando até o final.
 * Fallback quando não encontra o texto com o total.
 */
async function countAdCardsByScrolling(
  page: import("playwright").Page
): Promise<number> {
  // Seletores comuns para cards de anúncios na Ad Library
  const cardSelectors = [
    '[class*="xrvj5dj"]',              // classe comum dos cards
    'div[role="article"]',              // article containers
    'div[class*="_7jvw"]',              // outra variação
    'div[aria-label*="ad"]',            // aria label
    'div[data-visualcompletion="media-vc-image"]', // images in ads
  ];

  let maxCards = 0;
  let lastCount = 0;
  let stableRounds = 0;

  // Scroll até não encontrar mais ads (máx 30 scrolls)
  for (let i = 0; i < 30; i++) {
    for (const selector of cardSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > maxCards) maxCards = count;
      } catch {
        // selector não existe, continua
      }
    }

    if (maxCards === lastCount) {
      stableRounds++;
      if (stableRounds >= 3) break; // 3 scrolls sem novos ads = fim
    } else {
      stableRounds = 0;
      lastCount = maxCards;
    }

    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1500);
  }

  return maxCards;
}

/**
 * Scrapa o número de anúncios ativos de uma página na Meta Ads Library.
 *
 * @param pageId - O view_all_page_id da página
 * @param countryCode - Código do país (BR, US, etc)
 * @returns Número de anúncios ativos
 */
export async function scrapeActiveAdsCount(
  pageId: string,
  countryCode: string = "BR"
): Promise<number> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: USER_AGENT,
      locale: "pt-BR",
    });

    const page = await context.newPage();

    const url = buildLibraryUrl(pageId, countryCode);
    console.log(`[adLibraryScraper] Abrindo: ${url}`);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Fecha dialogs de cookies/consentimento se aparecerem
    try {
      const cookieBtn = page.locator(
        'button:has-text("Allow"), button:has-text("Permitir"), button:has-text("Accept"), button:has-text("Aceitar"), [data-cookiebanner="accept_button"]'
      );
      await cookieBtn.first().click({ timeout: 3000 });
    } catch {
      // Sem dialog de cookies, segue
    }

    // Aguarda conteúdo carregar
    await page.waitForTimeout(4000);

    // Estratégia 1: Tenta extrair do texto da página
    const bodyText = await page.textContent("body");
    if (bodyText) {
      const count = extractCountFromText(bodyText);
      if (count !== null && count > 0) {
        console.log(`[adLibraryScraper] Encontrou via texto: ${count} ads`);
        return count;
      }
    }

    // Estratégia 2: Procura elementos específicos com contagem
    const countSelectors = [
      // O Facebook usa esses patterns para mostrar contagem
      'div[class*="x1lliihq"] span',
      'span[class*="x1lliihq"]',
      'div[role="heading"]',
    ];

    for (const sel of countSelectors) {
      try {
        const elements = await page.locator(sel).allTextContents();
        for (const txt of elements) {
          const count = extractCountFromText(txt);
          if (count !== null && count > 0) {
            console.log(`[adLibraryScraper] Encontrou via selector ${sel}: ${count} ads`);
            return count;
          }
        }
      } catch {
        continue;
      }
    }

    // Estratégia 3: Conta os cards scrollando a página
    console.log("[adLibraryScraper] Fallback: contando cards por scroll...");
    const cardCount = await countAdCardsByScrolling(page);
    console.log(`[adLibraryScraper] Cards encontrados: ${cardCount}`);

    return cardCount;
  } catch (err) {
    console.error("[adLibraryScraper] Erro:", err);
    throw new Error(
      `Falha ao scrape Ad Library: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    if (browser) await browser.close();
  }
}
