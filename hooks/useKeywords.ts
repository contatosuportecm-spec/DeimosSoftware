"use client";

import { useState, useEffect, useCallback } from "react";

export interface SpyKeyword {
  id: string;
  keyword: string;
  category: string;
  language: string;
  is_active: boolean;
  total_found: number;
  last_scanned_at: string | null;
  created_at: string;
}

export interface DiscoveryRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "completed" | "failed";
  keywords_scanned: number;
  pages_found: number;
  pages_passed_filter: number;
  offers_created: number;
  offers_skipped: number;
  errors: number;
}

export function useKeywords() {
  const [keywords, setKeywords] = useState<SpyKeyword[]>([]);
  const [lastRuns, setLastRuns] = useState<DiscoveryRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);

  const fetchKeywords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/spy/keywords");
      if (!res.ok) throw new Error("Erro ao buscar keywords");
      const data = await res.json() as SpyKeyword[];
      setKeywords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/spy/discovery");
      if (!res.ok) return;
      const data = await res.json() as DiscoveryRun[];
      setLastRuns(data);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
    fetchRuns();
  }, [fetchKeywords, fetchRuns]);

  const addKeyword = useCallback(async (
    keyword: string,
    category: string = "geral",
    language: string = "pt"
  ): Promise<void> => {
    const res = await fetch("/api/spy/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, category, language }),
    });
    if (!res.ok) {
      const body = await res.json() as { error?: string };
      throw new Error(body.error ?? "Erro ao adicionar keyword");
    }
    const kw = await res.json() as SpyKeyword;
    setKeywords((prev) => [...prev, kw]);
  }, []);

  const toggleKeyword = useCallback(async (id: string, isActive: boolean): Promise<void> => {
    const res = await fetch(`/api/spy/keywords/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error("Erro ao atualizar keyword");
    setKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, is_active: isActive } : k))
    );
  }, []);

  const deleteKeyword = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/spy/keywords/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao deletar keyword");
    setKeywords((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const runDiscovery = useCallback(async (): Promise<void> => {
    setDiscovering(true);
    try {
      const res = await fetch("/api/spy/discovery", { method: "POST" });
      if (!res.ok) throw new Error("Erro no discovery");
      await fetchRuns();
    } finally {
      setDiscovering(false);
    }
  }, [fetchRuns]);

  const stats = {
    total: keywords.length,
    active: keywords.filter((k) => k.is_active).length,
    totalFound: keywords.reduce((s, k) => s + (k.total_found ?? 0), 0),
  };

  return {
    keywords,
    lastRuns,
    loading,
    discovering,
    stats,
    addKeyword,
    toggleKeyword,
    deleteKeyword,
    runDiscovery,
    refetch: fetchKeywords,
  };
}
