"use client"

import { useRef, useEffect, useCallback, useState } from 'react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import { KIND_META, type WikiNode, type WikiEdge, type WikiPageKind } from '@/types/knowledge'

/* ── Types ── */
interface SimNode extends SimulationNodeDatum {
  id: string
  slug: string
  title: string
  kind: WikiPageKind
  niches: string[]
  tags: string[]
  confidence: number
  usage_count: number
  radius: number
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: SimNode | string
  target: SimNode | string
}

interface Props {
  wikiNodes: WikiNode[]
  wikiEdges: WikiEdge[]
  selectedSlug: string | null
  onNodeSelect: (slug: string) => void
  filterKinds: WikiPageKind[]
  filterNiche: string | null
  searchQuery: string
}

/* ── Helpers ── */
function nodeRadius(usage: number): number {
  return Math.max(6, Math.min(22, 6 + usage * 1.5))
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function GraphCanvas({
  wikiNodes,
  wikiEdges,
  selectedSlug,
  onNodeSelect,
  filterKinds,
  filterNiche,
  searchQuery,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null)
  const nodesRef = useRef<SimNode[]>([])
  const linksRef = useRef<SimLink[]>([])
  const animRef = useRef<number>(0)

  // Interaction state
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const transformRef = useRef({ x: 0, y: 0, k: 1 })
  const dragRef = useRef<{ node: SimNode | null; offsetX: number; offsetY: number }>({ node: null, offsetX: 0, offsetY: 0 })
  const panRef = useRef<{ panning: boolean; startX: number; startY: number; startTx: number; startTy: number }>({ panning: false, startX: 0, startY: 0, startTx: 0, startTy: 0 })
  const hoveredRef = useRef<SimNode | null>(null)
  const selectedRef = useRef<string | null>(selectedSlug)

  selectedRef.current = selectedSlug

  // Filter nodes
  const getFiltered = useCallback(() => {
    let filtered = wikiNodes

    if (filterKinds.length > 0) {
      filtered = filtered.filter(n => filterKinds.includes(n.kind))
    }
    if (filterNiche) {
      filtered = filtered.filter(n => n.niches.includes(filterNiche))
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    return new Set(filtered.map(n => n.id))
  }, [wikiNodes, filterKinds, filterNiche, searchQuery])

  // Initialize / update simulation
  useEffect(() => {
    const filteredSlugs = getFiltered()
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const w = container.clientWidth
    const h = container.clientHeight
    canvas.width = w * 2 // retina
    canvas.height = h * 2
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    // Preserve existing positions
    const oldPositions = new Map<string, { x: number; y: number }>()
    for (const n of nodesRef.current) {
      if (n.x != null && n.y != null) {
        oldPositions.set(n.id, { x: n.x, y: n.y })
      }
    }

    // Build sim nodes
    const simNodes: SimNode[] = wikiNodes
      .filter(n => filteredSlugs.has(n.id))
      .map(n => {
        const old = oldPositions.get(n.id)
        return {
          id: n.id,
          slug: n.slug,
          title: n.title,
          kind: n.kind,
          niches: n.niches,
          tags: n.tags,
          confidence: n.confidence,
          usage_count: n.usage_count,
          radius: nodeRadius(n.usage_count),
          x: old?.x ?? (Math.random() - 0.5) * w * 0.6,
          y: old?.y ?? (Math.random() - 0.5) * h * 0.6,
        }
      })

    const nodeMap = new Map(simNodes.map(n => [n.id, n]))

    const simLinks: SimLink[] = wikiEdges
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map(e => ({
        source: e.source,
        target: e.target,
      }))

    nodesRef.current = simNodes
    linksRef.current = simLinks

    // Stop old sim
    simRef.current?.stop()

    // ── Compute cluster centers by kind ──
    const kindList = Array.from(new Set(simNodes.map(n => n.kind)))
    const kindAngle = new Map<string, number>()
    kindList.forEach((k, i) => kindAngle.set(k, (i / kindList.length) * Math.PI * 2))
    const clusterRadius = Math.min(w, h) * 0.25

    // ── Compute shared tags/niches for link strength ──
    const sharedWeight = (a: SimNode, b: SimNode): number => {
      let w2 = 0
      // Same kind = strong pull
      if (a.kind === b.kind) w2 += 0.5
      // Shared niches
      for (const n of a.niches) { if (b.niches.includes(n)) w2 += 0.3 }
      // Shared tags
      for (const t of a.tags) { if (b.tags.includes(t)) w2 += 0.15 }
      return w2
    }

    // ── Add implicit edges for nodes sharing kind/niche/tags ──
    const existingEdgeSet = new Set(simLinks.map(l => {
      const s = typeof l.source === 'string' ? l.source : l.source.id
      const t2 = typeof l.target === 'string' ? l.target : l.target.id
      return `${s}→${t2}`
    }))

    const implicitLinks: SimLink[] = []
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i], b = simNodes[j]
        const w2 = sharedWeight(a, b)
        if (w2 > 0 && !existingEdgeSet.has(`${a.id}→${b.id}`) && !existingEdgeSet.has(`${b.id}→${a.id}`)) {
          implicitLinks.push({ source: a.id, target: b.id, _implicit: true, _weight: w2 } as SimLink & { _implicit: boolean; _weight: number })
        }
      }
    }

    const allLinks = [...simLinks, ...implicitLinks]

    // Force simulation — Obsidian style with clustering
    const sim = forceSimulation<SimNode>(simNodes)
      .force('link', forceLink<SimNode, SimLink>(allLinks)
        .id(d => d.id)
        .distance(d => {
          const link = d as SimLink & { _implicit?: boolean; _weight?: number }
          if (link._implicit) {
            // Implicit links: closer if more shared attributes
            return 180 - (link._weight ?? 0) * 100
          }
          // Explicit links (links_to): tight
          return 80
        })
        .strength(d => {
          const link = d as SimLink & { _implicit?: boolean; _weight?: number }
          if (link._implicit) return (link._weight ?? 0) * 0.08
          return 0.5 // explicit links are strong
        })
      )
      .force('charge', forceManyBody<SimNode>()
        .strength(d => -60 - d.radius * 3)
        .distanceMax(600)
      )
      .force('center', forceCenter(0, 0).strength(0.03))
      .force('collide', forceCollide<SimNode>(d => d.radius + 6).strength(0.8))
      // Pull nodes toward their kind cluster center
      .force('kindX', forceX<SimNode>(d => {
        const angle = kindAngle.get(d.kind) ?? 0
        return Math.cos(angle) * clusterRadius
      }).strength(0.06))
      .force('kindY', forceY<SimNode>(d => {
        const angle = kindAngle.get(d.kind) ?? 0
        return Math.sin(angle) * clusterRadius
      }).strength(0.06))
      .alphaDecay(0.012)
      .velocityDecay(0.3)

    simRef.current = sim

    // Store ALL links for rendering (explicit + implicit)
    linksRef.current = allLinks as SimLink[]

    // Center transform
    transformRef.current = { x: w / 2, y: h / 2, k: 1 }
    setTransform({ x: w / 2, y: h / 2, k: 1 })

    // Render loop
    cancelAnimationFrame(animRef.current)

    function render() {
      const ctx = canvas!.getContext('2d')
      if (!ctx) return
      const dpr = 2
      const cw = canvas!.width
      const ch = canvas!.height
      const t = transformRef.current

      ctx.clearRect(0, 0, cw, ch)
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.translate(t.x, t.y)
      ctx.scale(t.k, t.k)

      const nodes = nodesRef.current
      const links = linksRef.current
      const hovered = hoveredRef.current
      const selected = selectedRef.current

      // Collect connected slugs for selected node
      const connectedToSelected = new Set<string>()
      if (selected) {
        connectedToSelected.add(selected)
        for (const link of links) {
          const s = typeof link.source === 'string' ? link.source : link.source.id
          const t2 = typeof link.target === 'string' ? link.target : link.target.id
          if (s === selected) connectedToSelected.add(t2)
          if (t2 === selected) connectedToSelected.add(s)
        }
      }

      // Draw edges — all connections visible
      for (const link of links) {
        const source = link.source as SimNode
        const target = link.target as SimNode
        if (source.x == null || target.x == null) continue

        const isImplicit = (link as unknown as { _implicit?: boolean })._implicit
        const implicitWeight = (link as unknown as { _weight?: number })._weight ?? 0

        const isHighlighted = selected && (
          connectedToSelected.has(source.id) && connectedToSelected.has(target.id)
        )

        const isHoveredEdge = hovered && (
          source.id === hovered.id || target.id === hovered.id
        )

        ctx.beginPath()
        ctx.moveTo(source.x!, source.y!)

        // Curved edges like Obsidian
        const dx = target.x! - source.x!
        const dy = target.y! - source.y!
        const curvature = isImplicit ? 0.05 : 0.1
        const cx = (source.x! + target.x!) / 2 - dy * curvature
        const cy = (source.y! + target.y!) / 2 + dx * curvature
        ctx.quadraticCurveTo(cx, cy, target.x!, target.y!)

        if (isHighlighted || isHoveredEdge) {
          // Highlighted: colored bright
          const color = KIND_META[source.kind]?.color ?? '#F4C430'
          ctx.strokeStyle = hexToRgba(color, isImplicit ? 0.35 : 0.6)
          ctx.lineWidth = (isImplicit ? 1 : 1.8) / t.k
        } else if (isImplicit) {
          // Implicit: subtle lines, opacity by weight
          const baseAlpha = selected ? 0.02 : (0.04 + implicitWeight * 0.06)
          // Color based on shared kind
          if (source.kind === target.kind) {
            const color = KIND_META[source.kind]?.color ?? '#F4C430'
            ctx.strokeStyle = hexToRgba(color, baseAlpha)
          } else {
            ctx.strokeStyle = `rgba(255,255,255,${baseAlpha})`
          }
          ctx.lineWidth = 0.5 / t.k
        } else {
          // Explicit links_to: solid visible lines
          const color = KIND_META[source.kind]?.color ?? '#F4C430'
          ctx.strokeStyle = selected
            ? hexToRgba(color, 0.08)
            : hexToRgba(color, 0.25)
          ctx.lineWidth = 1 / t.k
        }

        ctx.stroke()
      }

      // Draw nodes
      for (const node of nodes) {
        if (node.x == null || node.y == null) continue

        const meta = KIND_META[node.kind] ?? KIND_META.resource
        const isSelected = node.slug === selected
        const isHovered = hovered?.id === node.id
        const isConnected = selected ? connectedToSelected.has(node.id) : true
        const r = node.radius / t.k * t.k // keep radius consistent

        // Dim unconnected nodes when something is selected
        const alpha = selected
          ? (isConnected ? 1 : 0.15)
          : (0.5 + node.confidence * 0.5)

        // Glow for selected/hovered
        if (isSelected || isHovered) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, r + 10, 0, Math.PI * 2)
          const glow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 10)
          glow.addColorStop(0, hexToRgba(meta.color, 0.3))
          glow.addColorStop(1, hexToRgba(meta.color, 0))
          ctx.fillStyle = glow
          ctx.fill()
        }

        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(meta.color, alpha * 0.25)
        ctx.fill()
        ctx.strokeStyle = hexToRgba(meta.color, alpha * (isSelected ? 1 : 0.7))
        ctx.lineWidth = (isSelected ? 2 : 1) / t.k
        ctx.stroke()

        // Inner dot
        ctx.beginPath()
        ctx.arc(node.x, node.y, r * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(meta.color, alpha * 0.9)
        ctx.fill()

        // Label
        const fontSize = Math.max(9, Math.min(12, 10 / t.k * t.k))
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = isSelected || isHovered
          ? `rgba(255,255,255,${alpha})`
          : `rgba(161,161,170,${alpha * 0.8})`

        const label = node.title.length > 18 ? node.title.slice(0, 16) + '..' : node.title
        ctx.fillText(label, node.x, node.y + r + 4)
      }

      // Hover tooltip
      if (hovered && hovered.x != null && hovered.y != null) {
        const meta = KIND_META[hovered.kind] ?? KIND_META.resource
        const tooltipText = meta.label
        ctx.font = '10px Inter, system-ui, sans-serif'
        const tw = ctx.measureText(tooltipText).width + 12
        const tx = hovered.x - tw / 2
        const ty = hovered.y - hovered.radius - 22

        ctx.fillStyle = '#1C1C1F'
        ctx.strokeStyle = hexToRgba(meta.color, 0.4)
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.roundRect(tx, ty, tw, 18, 4)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = meta.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(tooltipText, hovered.x, ty + 9)
      }

      ctx.restore()
      animRef.current = requestAnimationFrame(render)
    }

    sim.on('tick', () => {})
    animRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animRef.current)
      sim.stop()
    }
  }, [wikiNodes, wikiEdges, getFiltered])

  // Re-render on selection change
  useEffect(() => {
    selectedRef.current = selectedSlug
  }, [selectedSlug])

  // Hit test
  const hitTest = useCallback((clientX: number, clientY: number): SimNode | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const t = transformRef.current
    const mx = (clientX - rect.left - t.x) / t.k
    const my = (clientY - rect.top - t.y) / t.k

    for (const node of nodesRef.current) {
      if (node.x == null || node.y == null) continue
      const dx = mx - node.x
      const dy = my - node.y
      if (dx * dx + dy * dy < (node.radius + 4) * (node.radius + 4)) {
        return node
      }
    }
    return null
  }, [])

  // Mouse handlers
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onMouseDown = (e: MouseEvent) => {
      const node = hitTest(e.clientX, e.clientY)
      if (node) {
        const t = transformRef.current
        const rect = canvas.getBoundingClientRect()
        dragRef.current = {
          node,
          offsetX: (e.clientX - rect.left - t.x) / t.k - node.x!,
          offsetY: (e.clientY - rect.top - t.y) / t.k - node.y!,
        }
        node.fx = node.x
        node.fy = node.y
        simRef.current?.alphaTarget(0.1).restart()
      } else {
        panRef.current = {
          panning: true,
          startX: e.clientX,
          startY: e.clientY,
          startTx: transformRef.current.x,
          startTy: transformRef.current.y,
        }
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      // Drag node
      if (dragRef.current.node) {
        const t = transformRef.current
        const rect = canvas.getBoundingClientRect()
        const node = dragRef.current.node
        node.fx = (e.clientX - rect.left - t.x) / t.k - dragRef.current.offsetX
        node.fy = (e.clientY - rect.top - t.y) / t.k - dragRef.current.offsetY
        return
      }

      // Pan
      if (panRef.current.panning) {
        const dx = e.clientX - panRef.current.startX
        const dy = e.clientY - panRef.current.startY
        transformRef.current = {
          ...transformRef.current,
          x: panRef.current.startTx + dx,
          y: panRef.current.startTy + dy,
        }
        return
      }

      // Hover
      const node = hitTest(e.clientX, e.clientY)
      hoveredRef.current = node
      canvas.style.cursor = node ? 'pointer' : 'grab'
    }

    const onMouseUp = () => {
      if (dragRef.current.node) {
        dragRef.current.node.fx = null
        dragRef.current.node.fy = null
        simRef.current?.alphaTarget(0)
        dragRef.current = { node: null, offsetX: 0, offsetY: 0 }
      }
      panRef.current.panning = false
    }

    const onClick = (e: MouseEvent) => {
      const node = hitTest(e.clientX, e.clientY)
      if (node) {
        onNodeSelect(node.slug)
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const t = transformRef.current
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const factor = e.deltaY > 0 ? 0.92 : 1.08
      const newK = Math.max(0.1, Math.min(5, t.k * factor))

      // Zoom towards mouse
      transformRef.current = {
        x: mouseX - (mouseX - t.x) * (newK / t.k),
        y: mouseY - (mouseY - t.y) * (newK / t.k),
        k: newK,
      }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [hitTest, onNodeSelect])

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      canvas.width = w * 2
      canvas.height = h * 2
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      transformRef.current = { x: w / 2, y: h / 2, k: transformRef.current.k }
    })

    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  if (wikiNodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border border-white/[0.07] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4C430" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z" opacity="0.3" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <p>Nenhuma pagina no Brain ainda</p>
          <p className="text-[10px] text-text-muted">Faca upload de um documento para comecar</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 h-full relative bg-bg-0 overflow-hidden cursor-grab">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1">
        <button
          onClick={() => {
            const t = transformRef.current
            const container = containerRef.current
            if (!container) return
            const cx = container.clientWidth / 2
            const cy = container.clientHeight / 2
            const newK = Math.min(5, t.k * 1.3)
            transformRef.current = {
              x: cx - (cx - t.x) * (newK / t.k),
              y: cy - (cy - t.y) * (newK / t.k),
              k: newK,
            }
          }}
          className="w-7 h-7 rounded bg-bg-3 border border-white/[0.1] text-text-secondary hover:bg-bg-4 flex items-center justify-center text-sm"
        >
          +
        </button>
        <button
          onClick={() => {
            const t = transformRef.current
            const container = containerRef.current
            if (!container) return
            const cx = container.clientWidth / 2
            const cy = container.clientHeight / 2
            const newK = Math.max(0.1, t.k * 0.7)
            transformRef.current = {
              x: cx - (cx - t.x) * (newK / t.k),
              y: cy - (cy - t.y) * (newK / t.k),
              k: newK,
            }
          }}
          className="w-7 h-7 rounded bg-bg-3 border border-white/[0.1] text-text-secondary hover:bg-bg-4 flex items-center justify-center text-sm"
        >
          -
        </button>
        <button
          onClick={() => {
            const container = containerRef.current
            if (!container) return
            transformRef.current = { x: container.clientWidth / 2, y: container.clientHeight / 2, k: 1 }
          }}
          className="w-7 h-7 rounded bg-bg-3 border border-white/[0.1] text-text-secondary hover:bg-bg-4 flex items-center justify-center text-[9px]"
          title="Reset zoom"
        >
          1:1
        </button>
      </div>
    </div>
  )
}
