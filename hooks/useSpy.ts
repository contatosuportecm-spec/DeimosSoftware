"use client";

import { useState, useEffect, useCallback } from "react";
import { Country, OfferWithSnapshots, OfferTag } from "@/types";

export function useSpy() {
  const [offers, setOffers]     = useState<OfferWithSnapshots[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [scrapingAll, setScrapingAll] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/spy/offers");
      if (!res.ok) throw new Error("Erro ao buscar ofertas");
      const data = await res.json() as OfferWithSnapshots[];
      setOffers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const addOffer = useCallback(async (
    name: string,
    libraryUrl: string,
    country: Country,
    niche: string,
    tag: OfferTag | null = null,
  ): Promise<void> => {
    const res = await fetch("/api/spy/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, library_url: libraryUrl, country, niche, tag }),
    });

    if (!res.ok) {
      const body = await res.json() as { error?: string };
      throw new Error(body.error ?? "Erro ao adicionar oferta");
    }

    const newOffer = await res.json() as OfferWithSnapshots;
    setOffers((prev) => [newOffer, ...prev]);
  }, []);

  const scrapeNow = useCallback(async (offerId: string): Promise<void> => {
    setScrapingId(offerId);
    try {
      const res = await fetch("/api/spy/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: offerId }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Erro ao atualizar");
      }
      // Refetch para pegar o novo snapshot e status atualizado
      await fetchOffers();
    } finally {
      setScrapingId(null);
    }
  }, [fetchOffers]);

  const scrapeAll = useCallback(async (): Promise<void> => {
    setScrapingAll(true);
    try {
      const active = offers.filter((o) => o.status !== "archived" && o.page_id);
      for (const offer of active) {
        try {
          await fetch("/api/spy/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ offer_id: offer.id }),
          });
        } catch {
          // continua mesmo se uma falhar
        }
      }
      await fetchOffers();
    } finally {
      setScrapingAll(false);
    }
  }, [offers, fetchOffers]);

  const addManualSnapshot = useCallback(async (
    offerId: string,
    activeAdsCount: number,
  ): Promise<void> => {
    const res = await fetch(`/api/spy/offers/${offerId}/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active_ads_count: activeAdsCount }),
    });
    if (!res.ok) {
      const body = await res.json() as { error?: string };
      throw new Error(body.error ?? "Erro ao salvar valor");
    }
    await fetchOffers();
  }, [fetchOffers]);

  const archiveOffer = useCallback(async (offerId: string): Promise<void> => {
    const res = await fetch(`/api/spy/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    if (!res.ok) throw new Error("Erro ao arquivar");
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: "archived" } : o))
    );
  }, []);

  const setOfferTag = useCallback(async (
    offerId: string,
    tag: OfferTag | null,
  ): Promise<void> => {
    // Atualização otimista
    setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, tag } : o)));
    const res = await fetch(`/api/spy/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    });
    if (!res.ok) {
      // Reverte buscando estado real do servidor
      await fetchOffers();
      throw new Error("Erro ao salvar tag");
    }
  }, [fetchOffers]);

  // Stats resumidas
  const stats = {
    total:    offers.filter((o) => o.status !== "archived").length,
    dying:    offers.filter((o) => o.status === "dying").length,
    new:      offers.filter((o) => o.status === "new").length,
  };

  return {
    offers,
    loading,
    error,
    scrapingId,
    stats,
    addOffer,
    scrapeNow,
    scrapeAll,
    scrapingAll,
    addManualSnapshot,
    archiveOffer,
    setOfferTag,
    refetch: fetchOffers,
  };
}
