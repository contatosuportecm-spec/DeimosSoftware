"use client";

import { useState, useEffect } from "react";
import { Niche } from "@/types";

export function useNiches() {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNiches() {
      try {
        const res = await fetch("/api/niches");
        if (!res.ok) throw new Error("Erro ao buscar nichos");
        const data = await res.json() as Niche[];
        setNiches(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchNiches();
  }, []);

  return { niches, loading, error };
}
