"""
DEIMOS — Spy Collector v3 (Playwright + Supabase)
Scraping da Meta Ad Library → filtro DR → scoring → salva no Supabase.
"""

import asyncio
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from supabase import create_client, Client

# UTF-8 no Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════════════════

AD_LIBRARY_BASE = "https://www.facebook.com/ads/library/"

# Mínimo de ads para considerar página como candidata
MIN_ADS_THRESHOLD = 3

# Score DR mínimo (0-1) para criar oferta
DR_SCORE_THRESHOLD = 0.35

# Máximo de keywords por run (controla tempo total)
MAX_KEYWORDS_PER_RUN = 25

# Delay entre keywords (segundos)
KEYWORD_DELAY = 3.0

# Scrolls por keyword (mais = mais resultados, mais lento)
MAX_SCROLLS = 5

# ═══════════════════════════════════════════════════════════════════════════════
# BLACKLISTS
# ═══════════════════════════════════════════════════════════════════════════════

BRAND_BLACKLIST = [
    "ifood", "mercado livre", "mercadolivre", "magalu", "magazine luiza",
    "americanas", "shopee", "shein", "nubank", "itaú", "itau", "bradesco",
    "santander", "banco do brasil", "caixa", "renner", "c&a", "riachuelo",
    "lojas", "havan", "casas bahia", "ponto frio", "extra", "carrefour",
    "amazon", "aliexpress", "wish", "temu", "kwai", "tiktok", "meta",
    "google", "microsoft", "apple", "samsung", "motorola", "xiaomi",
    "coca-cola", "coca cola", "pepsi", "nestlé", "nestle", "unilever",
    "natura", "avon", "boticário", "boticario", "eudora",
    "uber", "99", "rappi", "zé delivery",
    "globo", "sbt", "record", "band", "cnn", "uol", "folha", "estadão",
    "veja", "exame", "infomoney", "xp invest",
    "nike", "adidas", "puma", "new balance", "vans",
    "netflix", "spotify", "disney", "hbo", "prime video",
    "claro", "vivo", "tim", "oi",
]

# Gatilhos de Direct Response
DR_TRIGGERS_PT = [
    "método", "truque", "segredo", "descubra", "antes que",
    "revelado", "comprovado", "emagrecer", "derreter",
    "gordura", "barriga", "ritual", "protocolo",
    "receita caseira", "clique aqui", "link na bio",
    "oferta especial", "últimas vagas", "por tempo limitado",
    "garantia", "desconto", "grátis", "bônus",
    "resultados reais", "depoimento",
    "natural", "sem efeitos", "liberado pela anvisa",
    "médicos não contam", "indústria esconde",
    "perca peso", "secar", "emagreça",
    "libido", "potência", "testosterona",
    "renda extra", "ganhar dinheiro", "trabalhe de casa",
    "reconquist", "relacionamento",
    "ansiedade", "insônia", "colágeno", "rugas",
    "diabetes", "pressão alta", "colesterol", "glicose",
]

DR_TRIGGERS_EN = [
    "method", "trick", "secret", "discover", "before they",
    "revealed", "proven", "weight loss", "belly fat",
    "ritual", "protocol", "click here",
    "limited time", "guarantee", "discount", "bonus",
    "free", "testimonial", "natural",
    "doctors don't", "industry hides", "big pharma",
    "lose weight", "burn fat",
    "libido", "testosterone",
    "make money", "work from home",
    "anxiety", "sleep", "collagen", "anti-aging",
    "blood sugar", "cholesterol",
]

# ═══════════════════════════════════════════════════════════════════════════════
# SUPABASE CLIENT
# ═══════════════════════════════════════════════════════════════════════════════

def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios")
    return create_client(url, key)

# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def normalize(text: str) -> str:
    import unicodedata
    text = unicodedata.normalize("NFD", text.lower())
    text = re.sub(r"[\u0300-\u036f]", "", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def is_blacklisted(page_name: str) -> bool:
    n = normalize(page_name)
    return any(normalize(b) in n for b in BRAND_BLACKLIST)


def build_library_url(page_id: str, country: str = "BR") -> str:
    return (
        f"{AD_LIBRARY_BASE}?active_status=active&ad_type=all"
        f"&country={country}&view_all_page_id={page_id}"
        f"&search_type=page&media_type=all"
    )

# ═══════════════════════════════════════════════════════════════════════════════
# SCORING DR
# ═══════════════════════════════════════════════════════════════════════════════

def calculate_dr_score(
    copies: list[str],
    ad_count: int,
    unique_creatives: int,
    duplicate_count: int,
    language: str = "pt",
) -> float:
    """Score 0-1: quanto essa página parece Direct Response."""
    if ad_count == 0:
        return 0.0

    all_text = " ".join(copies).lower()
    triggers = DR_TRIGGERS_EN if language == "en" else DR_TRIGGERS_PT

    # 1. Gatilhos textuais (30%)
    hits = sum(1 for t in triggers if t in all_text)
    text_score = min(hits / 5, 1.0)

    # 2. Padrão de copy (20%) — DR usa copy longa e repetitiva
    avg_len = sum(len(c) for c in copies) / max(len(copies), 1)
    copy_score = min(avg_len / 300, 1.0)

    # 3. Homogeneidade / duplicação (25%)
    # Muitos duplicados = tá testando variações → DR
    # Muitos criativos diferentes em volume alto = lateral scaling → também DR
    if ad_count <= 2:
        creativity_score = 0.3
    elif duplicate_count >= 3:
        creativity_score = min(0.7 + duplicate_count * 0.03, 1.0)
    elif unique_creatives >= 5 and ad_count >= 8:
        creativity_score = 0.8
    else:
        dupe_ratio = 1 - unique_creatives / max(ad_count, 1)
        creativity_score = max(0.2, dupe_ratio)

    # 4. Volume bruto (25%)
    import math
    volume_score = min(math.log10(ad_count + 1) / 2, 1.0)

    score = (
        text_score * 0.30
        + copy_score * 0.20
        + creativity_score * 0.25
        + volume_score * 0.25
    )
    return round(score, 4)


def detect_scaling_signal(
    ad_count: int,
    unique_creatives: int,
    duplicate_count: int,
) -> str:
    """Detecta padrão de escala: lateral, vertical, budget, unknown."""
    if unique_creatives >= 8 and ad_count >= 10:
        return "lateral"
    if duplicate_count >= 5 and unique_creatives <= 5:
        return "vertical"  # poucos criativos, empurrando spend
    if ad_count >= 5 and unique_creatives <= 3:
        return "budget"
    return "unknown"

# ═══════════════════════════════════════════════════════════════════════════════
# SCRAPING (adaptado do collector.py original)
# ═══════════════════════════════════════════════════════════════════════════════

async def _dismiss_popups(page: Page) -> None:
    selectors = [
        'button:has-text("Allow all cookies")',
        'button:has-text("Aceitar todos")',
        'button:has-text("Allow essential and optional cookies")',
        '[aria-label="Close"]',
        '[data-testid="cookie-policy-manage-dialog-accept-button"]',
    ]
    for sel in selectors:
        try:
            btn = page.locator(sel).first
            if await btn.is_visible(timeout=800):
                await btn.click()
                await page.wait_for_timeout(600)
        except Exception:
            pass


async def _scroll_to_load(page: Page, max_scrolls: int) -> None:
    for _ in range(max_scrolls):
        prev = await page.evaluate("document.body.scrollHeight")
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(2200)
        curr = await page.evaluate("document.body.scrollHeight")
        if curr == prev:
            break


async def _extract_pages(page: Page, keyword: str) -> list[dict]:
    """Extrai dados dos cards de resultado, agrupados por page_id."""
    advertisers: dict[str, dict] = {}

    links = await page.query_selector_all('a[href*="facebook.com/"]')

    for link in links:
        try:
            href = await link.get_attribute("href") or ""
            m = re.search(r"facebook\.com/(\d{5,})", href)
            if not m:
                continue

            page_id = m.group(1)
            page_name = (await link.inner_text() or "").strip()
            if not page_name or len(page_name) < 2:
                continue

            card_text: str = await link.evaluate("""el => {
                let node = el;
                for (let i = 0; i < 12; i++) {
                    node = node.parentElement;
                    if (!node) break;
                    const t = node.innerText || '';
                    if (t.includes('Veiculação iniciada') || t.includes('anúncios usam')
                        || t.includes('Started running') || t.includes('ads use')) {
                        return t.substring(0, 1000);
                    }
                }
                return '';
            }""")

            if not card_text:
                continue

            # Quantos ads usam esse criativo
            dupe_m = re.search(
                r"(\d+)\s+(?:anúncios?\s+usam|ads?\s+use)",
                card_text, re.IGNORECASE,
            )
            creative_count = int(dupe_m.group(1)) if dupe_m else 1

            # Copy: linhas longas que não são metadados
            _META = re.compile(
                r"Veiculação iniciada|Started running|anúncios usam|ads use"
                r"|Identificação da biblioteca|Library ID"
                r"|Abrir menu|Ver resumo|Patrocinado|Sponsored"
                r"|Plataformas|Platforms|Ativo|Active|Inativo|Inactive"
                r"|^\d+:\d+\s*/\s*\d+:\d+$",
                re.IGNORECASE,
            )
            copy_lines = [
                l.strip()
                for l in card_text.splitlines()
                if len(l.strip()) > 25
                and not _META.search(l.strip())
                and l.strip() != page_name
            ]
            sample_copy = " ".join(copy_lines[:4])[:500]

            # Agregar por page_id
            if page_id not in advertisers:
                advertisers[page_id] = {
                    "page_name": page_name,
                    "page_id": page_id,
                    "total_ads": 0,
                    "max_creative": 0,
                    "copies": [],
                    "unique_copies": set(),
                }

            adv = advertisers[page_id]
            adv["total_ads"] += creative_count
            if creative_count > adv["max_creative"]:
                adv["max_creative"] = creative_count

            # Track unique copies
            norm_copy = normalize(sample_copy)
            if sample_copy and norm_copy not in adv["unique_copies"]:
                adv["unique_copies"].add(norm_copy)
                adv["copies"].append(sample_copy)

        except Exception:
            continue

    # Montar resultado
    results = []
    for pid, adv in advertisers.items():
        unique_count = len(adv["unique_copies"])
        duplicate_count = adv["total_ads"] - unique_count if adv["total_ads"] > unique_count else 0

        results.append({
            "page_id": pid,
            "page_name": adv["page_name"],
            "ad_count": adv["total_ads"],
            "unique_creatives": unique_count,
            "duplicate_count": duplicate_count,
            "max_creative_dupes": adv["max_creative"],
            "copies": adv["copies"],
        })

    results.sort(key=lambda x: x["ad_count"], reverse=True)
    return results


async def scrape_keyword(
    page: Page,
    keyword: str,
    country: str = "BR",
    max_scrolls: int = MAX_SCROLLS,
) -> list[dict]:
    """Pesquisa uma keyword na Ad Library e retorna páginas encontradas."""
    url = (
        f"{AD_LIBRARY_BASE}"
        f"?active_status=active&ad_type=all&country={country}"
        f"&q={keyword}&search_type=keyword_unordered&media_type=all"
    )

    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=35000)
    except Exception:
        await page.goto(url, timeout=35000)

    await page.wait_for_timeout(3000)
    await _dismiss_popups(page)
    await _scroll_to_load(page, max_scrolls)

    return await _extract_pages(page, keyword)


