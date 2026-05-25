"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background, BackgroundVariant, SelectionMode,
  type Node, type Edge, type Connection, type OnNodesChange, type OnEdgesChange,
  applyNodeChanges, applyEdgeChanges,
  useReactFlow, ReactFlowProvider, ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";

import { BaseNode, type BaseNodeData } from "./BaseNode";
import { DeletableEdge } from "./DeletableEdge";
import FunnelBreadcrumb, { type BreadcrumbItem } from "./Breadcrumb";
import AddNodeMenu from "./AddNodeMenu";
import NodeInspector from "./NodeInspector";
import { getNodesAtLevel, getEdgesAtLevel, countDescendants } from "@/hooks/useFunnels";
import { NODE_TYPE_META, type FunnelNode, type FunnelEdge, type FunnelNodeType, type AggregatedMetrics } from "@/types/funnels";

const nodeTypes = { base: BaseNode };
const edgeTypes = { deletable: DeletableEdge };

interface FunnelCanvasProps {
  allNodes: FunnelNode[];
  allEdges: FunnelEdge[];
  onCreateNode: (node: {
    parent_node_id: string | null;
    type: FunnelNodeType;
    label: string;
    position_x: number;
    position_y: number;
  }) => Promise<FunnelNode>;
  onUpdateNode: (nodeId: string, patch: Record<string, unknown>) => void;
  onSavePosition: (nodeId: string, x: number, y: number) => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateEdge: (source: string, target: string, label?: string, sourceHandle?: string, targetHandle?: string) => Promise<FunnelEdge>;
  onDeleteEdge: (edgeId: string) => void;
  initialPath?: string[];
}

/** Compute aggregated metrics for a container node from its children */
function computeAggregatedMetrics(nodeId: string, nodeType: FunnelNodeType, allNodes: FunnelNode[]): AggregatedMetrics {
  const children = allNodes.filter((n) => n.parent_node_id === nodeId);
  if (children.length === 0) return {};

  const avg = (key: string): number | undefined => {
    const vals = children.map((c) => (c.metrics as Record<string, unknown>)[key]).filter((v) => typeof v === "number") as number[];
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined;
  };

  switch (nodeType) {
    case "vsl":
      return {
        playrate: avg("playrate"),
        retention_media: avg("retention"),
        ctr_botoes: avg("ctr"),
      };
    case "sales_page":
      return { ctr_medio: avg("ctr") };
    case "email":
    case "whatsapp":
      return { open_rate_medio: avg("open_rate"), click_rate_medio: avg("click_rate") };
    case "upsell":
    case "downsell": {
      // Aggregate from the inner container's children
      const innerContainer = children[0];
      if (innerContainer) return computeAggregatedMetrics(innerContainer.id, innerContainer.type, allNodes);
      return {};
    }
    default:
      return {};
  }
}

