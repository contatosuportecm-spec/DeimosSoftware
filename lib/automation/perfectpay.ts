import { Product } from "@/types";
import {
  launchBrowser,
  loadCookies,
  saveCookies,
  screenshot,
  logStep,
  AutomationLogEntry,
} from "./browser";

// ═══ Seletores PerfectPay ═══
// IMPORTANTE: estes seletores precisam ser mapeados na interface real da PerfectPay.
// Use data-testid, aria-label ou texto visível quando possível para resiliência.
const SELECTORS = {
  // Login
  loginEmail: 'input[name="email"], input[type="email"]',
  loginPassword: 'input[name="password"], input[type="password"]',
  loginButton: 'button[type="submit"]',

  // Navegação
  productsMenu: 'a[href*="produto"], [data-menu="produtos"]',
  newProductButton: 'a[href*="novo"], button:has-text("Novo Produto"), button:has-text("Criar Produto")',

  // Formulário de produto
  productName: 'input[name="name"], input[name="nome"], #product-name',
  productDescription: 'textarea[name="description"], textarea[name="descricao"], #product-description',
  productPrice: 'input[name="price"], input[name="preco"], #product-price',
  productCategory: 'select[name="category"], select[name="categoria"]',

  // Upload de imagem
  imageUpload: 'input[type="file"][accept*="image"], input[type="file"]',

  // Checkout config
  pixelInput: 'input[name="pixel"], input[placeholder*="pixel"], #pixel-id',
  guaranteeInput: 'input[name="guarantee"], input[name="garantia"]',

  // Submit
  saveButton: 'button[type="submit"]:has-text("Salvar"), button:has-text("Criar"), button:has-text("Publicar")',

  // Resultado
  checkoutUrlField: 'input[readonly][value*="http"], .checkout-url, [data-checkout-url]',
};

const PERFECTPAY_URL = "https://app.perfectpay.com.br";

interface AutomationResult {
  checkout_url: string;
  platform_product_id: string;
  log: AutomationLogEntry[];
}

