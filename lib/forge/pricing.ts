import { ForgeModel, ForgeModelInputs, ForgePricing } from "@/types/forge";

interface CostParams {
  resolution?: string;
  duration?: number;
  quality?: string;
  hasImage?: boolean;
}

interface CostResult {
  usd: number;
  approx: boolean;
}

/**
 * Calcula o custo estimado de uma geração baseado nos parâmetros selecionados.
 * Usa o pricing da variante I2V/I2I se hasImage=true e o modelo tem essa variante,
 * caso contrário usa o pricing base do modelo.
 */
export function calculateCost(model: ForgeModel, params: CostParams): CostResult | null {
  const variantPricing = params.hasImage ? model.endpoint_with_image?.pricing : undefined;
  const pricing: ForgePricing | undefined = variantPricing || model.pricing;
  if (!pricing) return null;

  let cost = pricing.base_usd;

  if (params.resolution && pricing.resolution_mult?.[params.resolution] !== undefined) {
    cost *= pricing.resolution_mult[params.resolution];
  }
  if (params.duration && pricing.duration_mult?.[params.duration] !== undefined) {
    cost *= pricing.duration_mult[params.duration];
  }
  if (params.quality && pricing.quality_mult?.[params.quality] !== undefined) {
    cost *= pricing.quality_mult[params.quality];
  }

  return { usd: cost, approx: pricing.approx === true };
}

export function formatCost(result: CostResult | null): string {
  if (!result) return "";
  const prefix = result.approx ? "≈" : "";
  if (result.usd < 0.01) return `${prefix}$<0.01`;
  if (result.usd < 1) return `${prefix}$${result.usd.toFixed(2)}`;
  return `${prefix}$${result.usd.toFixed(2)}`;
}

/**
 * Resolve os valores efetivos de cada parâmetro (selecionado pelo user OU default do modelo)
 * pra usar no cálculo de custo.
 */
export function resolveCostParams(
  inputs: ForgeModelInputs,
  selected: Partial<CostParams>,
): CostParams {
  return {
    resolution: selected.resolution || inputs.default_resolution,
    duration: selected.duration || inputs.default_duration,
    quality: selected.quality || inputs.default_quality,
    hasImage: selected.hasImage,
  };
}
