"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Funnel, CreateFunnelInput, FunnelStage, FunnelConnection, StageType } from "@/types/funnels";
import { DEFAULT_CHILDREN, DEFAULT_CONNECTIONS, STAGE_META } from "@/types/funnels";

function buildDefaultStages(): FunnelStage[] {
  const types: StageType[] = ["sales-page", "vsl", "quiz", "email-whatsapp", "checkout", "venda", "recusado"];
  return types.map((type) => ({
    id: type,
    type,
    label: STAGE_META[type].label,
    children: DEFAULT_CHILDREN[type].map((c) => ({ ...c })),
  }));
}

function buildDefaultConnections(): FunnelConnection[] {
  return DEFAULT_CONNECTIONS.map((c) => ({ from: c.from, to: c.to, label: c.label, type: c.type }));
}

function parseFunnel(row: Record<string, unknown>): Funnel {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    stages: Array.isArray(row.stages) ? row.stages as FunnelStage[] :
            Array.isArray(row.nodes) ? [] : [],
    connections: Array.isArray(row.connections) ? row.connections as FunnelConnection[] : [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function useFunnels() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await getSupabase()
        .from("funnels" as never)
        .select("*")
        .order("updated_at", { ascending: false });
      if (err) { setError(err.message); setFunnels([]); }
      else setFunnels(((data ?? []) as Record<string, unknown>[]).map(parseFunnel));
    } catch {
      setError("Failed to load funnels");
      setFunnels([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = useCallback(async (input: CreateFunnelInput) => {
    const payload = {
      name: input.name,
      description: input.description,
      nodes: buildDefaultStages(),    // stored in nodes JSONB column
      edges: buildDefaultConnections(), // stored in edges JSONB column
    };
    const { data, error } = await getSupabase()
      .from("funnels" as never)
      .insert(payload as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const funnel = parseFunnelFromRow(data as Record<string, unknown>);
    setFunnels((prev) => [funnel, ...prev]);
    return funnel;
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await getSupabase().from("funnels" as never).delete().eq("id", id);
    if (error) throw new Error(error.message);
    setFunnels((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { funnels, loading, error, refetch: fetchAll, create, remove };
}

// Map DB columns (nodes/edges) to our Funnel type (stages/connections)
function parseFunnelFromRow(row: Record<string, unknown>): Funnel {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    stages: Array.isArray(row.nodes) ? row.nodes as FunnelStage[] : buildDefaultStages(),
    connections: Array.isArray(row.edges) ? row.edges as FunnelConnection[] : buildDefaultConnections(),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function useFunnelDetail(id: string) {
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await getSupabase()
        .from("funnels" as never)
        .select("*")
        .eq("id", id)
        .single();
      if (error) { console.error("Funnel detail error:", error); setLoading(false); return; }
      setFunnel(parseFunnelFromRow(data as Record<string, unknown>));
      setLoading(false);
    })();
  }, [id]);

  const save = useCallback(
    async (patch: { stages?: FunnelStage[]; connections?: FunnelConnection[]; name?: string; description?: string }) => {
      const dbPatch: Record<string, unknown> = {};
      if (patch.stages) dbPatch.nodes = patch.stages;
      if (patch.connections) dbPatch.edges = patch.connections;
      if (patch.name) dbPatch.name = patch.name;
      if (patch.description !== undefined) dbPatch.description = patch.description;

      const { data, error } = await getSupabase()
        .from("funnels" as never)
        .update(dbPatch as never)
        .eq("id", id)
        .select()
        .single();
      if (error) console.error("Funnel save error:", error);
      if (data) setFunnel(parseFunnelFromRow(data as Record<string, unknown>));
    },
    [id]
  );

  return { funnel, loading, save, setFunnel };
}
