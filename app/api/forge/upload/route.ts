import { NextRequest, NextResponse } from "next/server";
import { getProviderKey, uploadFile } from "@/lib/forge/provider-router";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const providerId = (formData.get("provider_id") as string) || "muapi";

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const apiKey = await getProviderKey(providerId);
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(providerId, buffer, file.name, apiKey);

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload error";
    console.error("[forge/upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
