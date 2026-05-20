"use client"

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Link2, Clock, Eye, Shield, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LintReport } from '@/types/knowledge'

interface Props {
  onClose: () => void
  onNavigate: (slug: string) => void
}

export default function LintPanel({ onClose, onNavigate }: Props) {
  const [report, setReport] = useState<LintReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wiki/lint')
      .then(r => r.json())
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="w-[380px] flex-shrink-0 border-l border-white/[0.07] bg-bg-1 flex items-center justify-center">
        <Loader2 size={16} className="animate-spin text-amber" />
      </div>
    )
  }

  if (!report) return null

  const sections = [
    { key: 'broken_links', label: 'Links Quebrados', items: report.broken_links, icon: Link2, color: '#EF4444' },
    { key: 'stale', label: 'Desatualizadas (30d+)', items: report.stale, icon: Clock, color: '#FBBF24' },
    { key: 'orphans', label: 'Orfas (sem links)', items: report.orphans, icon: Eye, color: '#60A5FA' },
    { key: 'low_confidence', label: 'Baixa Confianca (<30%)', items: report.low_confidence, icon: Shield, color: '#F472B6' },
  ]

  return (
    <div className="w-[380px] flex-shrink-0 border-l border-white/[0.07] bg-bg-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07]">
        <AlertTriangle size={14} strokeWidth={1.5} className="text-amber" />
        <span className="text-xs font-medium text-text-primary">Saude do Brain</span>
        <div className="flex-1" />
        <button onClick={onClose} className="p-1 rounded hover:bg-white/[0.05] text-text-muted">
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Health score */}
      <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-semibold border-2"
          style={{
            borderColor: report.health_score >= 80 ? '#34D399' : report.health_score >= 50 ? '#FBBF24' : '#EF4444',
            color: report.health_score >= 80 ? '#34D399' : report.health_score >= 50 ? '#FBBF24' : '#EF4444',
          }}
        >
          {report.health_score}
        </div>
        <div>
          <div className="text-xs text-text-primary font-medium">Health Score</div>
          <div className="text-[10px] text-text-muted font-mono">{report.total_pages} paginas total</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sections.map(section => (
          <div key={section.key}>
            <div className="flex items-center gap-1.5 mb-2">
              <section.icon size={11} strokeWidth={1.5} style={{ color: section.color }} />
              <span className="text-[9px] uppercase tracking-[0.15em] text-text-muted">{section.label}</span>
              <span className="text-[9px] font-mono ml-auto" style={{ color: section.color }}>
                {section.items.length}
              </span>
            </div>
            {section.items.length === 0 ? (
              <div className="text-[10px] text-text-muted pl-4">Nenhuma</div>
            ) : (
              <div className="space-y-1">
                {section.items.slice(0, 10).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigate(item.slug)}
                    className="flex items-start gap-2 w-full text-left px-2 py-1.5 rounded bg-bg-3 hover:bg-bg-4 transition-colors"
                  >
                    <div>
                      <div className="text-[10px] text-text-secondary truncate max-w-[280px]">{item.title}</div>
                      <div className="text-[9px] text-text-muted">{item.issue}</div>
                    </div>
                  </button>
                ))}
                {section.items.length > 10 && (
                  <div className="text-[9px] text-text-muted pl-2">+{section.items.length - 10} mais</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