COOKIES_FILE = Path(__file__).parent / "cookies.json"


async def create_browser(playwright, headless: bool = True) -> tuple[Browser, BrowserContext]:
    """Cria browser com anti-detecção e cookies de sessão Facebook."""
    browser = await playwright.chromium.launch(
        headless=headless,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
        ],
    )
    context = await browser.new_context(
        locale="pt-BR",
        timezone_id="America/Sao_Paulo",
        viewport={"width": 1366, "height": 768},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
    )
    await context.add_init_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )

    # Carrega cookies salvos (sessão Facebook)
    if COOKIES_FILE.exists():
        import json
        cookies = json.loads(COOKIES_FILE.read_text(encoding="utf-8"))
        await context.add_cookies(cookies)
        print(f"[auth] Cookies carregados ({len(cookies)} cookies)")
    else:
        print("[auth] Sem cookies — rodando sem login (resultados limitados)")

    return browser, context


async def save_login_cookies(playwright) -> None:
    """
    Abre browser VISÍVEL para login manual no Facebook.
    Depois de logar, salva cookies em cookies.json.

    Uso: python collector.py --login
    """
    browser = await playwright.chromium.launch(
        headless=False,
        args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    )
    context = await browser.new_context(
        locale="pt-BR",
        timezone_id="America/Sao_Paulo",
        viewport={"width": 1366, "height": 768},
    )
    page = await context.new_page()
    await page.goto("https://www.facebook.com/login")

    print("\n" + "=" * 50)
    print("Faça login no Facebook no browser que abriu.")
    print("Depois de logar, pressione ENTER aqui.")
    print("=" * 50)
    input("\n>>> Pressione ENTER após logar... ")

    # Salva cookies
    import json
    cookies = await context.cookies()
    COOKIES_FILE.write_text(json.dumps(cookies, indent=2), encoding="utf-8")
    print(f"\nCookies salvos em {COOKIES_FILE} ({len(cookies)} cookies)")

    await browser.close()

