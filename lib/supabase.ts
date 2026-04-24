import { createClient } from "@supabase/supabase-js";

// Client para uso no browser (Client Components) — lazy para evitar erro de build sem env
let _browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_browserClient) {
    _browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _browserClient;
}

// Atalho para compatibilidade
export const supabase = {
  get from() { return getSupabase().from.bind(getSupabase()); },
};

// Client para uso no servidor (Server Components / API Routes)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
