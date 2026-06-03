// Gateways de checkout monitorados via Reclame Aqui.
// URL completa: https://www.reclameaqui.com.br/empresa/{slug}/lista-reclamacoes/

export interface ReclameAquiGateway {
  slug: string;      // slug exato conforme reclameaqui.com.br/empresa/{slug}/
  name: string;      // nome de exibição
  initials: string;  // fallback visual (2-3 letras)
  color: string;     // cor de marca
  logo?: string;     // caminho relativo em /public para a logo da figurinha
}

export const RECLAME_AQUI_GATEWAYS: ReclameAquiGateway[] = [
  { slug: "kirvano-pagamentos",                               name: "Kirvano",     initials: "KV", color: "#818CF8", logo: "/gateways/kirvano.svg" },
  { slug: "perfectpay",                                       name: "Perfect Pay", initials: "PP", color: "#5B8CFF", logo: "/gateways/perfectpay.jpg" },
  { slug: "kiwify",                                           name: "Kiwify",      initials: "KW", color: "#22C55E", logo: "/gateways/kiwify.svg" },
  { slug: "cakto-pay",                                        name: "Cakto Pay",   initials: "CK", color: "#FACC15", logo: "/gateways/cakto.png" },
  { slug: "tribo-pay",                                        name: "Tribo Pay",   initials: "TP", color: "#FB923C", logo: "/gateways/tribopay.ico" },
  { slug: "disrupty-tecnologia-servicos-e-pagamentos-ltda",   name: "Disrupty",    initials: "DS", color: "#C084FC", logo: "/gateways/disrupty.png" },
  { slug: "mangofy-tecnologia",                               name: "Mangofy",     initials: "MG", color: "#F472B6", logo: "/gateways/mangofy.png" },
  { slug: "payt",                                             name: "Payt",        initials: "PY", color: "#34D399", logo: "/gateways/payt.png" },
  { slug: "ticto",                                            name: "Ticto",       initials: "TC", color: "#F4C430", logo: "/gateways/ticto.ico" },
  { slug: "ggcheckout",                                       name: "GG Checkout", initials: "GG", color: "#60A5FA", logo: "/gateways/ggcheckout-gfv.png" },
  { slug: "ironpay-tecnologia-servicos-e-pagamentos-ltda",    name: "IronPay",     initials: "IP", color: "#94A3B8", logo: "/gateways/ironpay.png" },
  { slug: "wiapy",                                            name: "Wiapy",       initials: "WP", color: "#16A34A", logo: "/gateways/wiapy.png" },
  { slug: "lowify-tecnologia",                                name: "Lowify",      initials: "LW", color: "#2563EB", logo: "/gateways/lowify.png" },
];

export function reclameAquiUrl(slug: string): string {
  return `https://www.reclameaqui.com.br/empresa/${slug}/lista-reclamacoes/`;
}
