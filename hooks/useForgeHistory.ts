"use client";

import { useState, useEffect, useCallback } from "react";
import { ForgeGeneration, ForgeCategory } from "@/types/forge";
import { getSupabase } from "@/lib/supabase";

export function useForgeHistory(category?: ForgeCategory, limit = 20) {
  const [generations, setGenerations] = useState<ForgeGeneration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();

    let query = supabase
      .from("forge_generations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq("category", category);
    }

    const { data } = await query;
    setGenerations((data as ForgeGeneration[]) || []);
    setLoading(false);
  }, [category, limit]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { generations, loading, refetch: fetch_ };
}
