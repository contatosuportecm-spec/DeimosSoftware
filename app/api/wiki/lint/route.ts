import { NextResponse } from "next/server";
import { lintWiki } from "@/lib/wiki/lint";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await lintWiki();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/wiki/lint]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no lint" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return POST();
}
