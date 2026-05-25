import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

const SETUP_SQL = `
create table if not exists funnels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  nodes       jsonb not null default '[]'::jsonb,
  edges       jsonb not null default '[]'::jsonb,
  viewport    jsonb default '{"x":0,"y":0,"zoom":1}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
`;

export async function POST() {
  const supabase = createServerClient();
  const { error } = await supabase.rpc("exec_sql" as never, { sql: SETUP_SQL } as never);

  if (error) {
    // Try direct table creation via insert to check if table exists
    const { error: checkErr } = await supabase
      .from("funnels" as never)
      .select("id")
      .limit(1);

    if (checkErr) {
      return NextResponse.json(
        { ok: false, error: checkErr.message, hint: "Run the SQL manually in Supabase Dashboard" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, message: "Table already exists" });
  }

  return NextResponse.json({ ok: true });
}