function FunnelCanvasInner({
  allNodes, allEdges,
  onCreateNode, onUpdateNode, onSavePosition, onDeleteNode,
  onCreateEdge, onDeleteEdge,
  initialPath,
}: FunnelCanvasProps) {
  const { fitView, getViewport } = useReactFlow();

  const [path, setPath] = useState<string[]>(initialPath ?? []);
  const currentParentId = path.length > 0 ? path[path.length - 1] : null;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = allNodes.find((n) => n.id === selectedNodeId) ?? null;

  const posTimer = useRef<NodeJS.Timeout>();

  const currentParentNode = currentParentId ? allNodes.find((n) => n.id === currentParentId) : null;

  const levelNodes = useMemo(() => getNodesAtLevel(allNodes, currentParentId), [allNodes, currentParentId]);
  const levelNodeIds = useMemo(() => new Set(levelNodes.map((n) => n.id)), [levelNodes]);
  const levelEdges = useMemo(() => getEdgesAtLevel(allEdges, levelNodeIds), [allEdges, levelNodeIds]);

  // Drill-down
  const handleDrillDown = useCallback((nodeId: string) => {
    setPath((prev) => [...prev, nodeId]);
    setSelectedNodeId(null);
  }, []);

  // Delete from node button
  const handleNodeDelete = useCallback((nodeId: string) => {
    onDeleteNode(nodeId);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [onDeleteNode, selectedNodeId]);

  // Aggregated metrics for containers
  const aggregatedMetricsMap = useMemo(() => {
    const map: Record<string, AggregatedMetrics> = {};
    for (const n of levelNodes) {
      if (NODE_TYPE_META[n.type]?.category === "container") {
        map[n.id] = computeAggregatedMetrics(n.id, n.type, allNodes);
      }
    }
    return map;
  }, [levelNodes, allNodes]);

  // Children summaries for container cards
  const childrenMap = useMemo(() => {
    const map: Record<string, import("./BaseNode").ChildSummary[]> = {};
    for (const n of levelNodes) {
      const kids = allNodes
        .filter((c) => c.parent_node_id === n.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map((c) => ({
          id: c.id,
          type: c.type,
          label: c.label,
          metrics: c.metrics,
          content: c.content,
          childCount: allNodes.filter((gc) => gc.parent_node_id === c.id).length,
        }));
      if (kids.length > 0) map[n.id] = kids;
    }
    return map;
  }, [levelNodes, allNodes]);

  // Select a child node (from sub-line click) without changing level
  const handleSelectChild = useCallback((childId: string) => {
    setSelectedNodeId(childId);
  }, []);

  // Quick-add refs
  const quickAddSource = useRef<string | null>(null);
  const quickAddRef = useRef<(sourceId: string) => void>(() => {});

  // Inline metric update
  const handleUpdateMetric = useCallback((nodeId: string, key: string, value: number | null) => {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) return;
    const newMetrics = { ...(node.metrics as Record<string, unknown>), [key]: value };
    onUpdateNode(nodeId, { metrics: newMetrics });
  }, [allNodes, onUpdateNode]);

  // Content update (for inline editing in button_answer/text_answer)
  const handleUpdateContent = useCallback((nodeId: string, content: Record<string, unknown>) => {
    onUpdateNode(nodeId, { content });
  }, [onUpdateNode]);

  // Delete edges by handle (when removing a button_answer option)
  const handleDeleteEdgesByHandle = useCallback((nodeId: string, handleId: string) => {
    const toDelete = allEdges.filter((e) => e.source_node_id === nodeId && e.source_handle === handleId);
    for (const e of toDelete) {
      onDeleteEdge(e.id);
    }
  }, [allEdges, onDeleteEdge]);

  // Build ReactFlow nodes
  const rfNodesFromDB: Node<BaseNodeData>[] = useMemo(
    () => levelNodes.map((n) => ({
      id: n.id,
      type: "base",
      position: { x: n.position_x, y: n.position_y },
      data: {
        id: n.id,
        type: n.type,
        label: n.label,
        content: n.content,
        metrics: n.metrics,
        aggregatedMetrics: aggregatedMetricsMap[n.id],
        children: childrenMap[n.id],
        has_children: n.has_children ?? false,
        onDrillDown: handleDrillDown,
        onDelete: handleNodeDelete,
        onSelectChild: handleSelectChild,
        onUpdateMetric: handleUpdateMetric,
        onUpdateContent: handleUpdateContent,
        onDeleteEdgesByHandle: handleDeleteEdgesByHandle,
        onQuickAdd: (id: string) => quickAddRef.current(id),
        parentType: currentParentNode?.type ?? null,
      },
    })),
    [levelNodes, handleDrillDown, handleNodeDelete, handleSelectChild, handleUpdateMetric, aggregatedMetricsMap, childrenMap, currentParentNode]
  );

  const [rfNodes, setRfNodes] = useState<Node<BaseNodeData>[]>(rfNodesFromDB);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);

  // Quick-add: open menu next to source node
  quickAddRef.current = (sourceId: string) => {
    const sourceNode = rfNodes.find((n) => n.id === sourceId);
    if (!sourceNode) return;
    quickAddSource.current = sourceId;
    const vp = getViewport();
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const bounds = canvasEl.getBoundingClientRect();
    const screenX = bounds.left + (sourceNode.position.x + 300) * vp.zoom + vp.x;
    const screenY = bounds.top + (sourceNode.position.y + 40) * vp.zoom + vp.y;
    contextFlowPos.current = {
      x: sourceNode.position.x + 320,
      y: sourceNode.position.y,
    };
    setContextMenu({ x: screenX, y: screenY });
  };

  // Sync DB → local: only when node set changes (add/remove/data), not on position saves
  const prevNodeKeyRef = useRef("");
  useEffect(() => {
    // Build a key from IDs + labels + types + content/metrics (but NOT positions)
    const key = rfNodesFromDB.map((n) => `${n.id}:${n.data.type}:${n.data.label}:${JSON.stringify(n.data.children?.length ?? 0)}`).join("|");
    if (key === prevNodeKeyRef.current) return;
    prevNodeKeyRef.current = key;

    setRfNodes((prev) => {
      const prevMap = new Map(prev.map((n) => [n.id, n]));
      return rfNodesFromDB.map((dbNode) => {
        const local = prevMap.get(dbNode.id);
        if (local) {
          return { ...dbNode, position: local.position };
        }
        return dbNode;
      });
    });
  }, [rfNodesFromDB]);
  useEffect(() => {
    setRfEdges(levelEdges.map((e) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      sourceHandle: e.source_handle,
      targetHandle: e.target_handle,
      label: e.label,
      type: "deletable",
      data: { onDelete: onDeleteEdge },
    })));
  }, [levelEdges]);

  // Breadcrumb
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ id: null, label: "Funil" }];
    for (const nodeId of path) {
      const node = allNodes.find((n) => n.id === nodeId);
      items.push({ id: nodeId, label: node?.label ?? "..." });
    }
    return items;
  }, [path, allNodes]);

  // Fit view only on first load of a level, not on re-renders
  const hasInitRef = useRef<string | null>(null);
  useEffect(() => {
    const levelKey = currentParentId ?? "__root__";
    if (hasInitRef.current !== levelKey) {
      hasInitRef.current = levelKey;
      setTimeout(() => fitView({ padding: 0.3, duration: 0 }), 80);
    }
  }, [currentParentId, fitView]);

  const handleBreadcrumbNav = useCallback((nodeId: string | null) => {
    if (nodeId === null) setPath([]);
    else {
      const idx = path.indexOf(nodeId);
      if (idx >= 0) setPath(path.slice(0, idx + 1));
    }
    setSelectedNodeId(null);
  }, [path]);

  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    const allowed = changes.filter((c) => c.type === "position" || c.type === "select" || c.type === "dimensions");
    if (allowed.length > 0) {
      setRfNodes((nds) => applyNodeChanges(allowed, nds));
    }
    // Silent position save — no state update, just DB write
    for (const change of changes) {
      if (change.type === "position" && change.position && !change.dragging) {
        clearTimeout(posTimer.current);
        const id = change.id;
        const pos = change.position;
        posTimer.current = setTimeout(() => {
          onSavePosition(id, pos.x, pos.y);
        }, 800);
      }
    }
  }, [onSavePosition]);

  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    setRfEdges((eds) => applyEdgeChanges(changes, eds));
    for (const change of changes) {
      if (change.type === "remove") onDeleteEdge(change.id);
    }
  }, [onDeleteEdge]);

  const handleConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      onCreateEdge(
        connection.source,
        connection.target,
        undefined,
        connection.sourceHandle ?? undefined,
        connection.targetHandle ?? undefined,
      );
    }
  }, [onCreateEdge]);

  // Prevent self-loops
  const isValidConnection = useCallback((connection: Connection) => {
    return connection.source !== connection.target;
  }, []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setContextMenu(null);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu(null);
  }, []);

  // Double-click context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const contextFlowPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Listen for double-click on the pane only (not nodes)
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only trigger if clicking directly on the pane background
      if (!target.classList.contains("react-flow__pane")) return;
      quickAddSource.current = null;
      const vp = getViewport();
      const bounds = el.getBoundingClientRect();
      contextFlowPos.current = {
        x: (e.clientX - bounds.left - vp.x) / vp.zoom,
        y: (e.clientY - bounds.top - vp.y) / vp.zoom,
      };
      setContextMenu({ x: e.clientX, y: e.clientY });
    };
    el.addEventListener("dblclick", handler);
    return () => el.removeEventListener("dblclick", handler);
  }, [getViewport]);

  const handleAddNode = useCallback(async (type: FunnelNodeType, screenPos?: { x: number; y: number }) => {
    let x: number, y: number;
    if (screenPos) {
      x = contextFlowPos.current.x - 110;
      y = contextFlowPos.current.y - 40;
    } else {
      const vp = getViewport();
      x = (-vp.x + window.innerWidth / 2) / vp.zoom - 110;
      y = (-vp.y + window.innerHeight / 2) / vp.zoom - 40;
    }
    const newNode = await onCreateNode({
      parent_node_id: currentParentId,
      type,
      label: NODE_TYPE_META[type].label,
      position_x: x,
      position_y: y,
    });
    // Auto-connect if triggered from quick-add button
    if (quickAddSource.current) {
      await onCreateEdge(quickAddSource.current, newNode.id);
      quickAddSource.current = null;
    }
  }, [currentParentId, onCreateNode, onCreateEdge, getViewport]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;

      if (e.key === "Escape") {
        if (selectedNodeId) setSelectedNodeId(null);
        else if (path.length > 0) setPath((prev) => prev.slice(0, -1));
        return;
      }
      if (isInput) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId) {
        e.preventDefault();
        handleNodeDelete(selectedNodeId);
        return;
      }
      if (e.key === "f" || e.key === "F") {
        fitView({ padding: 0.2, duration: 300 });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedNodeId, path, handleNodeDelete, fitView]);

  // URL sync
  useEffect(() => {
    const url = new URL(window.location.href);
    if (path.length > 0) url.searchParams.set("path", path.join("."));
    else url.searchParams.delete("path");
    window.history.replaceState({}, "", url.toString());
  }, [path]);

  // Aggregated metrics for selected node (for inspector)
  const selectedAggregated = selectedNodeId ? aggregatedMetricsMap[selectedNodeId] : undefined;
  // Parent type of selected node (for block metrics in inspector)
  const selectedParentType = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.parent_node_id) {
      const parent = allNodes.find((n) => n.id === selectedNode.parent_node_id);
      return parent?.type ?? null;
    }
    return null;
  }, [selectedNode, allNodes]);

  return (
    <div ref={canvasRef} className="relative w-full h-full">
      {path.length > 0 && (
        <div className="absolute top-4 left-4 z-20 bg-[#0a0e14]/90 backdrop-blur-md rounded-xl px-4 py-2.5 border border-nova/15 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <FunnelBreadcrumb items={breadcrumbs} onNavigate={handleBreadcrumbNav} />
        </div>
      )}

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        connectionLineStyle={{ stroke: "#FF8A1F", strokeWidth: 2, strokeDasharray: "5 5" }}
        defaultEdgeOptions={{ type: "smoothstep" }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="funnel-canvas"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
        nodesDraggable
        nodeDragThreshold={2}
        zoomOnDoubleClick={false}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={60}
        panOnDrag
        selectionOnDrag={false}
        selectionKeyCode="Meta"
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Meta"
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={80}
          lineWidth={0.4}
          color="rgba(255,138,31,0.20)"
        />
      </ReactFlow>

      <AddNodeMenu
        onAdd={handleAddNode}
        parentType={currentParentNode?.type ?? null}
        externalOpen={contextMenu}
        onExternalClose={() => setContextMenu(null)}
      />

      {selectedNodeId && (
        <NodeInspector
          key={selectedNodeId}
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={onUpdateNode}
          onDrillDown={handleDrillDown}
          aggregatedMetrics={selectedAggregated}
          parentType={selectedParentType ?? currentParentNode?.type ?? null}
        />
      )}
    </div>
  );
}

export default function FunnelCanvas(props: FunnelCanvasProps) {
  return (
    <ReactFlowProvider>
      <FunnelCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
