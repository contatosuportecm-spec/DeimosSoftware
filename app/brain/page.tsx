"use client"

import { useState, useEffect, useCallback } from 'react'
import { Brain, Upload, AlertTriangle, Plus, RefreshCw } from 'lucide-react'
import LayoutApp from '@/app/layout-app'
import GraphCanvas from '@/components/brain/GraphCanvas'
import GraphFilters from '@/components/brain/GraphFilters'
import PageEditor from '@/components/brain/PageEditor'
import IngestPanel from '@/components/brain/IngestPanel'
import LintPanel from '@/components/brain/LintPanel'
import CreatePageModal from '@/components/brain/CreatePageModal'
import type { WikiNode, WikiEdge, WikiPageKind } from '@/types/knowledge'

type RightPanel = 'none' | 'editor' | 'ingest' | 'lint'

export default function BrainPage() {
  const [nodes, setNodes] = useState<WikiNode[]>([])
  const [edges, setEdges] = useState<WikiEdge[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [rightPanel, setRightPanel] = useState<RightPanel>('none')

  const [filterKinds, setFilterKinds] = useState<WikiPageKind[]>([])
  const [filterNiche, setFilterNiche] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadGraph = useCallback(async () => {
    try {
      const res = await fetch('/api/wiki/graph')
      if (!res.ok) throw new Error('Failed to load graph')
      const data = await res.json()
      setNodes(data.nodes)
      setEdges(data.edges)
    } catch (err) {
      console.error('[brain] load graph error:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadGraph() }, [loadGraph])

  const handleNodeSelect = (slug: string) => {
    setSelectedSlug(slug)
    setRightPanel('editor')
  }

  const handleNavigate = (slug: string) => {
    setSelectedSlug(slug)
    setRightPanel('editor')
  }

  const handleIngested = () => {
    loadGraph()
  }

  const handleDeleted = () => {
    setSelectedSlug(null)
    setRightPanel('none')
    loadGraph()
  }

  const handleCreated = (slug: string) => {
    setShowCreateModal(false)
    loadGraph()
    setSelectedSlug(slug)
    setRightPanel('editor')
  }

  return (
    <LayoutApp>
    <div className="flex flex-col h-full bg-bg-0 overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.07] bg-bg-1 flex-shrink-0">
        <Brain size={16} strokeWidth={1.5} className="text-amber" />
        <h1 className="text-sm font-semibold text-text-primary">Knowledge Brain</h1>

        <div className="flex-1" />

        <span className="text-[9px] uppercase tracking-[0.15em] text-text-muted font-mono">
          {nodes.length} nos · {edges.length} links
        </span>

        <button
          onClick={() => loadGraph()}
          className="p-1.5 rounded hover:bg-white/[0.05] text-text-muted hover:text-text-secondary transition-colors"
          title="Recarregar"
        >
          <RefreshCw size={13} strokeWidth={1.5} />
        </button>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.1] text-text-secondary text-[10px] hover:bg-white/[0.05] transition-colors"
        >
          <Plus size={12} strokeWidth={1.5} />
          Pagina
        </button>

        <button
          onClick={() => setRightPanel(rightPanel === 'lint' ? 'none' : 'lint')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] transition-colors ${
            rightPanel === 'lint'
              ? 'border-amber/40 text-amber bg-amber/10'
              : 'border-white/[0.1] text-text-secondary hover:bg-white/[0.05]'
          }`}
        >
          <AlertTriangle size={12} strokeWidth={1.5} />
          Saude
        </button>

        <button
          onClick={() => setRightPanel(rightPanel === 'ingest' ? 'none' : 'ingest')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            rightPanel === 'ingest'
              ? 'bg-amber text-black'
              : 'bg-amber/15 text-amber hover:bg-amber/25 border border-amber/30'
          }`}
        >
          <Upload size={12} strokeWidth={1.5} />
          Upload
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — filters & tree */}
        <GraphFilters
          nodes={nodes}
          selectedSlug={selectedSlug}
          onNodeSelect={handleNodeSelect}
          filterKinds={filterKinds}
          onFilterKinds={setFilterKinds}
          filterNiche={filterNiche}
          onFilterNiche={setFilterNiche}
          searchQuery={searchQuery}
          onSearchQuery={setSearchQuery}
        />

        {/* Center — graph canvas */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
              <span className="text-xs text-text-muted">Carregando Brain...</span>
            </div>
          </div>
        ) : (
          <GraphCanvas
            wikiNodes={nodes}
            wikiEdges={edges}
            selectedSlug={selectedSlug}
            onNodeSelect={handleNodeSelect}
            filterKinds={filterKinds}
            filterNiche={filterNiche}
            searchQuery={searchQuery}
          />
        )}

        {/* Right panel */}
        {rightPanel === 'editor' && selectedSlug && (
          <PageEditor
            slug={selectedSlug}
            onClose={() => { setSelectedSlug(null); setRightPanel('none') }}
            onNavigate={handleNavigate}
            onDeleted={handleDeleted}
          />
        )}

        {rightPanel === 'ingest' && (
          <IngestPanel
            onIngested={handleIngested}
            onClose={() => setRightPanel('none')}
          />
        )}

        {rightPanel === 'lint' && (
          <LintPanel
            onClose={() => setRightPanel('none')}
            onNavigate={handleNavigate}
          />
        )}
      </div>

      {/* Create page modal */}
      {showCreateModal && (
        <CreatePageModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
    </LayoutApp>
  )
}
