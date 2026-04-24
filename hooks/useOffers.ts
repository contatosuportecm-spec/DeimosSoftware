"use client";

import { useState, useEffect, useCallback } from "react";
import { Offer, OfferStatus } from "@/types";

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/offers");
      if (!res.ok) throw new Error("Erro ao buscar ofertas");
      const data = await res.json() as Offer[];
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

  const createOffer = useCallback(async (offer: Partial<Offer>) => {
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(offer),
    });
    if (!res.ok) throw new Error("Erro ao criar oferta");
    const newOffer = await res.json() as Offer;
    setOffers((prev) => [newOffer, ...prev]);
    return newOffer;
  }, []);

  const updateOfferStatus = useCallback(async (id: string, status: OfferStatus) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  }, []);

  return { offers, loading, error, createOffer, updateOfferStatus, refetch: fetchOffers };
}
