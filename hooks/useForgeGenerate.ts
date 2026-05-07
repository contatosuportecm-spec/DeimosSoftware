"use client";

import { useState, useCallback, useRef } from "react";
import { ForgeGeneration, GenerateRequest } from "@/types/forge";

export function useForgeGenerate() {
  const [generation, setGeneration] = useState<ForgeGeneration | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback((id: string) => {
    stopPolling();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/forge/status?id=${id}`);
        if (!res.ok) return;

        const data: ForgeGeneration = await res.json();
        setGeneration(data);

        if (data.status === "completed" || data.status === "failed") {
          stopPolling();
          if (data.status === "failed") {
            setError(data.error || "Geração falhou");
          }
        }
      } catch {
        // continue polling
      }
    }, 2500);
  }, [stopPolling]);

  const generate = useCallback(async (request: GenerateRequest) => {
    setSubmitting(true);
    setError(null);
    setGeneration(null);
    stopPolling();

    try {
      const res = await fetch("/api/forge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao gerar");
        setSubmitting(false);
        return null;
      }

      setGeneration(data);
      setSubmitting(false);

      // Start polling if not already completed
      if (data.status !== "completed") {
        startPolling(data.id);
      }

      return data as ForgeGeneration;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede");
      setSubmitting(false);
      return null;
    }
  }, [startPolling, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setGeneration(null);
    setError(null);
    setSubmitting(false);
  }, [stopPolling]);

  const isLoading = submitting || (generation?.status === "pending" || generation?.status === "processing");

  return { generation, generate, reset, submitting, isLoading, error };
}
