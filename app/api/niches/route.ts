import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createServerClient } from "@/lib/supabase";
import { Niche } from "@/types";

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("niches")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/niches GET]", error);
    return NextResponse.json({ error: "Erro ao buscar nichos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<Niche>;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("niches")
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[api/niches POST]", error);
    return NextResponse.json({ error: "Erro ao criar nicho" }, { status: 500 });
  }
}
