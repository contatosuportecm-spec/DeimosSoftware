import { NextRequest, NextResponse } from "next/server";
import { advanceCampaign } from "@/lib/autoresearch/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // simulation chains 2 LLM calls

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await advanceCampaign(params.id);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
