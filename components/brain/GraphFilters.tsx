"use client"

import { useState } from 'react'
import { Search, X, ChevronDown, ChevronRight } from 'lucide-react'
import { KIND_META, ALL_KINDS, type WikiPageKind, type WikiNode } from '@/types/knowledge'
import { cn } from '@/lib/utils'

interface Props {
  nodes: WikiNode[]
  selectedSlug: string | null
  onNodeSelect: (slug: string) => void
  filterKinds: WikiPageKind[]
  onFilterKinds: (kinds: WikiPageKind[]) => void
  filterNiche: string | null
  onFilterNiche: (niche: string | null) => void
  searchQuery: string
  onSearchQuery: (q: string) => void
}

export default function GraphFilters({
  nodes,
  selectedSlug,
  onNodeSelect,
  filterKinds,
  onFilterKinds,
  filterNiche,
  onFilterNiche,
  searchQuery,
  onSearchQuery,
}: Props) {
  const [expandedKinds, setExpandedKinds] = useState<Set<string>>(new Set())

  // Collect unique niches
  const allNiches = Array.from(new Set(nodes.flatMap(n => n.niches))).sort()

  // Group nodes by kind
  const grouped = new Map<WikiPageKind, WikiNode[]>()
  for (const node of nodes) {
    const list = grouped.get(node.kind) || []
    list.push(node)
    grouped.set(node.kind, list)
  }

  const toggleKindFilter = (kind: WikiPageKind) => {
    if (filterKinds.includes(kind)) {
      onFilterKinds(filterKinds.filter(k => k !== kind))
    } else {
      onFilterKinds([...filterKinds, kind])
    }
  }

  const toggleExpand = (kind: string) => {
    const next = new Set(expandedKinds)
    if (next.has(kind)) next.delete(kind)
    else next.add(kind)
    setExpandedKinds(next)
  }

  return (
    <div className="w-[220px] flex-shrink-0 border-r border-white/[0.07] bg-bg-1 flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-white/[0.07]">
        <div className="relative">
          <Search size={14} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar paginas..."
            value={searchQuery}
            onChange={e => onSearchQuery(e.target.value)}
            className="w-full bg-bg-3 border border-white/[0.07] rounded-md pl-8 pr-8 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/40"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={12} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Niche filter */}
      {allNiches.length > 0 && (
        <div className="px-3 py-2 border-b border-white/[0.07]">
          <span className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Nicho</span>
          <div className="flex flex-wrap gap-1 mt-1.5">
            <button
              onClick={() => onFilterNiche(null)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] border transition-colors",
                !filterNiche
                  ? "bg-amber/15 border-amber/40 text-amber"
                  : "bg-bg-3 border-white/[0.07] text-text-muted hover:text-text-secondary"
              )}
            >
              Todos
            </button>
            {allNiches.map(niche => (
              <button
                key={niche}
                onClick={() => onFilterNiche(filterNiche === niche ? null : niche)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] border transition-colors",
                  filterNiche === niche
                    ? "bg-amber/15 border-amber/40 text-amber"
                    : "bg-bg-3 border-white/[0.07] text-text-muted hover:text-text-secondary"
                )}
              >
                {niche}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kind tree */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5">
        <span className="px-1.5 text-[9px] uppercase tracking-[0.15em] text-text-muted">Categorias</span>

        {ALL_KINDS.map(kind => {
          const meta = KIND_META[kind]
          const items = grouped.get(kind) || []
          if (items.length === 0 && filterKinds.length > 0 && !filterKinds.includes(kind)) return null

          const isExpanded = expandedKinds.has(kind)
          const isFiltered = filterKinds.includes(kind)

          return (
            <div key={kind}>
              <div className="flex items-center gap-1 group">
                <button
                  onClick={() => items.length > 0 && toggleExpand(kind)}
                  className="p-0.5 text-text-muted"
                >
                  {isExpanded
                    ? <ChevronDown size={10} strokeWidth={1.5} />
                    : <ChevronRight size={10} strokeWidth={1.5} />
                  }
                </button>

                <button
                  onClick={() => toggleKindFilter(kind)}
                  className={cn(
                    "flex-1 flex items-center gap-2 px-1.5 py-1 rounded text-[11px] transition-colors text-left",
                    isFiltered
                      ? "bg-white/[0.05] text-text-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]"
                  )}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="flex-1 truncate">{meta.label}</span>
                  <span className="text-[9px] text-text-muted font-mono">{items.length}</span>
                </button>
              </div>

              {isExpanded && items.length > 0 && (
                <div className="ml-5 space-y-px">
                  {items.map(node => (
                    <button
                      key={node.slug}
                      onClick={() => onNodeSelect(node.slug)}
                      className={cn(
                        "w-full text-left px-2 py-0.5 rounded text-[10px] truncate transition-colors",
                        node.slug === selectedSlug
                          ? "bg-white/[0.07] text-text-primary"
                          : "text-text-muted hover:text-text-secondary hover:bg-white/[0.03]"
                      )}
                    >
                      {node.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="px-3 py-2 border-t border-white/[0.07] text-[9px] text-text-muted font-mono">
        {nodes.length} paginas
      </div>
    </div>
  )
}
