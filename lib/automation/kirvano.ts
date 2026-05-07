import { Product } from "@/types";
import { AutomationLogEntry } from "./browser";

interface AutomationResult {
  checkout_url: string;
  platform_product_id: string;
  log: AutomationLogEntry[];
}

/**
 * Scaffold para automação Kirvano.
 * Implementação futura — requer mapeamento de seletores da interface.
 */
export async function createProductOnKirvano(_product: Product): Promise<AutomationResult> {
  throw new Error(
    "Automação Kirvano ainda não implementada. " +
    "É necessário mapear os seletores da interface antes de implementar."
  );
}
