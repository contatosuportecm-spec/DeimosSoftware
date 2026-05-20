"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  AutoresearchCampaign,
  CampaignWithRounds,
  CreateCampaignInput,
  AutoresearchRound,
} from "@/types/autoresearch";

export type CampaignWithLatest = AutoresearchCampaign & {
  latest_round: AutoresearchRound | null;
  rounds: AutoresearchRound[];
};

export function useAutoresearch() {
  const [campaigns, setCampaigns] = useState<CampaignWithLatest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/autoresearch/campaigns");
      if (!res.ok) throw new Error("Erro ao buscar campanhas");
      const data = (await res.json()) as CampaignWithLatest[];
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Auto-poll dashboard when there are active campaigns
  useEffect(() => {
    if (!campaigns.some((c) => c.status === "active")) return;
    const interval = setInterval(fetchCampaigns, 3000);
    return () => clearInterval(interval);
  }, [campaigns, fetchCampaigns]);

  const createCampaign = useCallback(
    async (input: CreateCampaignInput): Promise<AutoresearchCampaign> => {
      const res = await fetch("/api/autoresearch/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Erro ao criar campanha");
      }
      const newCampaign = (await res.json()) as AutoresearchCampaign;
      setCampaigns((prev) => [{ ...newCampaign, latest_round: null, rounds: [] }, ...prev]);
      return newCampaign;
    },
    []
  );

  const deleteCampaign = useCallback(
    async (id: string): Promise<void> => {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      const res = await fetch(`/api/autoresearch/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) {
        await fetchCampaigns();
        throw new Error("Erro ao deletar campanha");
      }
    },
    [fetchCampaigns]
  );

  const startCampaign = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/autoresearch/campaigns/${id}/start`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao iniciar campanha");
      await fetchCampaigns();
      // Fire advance in background so the first round starts
      fetch(`/api/autoresearch/campaigns/${id}/advance`, { method: "POST" })
        .then(() => fetchCampaigns())
        .catch(() => {});
    },
    [fetchCampaigns]
  );

  const pauseCampaign = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/autoresearch/campaigns/${id}/pause`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao pausar campanha");
      await fetchCampaigns();
    },
    [fetchCampaigns]
  );

  const approveCampaign = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/autoresearch/campaigns/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao aprovar round");
      await fetchCampaigns();
    },
    [fetchCampaigns]
  );

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    totalRounds: campaigns.reduce((sum, c) => sum + c.iteration_count, 0),
    bestImprovement: campaigns.reduce((best, c) => {
      if (!c.baseline_play_rate || !c.best_play_rate) return best;
      const imp = ((c.best_play_rate - c.baseline_play_rate) / c.baseline_play_rate) * 100;
      return Math.max(best, imp);
    }, 0),
  };

  return {
    campaigns,
    loading,
    error,
    stats,
    createCampaign,
    deleteCampaign,
    startCampaign,
    pauseCampaign,
    approveCampaign,
    refetch: fetchCampaigns,
  };
}

export function useCampaignDetail(id: string) {
  const [campaign, setCampaign] = useState<CampaignWithRounds | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/autoresearch/campaigns/${id}`);
      if (!res.ok) throw new Error("Erro ao buscar campanha");
      const data = (await res.json()) as CampaignWithRounds;
      setCampaign(data);
    } catch {
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Two loops when active:
  // 1. Advance loop: fires advance calls (slow, waits for LLM)
  // 2. Refetch loop: polls DB every 2s so UI updates fast
  useEffect(() => {
    if (!campaign || campaign.status !== "active") return;
    let cancelled = false;
    let advancing = false;

    // Advance loop — keeps calling advance until campaign stops being active
    const advanceLoop = async () => {
      if (advancing || cancelled) return;
      advancing = true;
      try {
        const res = await fetch(`/api/autoresearch/campaigns/${id}/advance`, { method: "POST" });
        if (cancelled) { advancing = false; return; }
        const result = await res.json();
        const action = result?.action;
        console.log("[autoresearch] advance:", action, result?.detail?.slice?.(0, 80));

        // After a round completes, immediately advance to create the next round
        if ((action === "decided" || action === "created" || action === "generated" || action === "deployed") && !cancelled) {
          advancing = false;
          // Small delay to let DB settle, then immediately advance again
          setTimeout(() => advanceLoop(), 500);
          return;
        }
      } catch (err) {
        console.error("[autoresearch] advance error:", err);
      }
      advancing = false;
    };

    // Fire immediately, then poll as backup every 10s
    advanceLoop();
    const advanceInterval = setInterval(advanceLoop, 10000);

    // Refetch loop — fast polling so UI shows status changes quickly
    const refetchInterval = setInterval(() => {
      if (!cancelled) fetchDetail();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(advanceInterval);
      clearInterval(refetchInterval);
    };
  }, [campaign?.status, id, fetchDetail]);

  const advance = useCallback(async () => {
    const res = await fetch(`/api/autoresearch/campaigns/${id}/advance`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Erro ao avancar campanha");
    const result = await res.json();
    await fetchDetail();
    return result;
  }, [id, fetchDetail]);

  return { campaign, loading, refetch: fetchDetail, advance };
}
