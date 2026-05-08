import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BUCKET = "forge-uploads";

// Service role client — needed to bypass RLS for signed URL creation
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role key not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Unique path to avoid collisions
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${ts}-${rand}-${safeName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error) {
      console.error("[forge/upload-url] signed URL error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build the public URL for this file
    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl: publicData.publicUrl,
      contentType: contentType || "application/octet-stream",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create upload URL";
    console.error("[forge/upload-url]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
