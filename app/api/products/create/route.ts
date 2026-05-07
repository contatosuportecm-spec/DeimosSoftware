import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createProductOnPlatform } from "@/lib/automation/perfectpay";
import { Product } from "@/types";

export const dynamic = "force-dynamic";

// POST /api/products/create — dispara automação Playwright
export async function POST(req: NextRequest) {
  try {
    const { product_id } = await req.json() as { product_id: string };

    if (!product_id) {
      return NextResponse.json({ error: "product_id é obrigatório" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Busca o produto
    const { data: product, error: fetchErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (fetchErr || !product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Atualiza status para "creating"
    await supabase
      .from("products")
      .update({ status: "creating", error_message: null })
      .eq("id", product_id);

    try {
      // Dispara automação
      const result = await createProductOnPlatform(product as Product);

      // Sucesso — atualiza com link do checkout
      const { data: updated, error: updateErr } = await supabase
        .from("products")
        .update({
          status: "active",
          checkout_url: result.checkout_url,
          platform_product_id: result.platform_product_id,
          automation_log: result.log,
        })
        .eq("id", product_id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return NextResponse.json(updated as Product);
    } catch (automationErr) {
      // Falha na automação — marca como failed
      const errorMsg = automationErr instanceof Error
        ? automationErr.message
        : "Erro desconhecido na automação";

      await supabase
        .from("products")
        .update({ status: "failed", error_message: errorMsg })
        .eq("id", product_id);

      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (err) {
    console.error("[api/products/create POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao disparar automação" },
      { status: 500 }
    );
  }
}
