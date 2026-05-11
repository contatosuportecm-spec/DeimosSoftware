import { OfferSnapshot, Country, COUNTRY_CODES } from "@/types";

/**
 * Retorna cor do tier baseado na quantidade de anúncios ativos.
 * emerald(50+) > amber(30+) > ember(15+) > gray(<15)
 */
export function tierColor(count: number): string {
  if (count >= 50) return "#34D399";
  if (count >= 30) return "#F4C430";
  if (count >= 15) return "#FF8A1F";
  return "#6B6B73";
}

/**
 * Calcula variação percentual entre primeiro e último snapshot.
 * Usado em componentes client-side (OfferCard, OfferRow).
 */
export function calcDeltaPct(snapshots: Pick<OfferSnapshot, "active_ads_count">[]): string {
  if (snapshots.length < 2) return "—";
  const first = snapshots[0].active_ads_count;
  const last  = snapshots[snapshots.length - 1].active_ads_count;
  if (first === 0) return last > 0 ? "+∞%" : "—";
  const pct = ((last - first) / first) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

/**
 * Monta a URL da Meta Ads Library com busca por palavra-chave exata.
 * Usado pelo módulo Biblioteca de Anúncios.
 */
export function buildAdsLibraryUrl(keyword: string, country: Country = "BR"): string {
  // A Meta aceita o código ISO de 2 letras no parâmetro `country`. Para Latam,
  // usamos BR como entrada canônica (a busca aparece em todos os mercados disponíveis).
  const code = COUNTRY_CODES[country]?.[0] ?? "BR";
  const params = new URLSearchParams({
    active_status: "active",
    ad_type: "all",
    country: code,
    is_targeted_country: "false",
    media_type: "all",
    q: `"${keyword}"`,
    search_type: "keyword_exact_phrase",
    "sort_data[direction]": "desc",
    "sort_data[mode]": "total_impressions",
  });
  return `https://www.facebook.com/ads/library/?${params.toString()}`;
}
