"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background, BackgroundVariant, MiniMap, SelectionMode,
  type Node, type Edge, type Connection, type OnNodesChange, type OnEdgesChange,
  applyNodeChanges, applyEdgeChanges,
  useReactFlow, ReactFlowProvider, ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { MousePointer2, Sparkles } from "lucide-react";

import { BaseNode, type BaseNodeData } from "./BaseNode";
import { DeletableEdge } from "./DeletableEdge";
import FunnelBreadcrumb, { type BreadcrumbItem } from "./Breadcrumb";
import AddNodeMenu from "./AddNodeMenu";
import NodeInspector from "./NodeInspector";
import QuizGenerateModal from "./QuizGenerateModal";
import { getNodesAtLevel, getEdgesAtLevel } from "@/hooks/useFunnels";
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
    content?: Record<string, unknown>;
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
      return { playrate: avg("playrate"), retention_media: avg("retention"), ctr_botoes: avg("ctr") };
    case "sales_page":
      return { ctr_medio: avg("ctr") };
    case "email":
    case "whatsapp":
      return { open_rate_medio: avg("open_rate"), click_rate_medio: avg("click_rate") };
    case "upsell":
    case "downsell": {
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

  // Pre-compute parent→child count map for efficiency
  const parentChildCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const n of allNodes) {
      if (n.parent_node_id) {
        map[n.parent_node_id] = (map[n.parent_node_id] ?? 0) + 1;
      }
    }
    return map;
  }, [allNodes]);

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
          childCount: parentChildCountMap[c.id] ?? 0,
        }));
      if (kids.length > 0) map[n.id] = kids;
    }
    return map;
  }, [levelNodes, allNodes, parentChildCountMap]);

  const handleSelectChild = useCallback((childId: string) => {
    setSelectedNodeId(childId);
  }, []);

  // Quick-add refs
  const quickAddSource = useRef<string | null>(null);
  const quickAddRef = useRef<(sourceId: string) => void>(() => {});

  const handleUpdateMetric = useCallback((nodeId: string, key: string, value: number | null) => {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) return;
    const newMetrics = { ...(node.metrics as Record<string, unknown>), [key]: value };
    onUpdateNode(nodeId, { metrics: newMetrics });
  }, [allNodes, onUpdateNode]);

  const handleUpdateContent = useCallback((nodeId: string, content: Record<string, unknown>) => {
    onUpdateNode(nodeId, { content });
  }, [onUpdateNode]);

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
    [levelNodes, handleDrillDown, handleNodeDelete, handleSelectChild, handleUpdateMetric, handleUpdateContent, handleDeleteEdgesByHandle, aggregatedMetricsMap, childrenMap, currentParentNode]
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

  // Sync DB → local: includes metrics + aggregated in key so inline edits trigger re-render
  const prevNodeKeyRef = useRef("");
  useEffect(() => {
    const key = rfNodesFromDB.map((n) =>
      `${n.id}:${n.data.type}:${n.data.label}:${n.data.children?.length ?? 0}:${JSON.stringify(n.data.content)}:${JSON.stringify(n.data.metrics)}:${JSON.stringify(n.data.aggregatedMetrics)}`
    ).join("|");
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

  // Build a map of node id → color for edge coloring
  const nodeColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of allNodes) {
      const meta = NODE_TYPE_META[n.type];
      if (meta) map[n.id] = meta.color;
    }
    return map;
  }, [allNodes]);

  useEffect(() => {
    setRfEdges(levelEdges.map((e) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      sourceHandle: e.source_handle,
      targetHandle: e.target_handle,
      label: e.label,
      type: "deletable",
      data: { onDelete: onDeleteEdge, color: nodeColorMap[e.source_node_id] ?? "#6B7280" },
    })));
  }, [levelEdges, nodeColorMap]);

  // Breadcrumb
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ id: null, label: "Funil" }];
    for (const nodeId of path) {
      const node = allNodes.find((n) => n.id === nodeId);
      items.push({ id: nodeId, label: node?.label ?? "..." });
    }
    return items;
  }, [path, allNodes]);

  // Fit view only on first load of a level
  const hasInitRef = useRef<string | null>(null);
  useEffect(() => {
    const levelKey = currentParentId ?? "__root__";
    if (hasInitRef.current !== levelKey) {
      hasInitRef.current = levelKey;
      setTimeout(() => fitView({ padding: 0.6, duration: 0 }), 80);
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
  }, []);

  // Reliable position save: onNodeDragStop always provides the final position
  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node, nodes: Node[]) => {
    const dragged = nodes.length > 0 ? nodes : [node];
    for (const n of dragged) {
      onSavePosition(n.id, n.position.x, n.position.y);
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
      // Optimistic: show edge instantly before DB roundtrip
      const tempId = `temp-${Date.now()}`;
      const color = nodeColorMap[connection.source] ?? "#6B7280";
      setRfEdges((eds) => [
        ...eds,
        {
          id: tempId,
          source: connection.source!,
          target: connection.target!,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          type: "deletable",
          data: { onDelete: onDeleteEdge, color },
        },
      ]);
      // Persist — real edge replaces temp on next sync
      onCreateEdge(
        connection.source,
        connection.target,
        undefined,
        connection.sourceHandle ?? undefined,
        connection.targetHandle ?? undefined,
      );
    }
  }, [onCreateEdge, onDeleteEdge, nodeColorMap]);

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

  // Double-click on pane — robust check (not relying on exact class name)
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't trigger if clicking inside a node
      if (target.closest(".react-flow__node")) return;
      // Only accept clicks on pane/viewport area
      if (!target.closest(".react-flow__pane") && !target.closest(".react-flow__viewport")) return;
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
    // Quiz questions get auto-incrementing labels: "Pergunta 1", "Pergunta 2", ...
    let label = NODE_TYPE_META[type].label;
    if (type === "quiz_question") {
      const maxNum = allNodes
        .filter((n) => n.parent_node_id === currentParentId && n.type === "quiz_question")
        .reduce((max, n) => {
          const m = /^Pergunta\s+(\d+)$/.exec(n.label);
          return m ? Math.max(max, parseInt(m[1], 10)) : max;
        }, 0);
      label = `Pergunta ${maxNum + 1}`;
    }
    const newNode = await onCreateNode({
      parent_node_id: currentParentId,
      type,
      label,
      position_x: x,
      position_y: y,
    });
    if (quickAddSource.current) {
      await onCreateEdge(quickAddSource.current, newNode.id);
      quickAddSource.current = null;
    }
  }, [currentParentId, onCreateNode, onCreateEdge, getViewport, allNodes]);

  // AI quiz generation — paste text, create one quiz_question node per generated question
  const [genOpen, setGenOpen] = useState(false);
  const handleGenerateQuiz = useCallback(async (text: string): Promise<number> => {
    const res = await fetch("/api/funnels/generate-quiz", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Falha ao gerar perguntas");
    const questions = data.questions as Array<{ question: string; question_type: string; options: string[] }>;

    const siblings = allNodes.filter((n) => n.parent_node_id === currentParentId);
    let num = siblings
      .filter((n) => n.type === "quiz_question")
      .reduce((max, n) => {
        const m = /^Pergunta\s+(\d+)$/.exec(n.label);
        return m ? Math.max(max, parseInt(m[1], 10)) : max;
      }, 0);

    // Lay out generated questions in a horizontal row, to the right of existing nodes
    const startX = siblings.length > 0 ? Math.max(...siblings.map((n) => n.position_x)) + 360 : 0;
    const y = siblings.length > 0 ? siblings[0].position_y : 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      num++;
      const options = q.question_type === "button"
        ? q.options.map((label) => ({ id: crypto.randomUUID(), label }))
        : [];
      await onCreateNode({
        parent_node_id: currentParentId,
        type: "quiz_question",
        label: `Pergunta ${num}`,
        position_x: startX + i * 360,
        position_y: y,
        content: { question: q.question, question_type: q.question_type, options },
      });
    }
    return questions.length;
  }, [allNodes, currentParentId, onCreateNode]);

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

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        // Delete all selected nodes and edges
        const selNodes = rfNodes.filter((n) => n.selected);
        const selEdges = rfEdges.filter((ed) => ed.selected);
        if (selNodes.length === 0 && selEdges.length === 0 && selectedNodeId) {
          handleNodeDelete(selectedNodeId);
          return;
        }
        for (const ed of selEdges) onDeleteEdge(ed.id);
        for (const n of selNodes) onDeleteNode(n.id);
        setSelectedNodeId(null);
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

  const selectedAggregated = selectedNodeId ? aggregatedMetricsMap[selectedNodeId] : undefined;
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
        <div className="absolute top-4 left-4 z-20 bg-[#0b0d14]/90 backdrop-blur-xl rounded-xl px-4 py-2.5 border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <FunnelBreadcrumb items={breadcrumbs} onNavigate={handleBreadcrumbNav} />
        </div>
      )}

      {currentParentNode?.type === "quiz" && (
        <button
          onClick={() => setGenOpen(true)}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-black bg-[#FF8A1F] hover:bg-[#E5740F] transition-colors shadow-[0_4px_24px_rgba(255,138,31,0.35)]"
        >
          <Sparkles size={14} strokeWidth={2} />
          Gerar com IA
        </button>
      )}

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onNodeDragStop={handleNodeDragStop}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        connectionLineStyle={{ stroke: "#F4C430", strokeWidth: 2.5, strokeDasharray: "8 5", strokeLinecap: "round" }}
        defaultEdgeOptions={{ type: "default" }}
        fitView
        fitViewOptions={{ padding: 0.6 }}
        minZoom={0.1}
        maxZoom={2}
        className="funnel-canvas"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
        nodesDraggable
        nodeDragThreshold={5}
        zoomOnDoubleClick={false}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={80}
        snapToGrid
        snapGrid={[20, 20]}
        panOnDrag
        selectionOnDrag={false}
        selectionKeyCode="Meta"
        selectionMode={SelectionMode.Partial}
        edgesFocusable
        elementsSelectable
        multiSelectionKeyCode="Meta"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="rgba(255,255,255,0.06)"
        />
        <MiniMap
          nodeColor={(node: Node) => {
            const type = (node.data as BaseNodeData)?.type;
            return type ? (NODE_TYPE_META[type]?.color ?? "#6B7280") : "#6B7280";
          }}
          maskColor="rgba(0,0,0,0.65)"
          style={{ background: "#0B0B0C", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Empty state */}
      {rfNodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-8 py-6 text-center backdrop-blur-sm">
            <MousePointer2 size={28} strokeWidth={1.5} className="text-white/20 mx-auto mb-3" />
            <p className="text-[14px] text-white/40 font-medium mb-1">Canvas vazio</p>
            <p className="text-[12px] text-white/20">Duplo-clique ou pressione <span className="text-amber-400/50 font-medium">+</span> para criar o primeiro no</p>
          </div>
        </div>
      )}

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

      <QuizGenerateModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        onGenerate={handleGenerateQuiz}
      />
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
