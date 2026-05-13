import { NextRequest, NextResponse } from "next/server";
import { queryWiki } from "@/lib/wiki/query";
import { WikiQueryInput } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WikiQueryInput;
    if (typeof body?.q !== "string") {
      return NextResponse.json({ error: "q é obrigatório (string)" }, { status: 400 });
    }
    const result = await queryWiki(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/wiki/query]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro na query" },
      { status: 500 },
    );
  }
}