# ═══════════════════════════════════════════════════════════════════════════════
# PIPELINE PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════════

async def run_discovery(
    country: str = "BR",
    headless: bool = True,
    max_keywords: int = MAX_KEYWORDS_PER_RUN,
    max_scrolls: int = MAX_SCROLLS,
) -> dict:
    """
    Pipeline completo:
    1. Busca keywords ativas no Supabase
    2. Para cada keyword, scrapa a Meta Ad Library
    3. Filtra blacklist + score DR
    4. Dedup contra ofertas existentes
    5. Salva novas ofertas no Supabase
    """
    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    stats = {
        "keywords_scanned": 0,
        "pages_found": 0,
        "pages_passed_filter": 0,
        "offers_created": 0,
        "offers_skipped": 0,
        "errors": 0,
        "log": [],
    }

    # Criar discovery run
    run_res = sb.table("discovery_runs").insert({"status": "running"}).execute()
    run_id = run_res.data[0]["id"] if run_res.data else None

    try:
        # 1. Keywords ativas (prioriza as mais antigas)
        kw_res = (
            sb.table("spy_keywords")
            .select("*")
            .eq("is_active", True)
            .order("last_scanned_at", desc=False, nullsfirst=True)
            .limit(max_keywords)
            .execute()
        )
        keywords = kw_res.data or []

        if not keywords:
            print("Nenhuma keyword ativa encontrada.")
            _finish_run(sb, run_id, stats, "completed")
            return stats

        # 2. Page IDs já existentes (dedup)
        existing_res = (
            sb.table("offers")
            .select("page_id")
            .neq("page_id", "null")
            .execute()
        )
        existing_ids = {r["page_id"] for r in (existing_res.data or []) if r.get("page_id")}

        # 3. Blacklist do DB
        bl_res = sb.table("page_blacklist").select("page_id").execute()
        blacklisted_ids = {r["page_id"] for r in (bl_res.data or [])}

        # 4. Scraping
        async with async_playwright() as p:
            browser, context = await create_browser(p, headless=headless)
            page = await context.new_page()

            for idx, kw in enumerate(keywords, start=1):
                kw_text = kw["keyword"]
                kw_lang = kw.get("language", "pt")
                kw_log = {"keyword": kw_text, "found": 0, "created": 0}

                print(f"[{idx:02d}/{len(keywords):02d}] \"{kw_text}\"...", end=" ", flush=True)

                try:
                    pages = await scrape_keyword(
                        page=page,
                        keyword=kw_text,
                        country=country,
                        max_scrolls=max_scrolls,
                    )
                    stats["keywords_scanned"] += 1
                    kw_log["found"] = len(pages)
                    stats["pages_found"] += len(pages)

                    created = 0
                    for pg in pages:
                        pid = pg["page_id"]

                        # Dedup
                        if pid in existing_ids or pid in blacklisted_ids:
                            stats["offers_skipped"] += 1
                            continue

                        # Blacklist por nome
                        if is_blacklisted(pg["page_name"]):
                            continue

                        # Mínimo de ads
                        if pg["ad_count"] < MIN_ADS_THRESHOLD:
                            continue

                        # Score DR
                        dr_score = calculate_dr_score(
                            copies=pg["copies"],
                            ad_count=pg["ad_count"],
                            unique_creatives=pg["unique_creatives"],
                            duplicate_count=pg["duplicate_count"],
                            language=kw_lang,
                        )

                        if dr_score < DR_SCORE_THRESHOLD:
                            continue

                        stats["pages_passed_filter"] += 1

                        # Detect scaling
                        scaling = detect_scaling_signal(
                            pg["ad_count"],
                            pg["unique_creatives"],
                            pg["duplicate_count"],
                        )

                        # Salvar no Supabase
                        try:
                            sb.table("offers").insert({
                                "name": pg["page_name"],
                                "niche": "geral",
                                "source": "auto_discovery",
                                "library_url": build_library_url(pid, country),
                                "country": country,
                                "page_id": pid,
                                "status": "new",
                                "dr_score": round(dr_score * 100, 2),
                                "discovered_keyword": kw_text,
                                "scaling_pattern": scaling,
                            }).execute()

                            created += 1
                            stats["offers_created"] += 1
                            existing_ids.add(pid)  # evita duplicata no mesmo run
                        except Exception as e:
                            # Provável duplicata (page_id já existe)
                            stats["offers_skipped"] += 1

                    kw_log["created"] = created
                    print(f"páginas: {len(pages)} | novas: {created}")

                    # Atualizar keyword
                    sb.table("spy_keywords").update({
                        "last_scanned_at": now,
                        "total_found": (kw.get("total_found") or 0) + created,
                    }).eq("id", kw["id"]).execute()

                except Exception as e:
                    stats["errors"] += 1
                    kw_log["error"] = str(e)
                    print(f"ERRO: {e}")

                stats["log"].append(kw_log)

                # Delay entre keywords
                if idx < len(keywords):
                    await asyncio.sleep(KEYWORD_DELAY)

            await browser.close()

        _finish_run(sb, run_id, stats, "completed")

    except Exception as e:
        stats["errors"] += 1
        print(f"ERRO FATAL: {e}")
        _finish_run(sb, run_id, stats, "failed")

    return stats


