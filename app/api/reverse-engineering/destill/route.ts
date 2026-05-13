import { NextRequest, NextResponse } from "next/server";
import { destillCompetitor, DestillInput } from "@/lib/reverse/destill";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DestillInput;
    if (!body.raw_text || body.raw_text.trim().length < 100) {
      return NextResponse.json(
        { error: "raw_text precisa ter pelo menos 100 caracteres" },
        { status: 400 },
      );
    }
    const result = await destillCompetitor(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[api/reverse-engineering/destill]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
