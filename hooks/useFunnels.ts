"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type {
  Funnel, FunnelNode, FunnelEdge, FunnelNodeType,
  CreateFunnelInput, FunnelRow, FunnelNodeRow, FunnelEdgeRow,
} from "@/types/funnels";

const TBL_FUNNELS = "funnels" as never;
const TBL_NODES = "funnel_nodes" as never;
const TBL_EDGES = "funnel_edges" as never;

/* ── List hook ── */

export function useFunnels() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await getSupabase()
        .from(TBL_FUNNELS)
        .select("*")
        .order("updated_at", { ascending: false });
      if (err) { setError(err.message); setFunnels([]); return; }
      const rows = (data ?? []) as FunnelRow[];

      // Fetch all nodes for counts + root preview
      const ids = rows.map((r) => r.id);
      let nodeCounts: Record<string, number> = {};
      let previewMap: Record<string, { type: string; label: string }[]> = {};
      if (ids.length > 0) {
        const { data: nodes } = await getSupabase()
          .from(TBL_NODES)
          .select("funnel_id, parent_node_id, type, label, order_index")
          .in("funnel_id", ids)
          .order("order_index");
        if (nodes) {
          for (const n of nodes as { funnel_id: string; parent_node_id: string | null; type: string; label: string }[]) {
            nodeCounts[n.funnel_id] = (nodeCounts[n.funnel_id] || 0) + 1;
            if (n.parent_node_id === null) {
              if (!previewMap[n.funnel_id]) previewMap[n.funnel_id] = [];
              previewMap[n.funnel_id].push({ type: n.type, label: n.label });
            }
          }
        }
      }

      setFunnels(rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        created_at: r.created_at,
        updated_at: r.updated_at,
        node_count: nodeCounts[r.id] ?? 0,
        preview_nodes: (previewMap[r.id] ?? []) as Funnel["preview_nodes"],
      })));
    } catch {
      setError("Failed to load funnels");
      setFunnels([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = useCallback(async (input: CreateFunnelInput): Promise<Funnel> => {
    const { data, error } = await getSupabase()
      .from(TBL_FUNNELS)
      .insert({ name: input.name, description: input.description } as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const row = data as FunnelRow;
    const funnel: Funnel = {
      id: row.id, name: row.name,
      description: row.description ?? undefined,
      created_at: row.created_at, updated_at: row.updated_at,
      node_count: 0,
    };
    setFunnels((prev) => [funnel, ...prev]);
    return funnel;
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await getSupabase().from(TBL_FUNNELS).delete().eq("id", id);
    if (error) throw new Error(error.message);
    setFunnels((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { funnels, loading, error, refetch: fetchAll, create, remove };
}

/* ── Detail hook — loads nodes + edges for a funnel ── */

export function useFunnelDetail(funnelId: string) {
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [allNodes, setAllNodes] = useState<FunnelNode[]>([]);
  const [allEdges, setAllEdges] = useState<FunnelEdge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    const sb = getSupabase();

    const [fRes, nRes, eRes] = await Promise.all([
      sb.from(TBL_FUNNELS).select("*").eq("id", funnelId).single(),
      sb.from(TBL_NODES).select("*").eq("funnel_id", funnelId).order("order_index"),
      sb.from(TBL_EDGES).select("*").eq("funnel_id", funnelId),
    ]);

    if (fRes.error) { console.error("Funnel load error:", fRes.error); setLoading(false); return; }

    const fRow = fRes.data as FunnelRow;
    setFunnel({
      id: fRow.id, name: fRow.name,
      description: fRow.description ?? undefined,
      created_at: fRow.created_at, updated_at: fRow.updated_at,
    });

    const nodeRows = (nRes.data ?? []) as FunnelNodeRow[];
    // Compute has_children
    const parentIds = new Set(nodeRows.filter((n) => n.parent_node_id).map((n) => n.parent_node_id!));
    setAllNodes(nodeRows.map((n) => ({
      id: n.id,
      funnel_id: n.funnel_id,
      parent_node_id: n.parent_node_id,
      type: n.type,
      label: n.label,
      position_x: n.position_x,
      position_y: n.position_y,
      content: n.content,
      metrics: n.metrics as Record<string, unknown>,
      order_index: n.order_index,
      has_children: parentIds.has(n.id),
    })));

    setAllEdges((eRes.data ?? []).map((e: unknown) => {
      const row = e as FunnelEdgeRow;
      return {
        id: row.id,
        funnel_id: row.funnel_id,
        source_node_id: row.source_node_id,
        target_node_id: row.target_node_id,
        label: row.label ?? undefined,
        condition: row.condition ?? undefined,
        source_handle: row.source_handle ?? undefined,
        target_handle: row.target_handle ?? undefined,
      };
    }));

    setLoading(false);
  }, [funnelId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  /* ── Mutations ── */

  const saveFunnel = useCallback(async (patch: { name?: string; description?: string }) => {
    const { data, error } = await getSupabase()
      .from(TBL_FUNNELS)
      .update(patch as never)
      .eq("id", funnelId)
      .select()
      .single();
    if (error) { console.error("Save funnel error:", error); return; }
    const row = data as FunnelRow;
    setFunnel({
      id: row.id, name: row.name,
      description: row.description ?? undefined,
      created_at: row.created_at, updated_at: row.updated_at,
    });
  }, [funnelId]);

  const createNode = useCallback(async (node: {
    parent_node_id: string | null;
    type: FunnelNodeType;
    label: string;
    position_x: number;
    position_y: number;
  }): Promise<FunnelNode> => {
    const payload = { funnel_id: funnelId, ...node, content: {}, metrics: {}, order_index: 0 };
    const { data, error } = await getSupabase()
      .from(TBL_NODES)
      .insert(payload as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const row = data as FunnelNodeRow;
    const newNode: FunnelNode = {
      id: row.id, funnel_id: row.funnel_id,
      parent_node_id: row.parent_node_id,
      type: row.type, label: row.label,
      position_x: row.position_x, position_y: row.position_y,
      content: row.content, metrics: row.metrics as Record<string, unknown>,
      order_index: row.order_index, has_children: false,
    };
    setAllNodes((prev) => [...prev, newNode]);
    return newNode;
  }, [funnelId]);

  const updateNode = useCallback(async (nodeId: string, patch: Partial<FunnelNodeRow>) => {
    // Optimistic update
    setAllNodes((prev) => prev.map((n) => n.id === nodeId ? { ...n, ...patch } : n));
    const { error } = await getSupabase()
      .from(TBL_NODES)
      .update(patch as never)
      .eq("id", nodeId);
    if (error) console.error("Update node error:", error);
  }, []);

  // Position save — updates allNodes so the position survives drilling out/in
  // without a page reload (called once on drag stop, so no re-render storm).
  const savePosition = useCallback(async (nodeId: string, x: number, y: number) => {
    setAllNodes((prev) => prev.map((n) => n.id === nodeId ? { ...n, position_x: x, position_y: y } : n));
    const { error } = await getSupabase()
      .from(TBL_NODES)
      .update({ position_x: x, position_y: y } as never)
      .eq("id", nodeId);
    if (error) console.error("Save position error:", error);
  }, []);

  const deleteNode = useCallback(async (nodeId: string) => {
    // Remove node and all descendants
    const descendants = getDescendants(nodeId, allNodes);
    const idsToRemove = new Set([nodeId, ...descendants.map((n) => n.id)]);

    setAllNodes((prev) => prev.filter((n) => !idsToRemove.has(n.id)));
    setAllEdges((prev) => prev.filter((e) => !idsToRemove.has(e.source_node_id) && !idsToRemove.has(e.target_node_id)));

    const { error } = await getSupabase()
      .from(TBL_NODES)
      .delete()
      .eq("id", nodeId);
    if (error) console.error("Delete node error:", error);
  }, [allNodes]);

  const createEdge = useCallback(async (source: string, target: string, label?: string, sourceHandle?: string, targetHandle?: string): Promise<FunnelEdge> => {
    const payload = { funnel_id: funnelId, source_node_id: source, target_node_id: target, label, source_handle: sourceHandle, target_handle: targetHandle };
    const { data, error } = await getSupabase()
      .from(TBL_EDGES)
      .insert(payload as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const row = data as FunnelEdgeRow;
    const edge: FunnelEdge = {
      id: row.id, funnel_id: row.funnel_id,
      source_node_id: row.source_node_id, target_node_id: row.target_node_id,
      label: row.label ?? undefined,
      source_handle: row.source_handle ?? undefined,
      target_handle: row.target_handle ?? undefined,
    };
    setAllEdges((prev) => [...prev, edge]);
    return edge;
  }, [funnelId]);

  const deleteEdge = useCallback(async (edgeId: string) => {
    setAllEdges((prev) => prev.filter((e) => e.id !== edgeId));
    const { error } = await getSupabase()
      .from(TBL_EDGES)
      .delete()
      .eq("id", edgeId);
    if (error) console.error("Delete edge error:", error);
  }, []);

  return {
    funnel, allNodes, allEdges, loading,
    saveFunnel, createNode, updateNode, savePosition, deleteNode,
    createEdge, deleteEdge, refetch: fetchDetail,
  };
}

/* ── Helpers ── */

function getDescendants(nodeId: string, allNodes: FunnelNode[]): FunnelNode[] {
  const children = allNodes.filter((n) => n.parent_node_id === nodeId);
  return children.flatMap((c) => [c, ...getDescendants(c.id, allNodes)]);
}

/** Get nodes at a specific level (filtered by parent_node_id) */
export function getNodesAtLevel(allNodes: FunnelNode[], parentId: string | null): FunnelNode[] {
  return allNodes.filter((n) => n.parent_node_id === parentId);
}

/** Get edges relevant to a specific level */
export function getEdgesAtLevel(allEdges: FunnelEdge[], nodeIds: Set<string>): FunnelEdge[] {
  return allEdges.filter((e) => nodeIds.has(e.source_node_id) && nodeIds.has(e.target_node_id));
}

/** Count descendants of a node */
export function countDescendants(nodeId: string, allNodes: FunnelNode[]): number {
  return getDescendants(nodeId, allNodes).length;
}
