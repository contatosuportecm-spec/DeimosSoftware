import { NextRequest, NextResponse } from "next/server";
import { ingestSource } from "@/lib/wiki/ingest";
import { WikiIngestInput } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5min — destilação de livro pode demorar

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WikiIngestInput;
    if (!body?.source?.title || !body?.source?.kind) {
      return NextResponse.json(
        { error: "source.title e source.kind são obrigatórios" },
        { status: 400 },
      );
    }
    const result = await ingestSource(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[api/wiki/ingest]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no ingest" },
      { status: 500 },
    );
  }
}