def _finish_run(sb: Client, run_id: Optional[str], stats: dict, status: str) -> None:
    if not run_id:
        return
    sb.table("discovery_runs").update({
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "keywords_scanned": stats["keywords_scanned"],
        "pages_found": stats["pages_found"],
        "pages_passed_filter": stats["pages_passed_filter"],
        "offers_created": stats["offers_created"],
        "offers_skipped": stats["offers_skipped"],
        "errors": stats["errors"],
        "log": stats["log"],
    }).eq("id", run_id).execute()

# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="DEIMOS Spy Collector v3")
    parser.add_argument("--login", action="store_true", help="Abrir browser para login manual e salvar cookies")
    parser.add_argument("--country", default="BR", help="País (padrão: BR)")
    parser.add_argument("--headless", action="store_true", default=True, help="Modo headless")
    parser.add_argument("--no-headless", dest="headless", action="store_false", help="Modo visível")
    parser.add_argument("--max-keywords", type=int, default=MAX_KEYWORDS_PER_RUN)
    parser.add_argument("--max-scrolls", type=int, default=MAX_SCROLLS)
    args = parser.parse_args()

    if args.login:
        # Modo login: abre browser, usuário loga, salva cookies
        async def _login():
            async with async_playwright() as p:
                await save_login_cookies(p)
        asyncio.run(_login())
    else:
        # Modo discovery: roda o pipeline
        print("DEIMOS — Spy Collector v3\n")
        result = asyncio.run(
            run_discovery(
                country=args.country,
                headless=args.headless,
                max_keywords=args.max_keywords,
                max_scrolls=args.max_scrolls,
            )
        )

        print(f"\n{'='*50}")
        print(f"Keywords escaneadas : {result['keywords_scanned']}")
        print(f"Páginas encontradas : {result['pages_found']}")
        print(f"Passaram no filtro  : {result['pages_passed_filter']}")
        print(f"Ofertas criadas     : {result['offers_created']}")
        print(f"Já existiam         : {result['offers_skipped']}")
        print(f"Erros               : {result['errors']}")
