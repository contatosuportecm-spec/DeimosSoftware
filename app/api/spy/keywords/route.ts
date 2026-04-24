import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/spy/keywords — lista todas as keywords
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("spy_keywords")
      .select("*")
      .order("category")
      .order("keyword");

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[api/spy/keywords GET]", err);
    return NextResponse.json({ error: "Erro ao buscar keywords" }, { status: 500 });
  }
}

// POST /api/spy/keywords — cria keyword
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      keyword: string;
      category?: string;
      language?: string;
    };

    if (!body.keyword?.trim()) {
      return NextResponse.json({ error: "keyword é obrigatório" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("spy_keywords")
      .insert({
        keyword: body.keyword.trim().toLowerCase(),
        category: body.category ?? "geral",
        language: body.language ?? "pt",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Keyword já existe" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[api/spy/keywords POST]", err);
    return NextResponse.json({ error: "Erro ao criar keyword" }, { status: 500 });
  }
}
