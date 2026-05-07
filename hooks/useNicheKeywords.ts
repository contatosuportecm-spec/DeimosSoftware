"use client";

import { useMemo } from "react";
import { useKeywords, SpyKeyword } from "./useKeywords";
import { useNiches } from "./useNiches";
import { Niche } from "@/types";

export interface NicheKeywordGroup {
  niche: Niche | null; // null = grupo "Gerais" (niche_id IS NULL)
  keywords: SpyKeyword[];
}

export function useNicheKeywords() {
  const { keywords, loading: kwLoading, addKeyword, deleteKeyword, toggleKeyword } = useKeywords();
  const { niches,   loading: nLoading } = useNiches();

  const groups = useMemo<NicheKeywordGroup[]>(() => {
    const byNicheId = new Map<string | null, SpyKeyword[]>();
    for (const kw of keywords) {
      const key = kw.niche_id ?? null;
      const list = byNicheId.get(key) ?? [];
      list.push(kw);
      byNicheId.set(key, list);
    }

    const result: NicheKeywordGroup[] = niches
      .filter((n) => n.is_active !== false)
      .map((n) => ({ niche: n, keywords: byNicheId.get(n.id) ?? [] }));

    const general = byNicheId.get(null) ?? [];
    if (general.length > 0) {
      result.push({ niche: null, keywords: general });
    }

    return result;
  }, [keywords, niches]);

  return {
    groups,
    niches,
    loading: kwLoading || nLoading,
    addKeyword,
    deleteKeyword,
    toggleKeyword,
  };
}
