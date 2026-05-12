"use client";

import { useState, useEffect, useCallback } from "react";
import { OfferBriefing, CreateOfferBriefingInput } from "@/types";

export function useOfferBriefings() {
  const [briefings, setBriefings] = useState<OfferBriefing[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchBriefings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/offer-briefings");
      if (!res.ok) throw new Error("Erro ao buscar briefings");
      const data = await res.json() as OfferBriefing[];
      setBriefings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefings();
  }, [fetchBriefings]);

  const createBriefing = useCallback(async (input: CreateOfferBriefingInput): Promise<OfferBriefing> => {
    const res = await fetch("/api/offer-briefings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const body = await res.json() as { error?: string };
      throw new Error(body.error ?? "Erro ao criar briefing");
    }

    const newBriefing = await res.json() as OfferBriefing;
    setBriefings((prev) => [newBriefing, ...prev]);
    return newBriefing;
  }, []);

  const updateBriefing = useCallback(async (id: string, updates: Partial<OfferBriefing>): Promise<OfferBriefing> => {
    // Optimistic update
    setBriefings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );

    const res = await fetch(`/api/offer-briefings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      // Revert on error
      await fetchBriefings();
      const body = await res.json() as { error?: string };
      throw new Error(body.error ?? "Erro ao atualizar briefing");
    }

    const updated = await res.json() as OfferBriefing;
    setBriefings((prev) =>
      prev.map((b) => (b.id === id ? updated : b))
    );
    return updated;
  }, [fetchBriefings]);

  const deleteBriefing = useCallback(async (id: string): Promise<void> => {
    // Optimistic delete
    setBriefings((prev) => prev.filter((b) => b.id !== id));

    const res = await fetch(`/api/offer-briefings/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      await fetchBriefings();
      throw new Error("Erro ao deletar briefing");
    }
  }, [fetchBriefings]);

  const stats = {
    total:        briefings.length,
    draft:        briefings.filter((b) => b.status === "draft").length,
    active:       briefings.filter((b) => b.status === "active").length,
    paused:       briefings.filter((b) => b.status === "paused").length,
    totalRevenue: briefings.reduce((sum, b) => sum + Number(b.revenue || 0), 0),
    totalSales:   briefings.reduce((sum, b) => sum + Number(b.sales_count || 0), 0),
  };

  return {
    briefings,
    loading,
    error,
    stats,
    createBriefing,
    updateBriefing,
    deleteBriefing,
    refetch: fetchBriefings,
  };
}