export async function createProductOnPlatform(product: Product): Promise<AutomationResult> {
  const log: AutomationLogEntry[] = [];
  const { browser, context } = await launchBrowser(true);

  try {
    // Tenta carregar cookies salvos
    const hasCookies = await loadCookies(context, "perfectpay");
    logStep(log, "load_cookies", "ok", hasCookies ? "Cookies carregados" : "Sem cookies salvos");

    const page = await context.newPage();

    // ── Step 1: Login ──
    await page.goto(`${PERFECTPAY_URL}/login`, { waitUntil: "networkidle" });
    logStep(log, "navigate_login", "ok");

    // Verifica se já está logado (cookies válidos)
    const isLoggedIn = page.url().includes("/dashboard") || page.url().includes("/produtos");

    if (!isLoggedIn) {
      const email = process.env.PERFECTPAY_EMAIL;
      const password = process.env.PERFECTPAY_PASSWORD;

      if (!email || !password) {
        throw new Error("PERFECTPAY_EMAIL e PERFECTPAY_PASSWORD não configurados no .env");
      }

      await page.fill(SELECTORS.loginEmail, email);
      await page.fill(SELECTORS.loginPassword, password);
      await page.click(SELECTORS.loginButton);
      await page.waitForNavigation({ waitUntil: "networkidle" });

      const screenshotPath = await screenshot(page, "after_login");
      logStep(log, "login", "ok", "Login realizado", screenshotPath);

      // Salva cookies para próximas execuções
      await saveCookies(context, "perfectpay");
    } else {
      logStep(log, "login", "ok", "Já autenticado via cookies");
    }

    // ── Step 2: Navegar para criação de produto ──
    await page.click(SELECTORS.productsMenu);
    await page.waitForLoadState("networkidle");
    logStep(log, "navigate_products", "ok");

    await page.click(SELECTORS.newProductButton);
    await page.waitForLoadState("networkidle");

    const screenshotForm = await screenshot(page, "product_form");
    logStep(log, "open_form", "ok", "Formulário de criação aberto", screenshotForm);

    // ── Step 3: Preencher dados do produto ──
    await page.fill(SELECTORS.productName, product.name);
    logStep(log, "fill_name", "ok", product.name);

    if (product.description) {
      await page.fill(SELECTORS.productDescription, product.description);
      logStep(log, "fill_description", "ok");
    }

    await page.fill(SELECTORS.productPrice, String(product.price));
    logStep(log, "fill_price", "ok", `R$ ${product.price}`);

    // ── Step 4: Upload de imagem ──
    if (product.image_url) {
      try {
        const fileInput = page.locator(SELECTORS.imageUpload);
        if (await fileInput.count() > 0) {
          // Se image_url é um path local, faz upload direto
          // Se é uma URL remota, baixa primeiro para um temp file
          if (product.image_url.startsWith("http")) {
            const fs = await import("fs");
            const path = await import("path");
            const response = await fetch(product.image_url);
            const buffer = Buffer.from(await response.arrayBuffer());
            const tempPath = path.join(process.cwd(), ".automation", `temp_${Date.now()}.jpg`);
            fs.writeFileSync(tempPath, buffer);
            await fileInput.setInputFiles(tempPath);
            fs.unlinkSync(tempPath); // limpa temp
            logStep(log, "upload_image", "ok", "Imagem baixada e uploaded");
          } else {
            await fileInput.setInputFiles(product.image_url);
            logStep(log, "upload_image", "ok", "Imagem local uploaded");
          }
        }
      } catch {
        logStep(log, "upload_image", "error", "Campo de upload não encontrado ou falha no upload");
      }
    }

    // ── Step 5: Configurar pixel ──
    if (product.pixel_id) {
      try {
        await page.fill(SELECTORS.pixelInput, product.pixel_id);
        logStep(log, "fill_pixel", "ok", product.pixel_id);
      } catch {
        logStep(log, "fill_pixel", "error", "Campo de pixel não encontrado");
      }
    }

    // ── Step 5: Configurar garantia ──
    try {
      await page.fill(SELECTORS.guaranteeInput, String(product.guarantee_days));
      logStep(log, "fill_guarantee", "ok", `${product.guarantee_days} dias`);
    } catch {
      logStep(log, "fill_guarantee", "error", "Campo de garantia não encontrado");
    }

    const screenshotFilled = await screenshot(page, "form_filled");
    logStep(log, "form_filled", "ok", "Todos os campos preenchidos", screenshotFilled);

    // ── Step 6: Salvar/Publicar ──
    await page.click(SELECTORS.saveButton);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Espera processamento

    const screenshotSaved = await screenshot(page, "after_save");
    logStep(log, "save_product", "ok", "Produto salvo", screenshotSaved);

    // ── Step 7: Capturar link do checkout ──
    let checkoutUrl = "";
    let platformProductId = "";

    try {
      // Tenta pegar da URL atual
      const currentUrl = page.url();
      const productIdMatch = currentUrl.match(/produto[s]?\/(\d+|[a-f0-9-]+)/i);
      if (productIdMatch) {
        platformProductId = productIdMatch[1];
      }

      // Tenta pegar o campo de checkout URL
      const checkoutElement = await page.$(SELECTORS.checkoutUrlField);
      if (checkoutElement) {
        checkoutUrl = await checkoutElement.getAttribute("value") ?? "";
      }

      // Fallback: tenta encontrar um link na página
      if (!checkoutUrl) {
        const links = await page.$$eval("a[href*='checkout'], input[value*='checkout']", (els) =>
          els.map((el) => (el as HTMLInputElement).value || (el as HTMLAnchorElement).href).filter(Boolean)
        );
        if (links.length > 0) {
          checkoutUrl = links[0];
        }
      }

      if (!checkoutUrl) {
        // Construir URL padrão se tiver o product ID
        if (platformProductId) {
          checkoutUrl = `${PERFECTPAY_URL}/checkout/${platformProductId}`;
        } else {
          throw new Error("Não foi possível capturar o link do checkout");
        }
      }

      logStep(log, "capture_checkout_url", "ok", checkoutUrl);
    } catch (err) {
      const screenshotErr = await screenshot(page, "checkout_url_error");
      logStep(log, "capture_checkout_url", "error",
        err instanceof Error ? err.message : "Erro ao capturar URL",
        screenshotErr
      );
      throw err;
    }

    return {
      checkout_url: checkoutUrl,
      platform_product_id: platformProductId,
      log,
    };
  } catch (err) {
    logStep(log, "fatal_error", "error", err instanceof Error ? err.message : "Erro desconhecido");
    throw Object.assign(err instanceof Error ? err : new Error(String(err)), { log });
  } finally {
    await browser.close();
  }
}
