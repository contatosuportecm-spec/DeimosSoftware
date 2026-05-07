"use client";

import { useState, useEffect, useCallback } from "react";

interface ApiKeyEntry {
  id: string;
  provider_id: string;
  label: string;
  created_at: string;
}

export function useForgeKeys() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/forge/keys");
    if (res.ok) {
      setKeys(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const saveKey = useCallback(async (providerId: string, apiKey: string) => {
    const res = await fetch("/api/forge/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider_id: providerId, api_key: apiKey }),
    });
    if (res.ok) {
      await fetchKeys();
      return true;
    }
    return false;
  }, [fetchKeys]);

  const deleteKey = useCallback(async (providerId: string) => {
    const res = await fetch("/api/forge/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider_id: providerId }),
    });
    if (res.ok) {
      await fetchKeys();
      return true;
    }
    return false;
  }, [fetchKeys]);

  const hasKey = useCallback((providerId: string) => {
    return keys.some((k) => k.provider_id === providerId);
  }, [keys]);

  return { keys, loading, saveKey, deleteKey, hasKey, refetch: fetchKeys };
}
