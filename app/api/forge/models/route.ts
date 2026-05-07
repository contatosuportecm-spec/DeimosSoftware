import { NextResponse } from "next/server";
import { FORGE_MODELS, getForgeModelsByCategory } from "@/lib/forge/models";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  if (category) {
    const models = getForgeModelsByCategory(category as "image" | "video" | "lipsync");
    return NextResponse.json(models);
  }

  return NextResponse.json(FORGE_MODELS);
}
