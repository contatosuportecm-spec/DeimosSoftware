"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ForgeGeneration, ForgeCategory } from "@/types/forge";
import { getSupabase } from "@/lib/supabase";

const ORPHAN_AGE_MS = 8000; // só sincroniza items com mais de ~8s pra evitar corrida com o polling do componente ativo

export function useForgeHistory(category?: ForgeCategory, limit = 20) {
  const [generations, setGenerations] = useState<ForgeGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch_ = useCallback(async () => {
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
    const list = (data as ForgeGeneration[]) || [];
    setGenerations(list);
    setLoading(false);
    return list;
  }, [category, limit]);

  // Sync passivo: pra cada item ainda em pending/processing, força um GET no /api/forge/status
  // que faz polling no provider e fecha o registro. Resolve generations órfãs (tab fechada / reload).
  const syncOrphans = useCallback(async (list: ForgeGeneration[]) => {
    const now = Date.now();
    const orphans = list.filter((g) => {
      if (g.status !== "pending" && g.status !== "processing") return false;
      if (!g.request_id) return false;
      const age = now - new Date(g.created_at).getTime();
      return age > ORPHAN_AGE_MS;
    });

    if (orphans.length === 0) return false;

    const results = await Promise.all(
      orphans.map((g) =>
        fetch(`/api/forge/status?id=${g.id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    );

    const anyClosed = results.some(
      (r) => r && (r.status === "completed" || r.status === "failed"),
    );
    return anyClosed;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const list = await fetch_();
      if (cancelled) return;

      const hasOpen = list.some(
        (g) => g.status === "pending" || g.status === "processing",
      );

      if (hasOpen) {
        const closed = await syncOrphans(list);
        if (closed && !cancelled) await fetch_();
      } else if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };

    tick();
    syncIntervalRef.current = setInterval(tick, 5000);

    return () => {
      cancelled = true;
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [fetch_, syncOrphans]);

  return { generations, loading, refetch: fetch_ };
}
