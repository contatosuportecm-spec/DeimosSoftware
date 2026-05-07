import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("forge_api_keys")
    .select("id, provider_id, label, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { provider_id, api_key, label } = await req.json();

  if (!provider_id || !api_key) {
    return NextResponse.json({ error: "provider_id and api_key are required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Upsert — one key per provider
  const { data, error } = await supabase
    .from("forge_api_keys")
    .upsert(
      { provider_id, encrypted_key: api_key, label: label || provider_id },
      { onConflict: "provider_id" }
    )
    .select("id, provider_id, label, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { provider_id } = await req.json();

  if (!provider_id) {
    return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("forge_api_keys")
    .delete()
    .eq("provider_id", provider_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
