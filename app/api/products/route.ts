import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { CreateProductInput, Product } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/products — lista todos os produtos
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(products ?? []);
  } catch (err) {
    console.error("[api/products GET]", err);
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
  }
}

// POST /api/products — cria produto como draft
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CreateProductInput;

    if (!body.name || !body.format || !body.platform || !body.price) {
      return NextResponse.json(
        { error: "name, format, platform e price são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: product, error: insertErr } = await supabase
      .from("products")
      .insert({
        name: body.name,
        description: body.description || null,
        format: body.format,
        category: body.category || null,
        price: body.price,
        installment_price: body.installment_price || null,
        max_installments: body.max_installments || null,
        guarantee_days: body.guarantee_days ?? 7,
        image_url: body.image_url || null,
        pixel_id: body.pixel_id || null,
        platform: body.platform,
        bump_name: body.bump_name || null,
        bump_price: body.bump_price || null,
        upsell_name: body.upsell_name || null,
        upsell_price: body.upsell_price || null,
        offer_id: body.offer_id || null,
        status: "draft",
      })
      .select()
      .single();

    if (insertErr || !product) throw insertErr;

    return NextResponse.json(product as Product, { status: 201 });
  } catch (err) {
    console.error("[api/products POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar produto" },
      { status: 500 }
    );
  }
}

// DELETE /api/products?id=xxx — remove produto
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/products DELETE]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao deletar produto" },
      { status: 500 }
    );
  }
}
