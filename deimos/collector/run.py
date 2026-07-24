"""
DEIMOS — Runner automático v2 (Playwright)
Lê keywords.txt, coleta todas as queries e exporta Excel consolidado.
"""

import argparse
import asyncio
import sys
import time
from datetime import date
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from playwright.async_api import async_playwright

from collector import (
    scrape_keyword,
    create_browser_context,
    export_to_excel,
)

KEYWORDS_FILE = Path(__file__).parent / "keywords.txt"


def load_keywords(path: Path) -> list[str]:
    keywords = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                keywords.append(line)
    return keywords


async def run(args) -> None:
    kw_path = Path(args.keywords_file)
    if not kw_path.exists():
        print(f"Arquivo de keywords não encontrado: {kw_path}")
        return

    keywords = load_keywords(kw_path)
    if not keywords:
        print("Nenhuma keyword encontrada em keywords.txt")
        return

    countries = [c.strip() for c in args.countries.split(",") if c.strip()]
    output = args.output or f"spy_{date.today().isoformat()}.xlsx"
    total_kw = len(keywords)

    print(f"DEIMOS — Iniciando coleta de {total_kw} keywords\n")

    all_observations: list[dict] = []
    seen_pages: set[str] = set()
    keyword_stats: list[dict] = []

    async with async_playwright() as p:
        browser, context = await create_browser_context(p)
        page = await context.new_page()

        for idx, kw in enumerate(keywords, start=1):
            print(f"[{idx:02d}/{total_kw:02d}] Pesquisando \"{kw}\"...", end=" ", flush=True)

            try:
                obs = await scrape_keyword(
                    page=page,
                    keyword=kw,
                    country=countries[0],
                    max_scrolls=args.scrolls,
                )
            except Exception as e:
                print(f"ERRO: {e}")
                keyword_stats.append({
                    "keyword": kw,
                    "players": 0,
                    "novos_unicos": 0,
                    "duplicatas": 0,
                })
                continue

            new_unique = [o for o in obs if o["page_name"] not in seen_pages]
            for o in new_unique:
                seen_pages.add(o["page_name"])
            all_observations.extend(new_unique)

            dupes = sum(1 for o in new_unique if o["has_duplicates"] == "Sim")
            keyword_stats.append({
                "keyword":      kw,
                "players":      len(obs),
                "novos_unicos": len(new_unique),
                "duplicatas":   dupes,
            })

            print(f"players: {len(obs)} | novos únicos: {len(new_unique)} | duplicatas: {dupes}")

            if idx < total_kw:
                await asyncio.sleep(args.delay)

        await browser.close()

    # Ordenar por ads ativos desc
    all_observations.sort(key=lambda x: x["active_ads_count"], reverse=True)

    forte = sum(1 for o in all_observations if o["signal_strength"] == "FORTE")
    medio = sum(1 for o in all_observations if o["signal_strength"] == "MÉDIO")
    fraco = sum(1 for o in all_observations if o["signal_strength"] == "FRACO")
    ruido = sum(1 for o in all_observations if o["signal_strength"] == "RUÍDO")
    dupes_total = sum(1 for o in all_observations if o["has_duplicates"] == "Sim")

    export_to_excel(all_observations, output, total_kw, keyword_stats)

    print(f"\nCOLETA FINALIZADA")
    print(f"Total de players únicos : {len(all_observations)}")
    print(f"Com duplicatas (3+ ads) : {dupes_total}")
    print(f"FORTE: {forte}  MÉDIO: {medio}  FRACO: {fraco}  RUÍDO: {ruido}")
    print(f"Exportado para: {output}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="DEIMOS — Runner automático de coleta de ofertas (Playwright)"
    )
    parser.add_argument(
        "--scrolls", type=int, default=5,
        help="Número de scrolls por keyword para carregar mais resultados (padrão: 5)"
    )
    parser.add_argument(
        "--delay", type=float, default=2.5,
        help="Delay em segundos entre keywords (padrão: 2.5)"
    )
    parser.add_argument(
        "--countries", default="BR",
        help="Países separados por vírgula (padrão: BR)"
    )
    parser.add_argument(
        "--output", default=None,
        help="Caminho do arquivo Excel de saída"
    )
    parser.add_argument(
        "--keywords_file", default=str(KEYWORDS_FILE),
        help="Caminho para keywords.txt (padrão: keywords.txt ao lado de run.py)"
    )
    args = parser.parse_args()
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
