"use client"

import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  X, Edit3, Save, Trash2, Clock, Link2, Tag, Shield, ChevronDown, ChevronUp,
} from 'lucide-react'
import { KIND_META, type WikiPage, type WikiPageKind, ALL_KINDS } from '@/types/knowledge'
import { cn } from '@/lib/utils'

interface Props {
  slug: string
  onClose: () => void
  onNavigate: (slug: string) => void
  onDeleted: () => void
}

interface PageData extends WikiPage {
  revisions: { id: string; reason: string | null; author: string; created_at: string }[]
  linked_pages: { slug: string; title: string; kind: WikiPageKind }[]
}

export default function PageEditor({ slug, onClose, onNavigate, onDeleted }: Props) {
  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editKind, setEditKind] = useState<WikiPageKind>('resource')
  const [editTags, setEditTags] = useState('')
  const [editNiches, setEditNiches] = useState('')
  const [editLinksTo, setEditLinksTo] = useState('')
  const [saving, setSaving] = useState(false)
  const [showRevisions, setShowRevisions] = useState(false)

  const loadPage = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/wiki/pages/${encodeURIComponent(slug)}`)
      if (!res.ok) throw new Error('Page not found')
      const data = await res.json()
      setPage(data)
      setEditBody(data.body_md)
      setEditTitle(data.title)
      setEditSummary(data.summary ?? '')
      setEditKind(data.kind)
      setEditTags((data.tags ?? []).join(', '))
      setEditNiches((data.niches ?? []).join(', '))
      setEditLinksTo((data.links_to ?? []).join(', '))
    } catch {
      setPage(null)
    }
    setLoading(false)
  }, [slug])

  useEffect(() => { loadPage() }, [loadPage])

  const handleSave = async () => {
    if (!page) return
    setSaving(true)
    try {
      await fetch(`/api/wiki/pages/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          summary: editSummary || null,
          body_md: editBody,
          kind: editKind,
          tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
          niches: editNiches.split(',').map(n => n.trim()).filter(Boolean),
          links_to: editLinksTo.split(',').map(l => l.trim()).filter(Boolean),
        }),
      })
      setEditing(false)
      await loadPage()
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Deletar esta pagina permanentemente?')) return
    await fetch(`/api/wiki/pages/${encodeURIComponent(slug)}`, { method: 'DELETE' })
    onDeleted()
  }

  if (loading) {
    return (
      <div className="w-[380px] flex-shrink-0 border-l border-white/[0.07] bg-bg-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="w-[380px] flex-shrink-0 border-l border-white/[0.07] bg-bg-1 flex items-center justify-center text-text-muted text-sm">
        Pagina nao encontrada
      </div>
    )
  }

  const meta = KIND_META[page.kind] ?? KIND_META.resource

  return (
    <div className="w-[380px] flex-shrink-0 border-l border-white/[0.07] bg-bg-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07]">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
        <span className="text-[9px] uppercase tracking-[0.15em]" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <div className="flex-1" />

        {editing ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1.5 rounded hover:bg-white/[0.05] text-emerald-400 transition-colors"
          >
            <Save size={14} strokeWidth={1.5} />
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded hover:bg-white/[0.05] text-text-secondary transition-colors"
          >
            <Edit3 size={14} strokeWidth={1.5} />
          </button>
        )}

        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-white/[0.05] text-red-400/60 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>

        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-white/[0.05] text-text-muted transition-colors"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {editing ? (
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Titulo</label>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-sm text-text-primary mt-1 focus:outline-none focus:border-amber/40"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Tipo</label>
              <select
                value={editKind}
                onChange={e => setEditKind(e.target.value as WikiPageKind)}
                className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-sm text-text-primary mt-1 focus:outline-none focus:border-amber/40"
              >
                {ALL_KINDS.map(k => (
                  <option key={k} value={k}>{KIND_META[k].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Resumo</label>
              <input
                value={editSummary}
                onChange={e => setEditSummary(e.target.value)}
                className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-sm text-text-primary mt-1 focus:outline-none focus:border-amber/40"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Niches (virgula)</label>
              <input
                value={editNiches}
                onChange={e => setEditNiches(e.target.value)}
                className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-sm text-text-primary mt-1 focus:outline-none focus:border-amber/40"
                placeholder="emagrecimento, saude"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Tags (virgula)</label>
              <input
                value={editTags}
                onChange={e => setEditTags(e.target.value)}
                className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-sm text-text-primary mt-1 focus:outline-none focus:border-amber/40"
                placeholder="copy, headline, roi"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Links To (slugs, virgula)</label>
              <input
                value={editLinksTo}
                onChange={e => setEditLinksTo(e.target.value)}
                className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-sm text-text-primary mt-1 focus:outline-none focus:border-amber/40"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Conteudo (Markdown)</label>
              <textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                rows={16}
                className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-2 text-xs text-text-primary mt-1 font-mono focus:outline-none focus:border-amber/40 resize-y"
              />
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Title */}
            <h2 className="text-lg font-semibold text-text-primary leading-tight">{page.title}</h2>

            {page.summary && (
              <p className="text-xs text-text-secondary leading-relaxed">{page.summary}</p>
            )}

            {/* Metadata badges */}
            <div className="flex flex-wrap gap-1.5">
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-mono border"
                style={{
                  borderColor: page.confidence >= 0.7 ? '#34D39940' : page.confidence >= 0.4 ? '#F4C43040' : '#EF444440',
                  color: page.confidence >= 0.7 ? '#34D399' : page.confidence >= 0.4 ? '#F4C430' : '#EF4444',
                }}
              >
                <Shield size={8} strokeWidth={1.5} className="inline mr-1" />
                {Math.round(page.confidence * 100)}%
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-text-muted border border-white/[0.07]">
                <Clock size={8} strokeWidth={1.5} className="inline mr-1" />
                {new Date(page.freshness).toLocaleDateString('pt-BR')}
              </span>
              {page.usage_count > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-text-muted border border-white/[0.07]">
                  {page.usage_count}x usado
                </span>
              )}
            </div>

            {/* Tags */}
            {page.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <Tag size={10} strokeWidth={1.5} className="text-text-muted mt-0.5" />
                {page.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 rounded bg-bg-3 text-[9px] text-text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Niches */}
            {page.niches.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {page.niches.map(niche => (
                  <span key={niche} className="px-1.5 py-0.5 rounded bg-amber/10 text-[9px] text-amber border border-amber/20">
                    {niche}
                  </span>
                ))}
              </div>
            )}

            {/* Body markdown */}
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-text-primary prose-headings:font-semibold
              prose-p:text-text-secondary prose-p:text-xs prose-p:leading-relaxed
              prose-li:text-text-secondary prose-li:text-xs
              prose-strong:text-text-primary
              prose-code:bg-bg-3 prose-code:px-1 prose-code:rounded prose-code:text-amber prose-code:text-[10px]
              prose-pre:bg-bg-3 prose-pre:border prose-pre:border-white/[0.07]
              prose-a:text-amber prose-a:no-underline hover:prose-a:underline
              prose-hr:border-white/[0.07]
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.body_md}</ReactMarkdown>
            </div>

            {/* Linked pages */}
            {page.linked_pages && page.linked_pages.length > 0 && (
              <div className="border-t border-white/[0.07] pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Link2 size={11} strokeWidth={1.5} className="text-text-muted" />
                  <span className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Paginas Ligadas</span>
                </div>
                <div className="space-y-1">
                  {page.linked_pages.map(lp => {
                    const lpMeta = KIND_META[lp.kind] ?? KIND_META.resource
                    return (
                      <button
                        key={lp.slug}
                        onClick={() => onNavigate(lp.slug)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded bg-bg-3 hover:bg-bg-4 text-left transition-colors group"
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lpMeta.color }} />
                        <span className="text-xs text-text-secondary group-hover:text-text-primary truncate">{lp.title}</span>
                        <span className="text-[9px] text-text-muted ml-auto">{lpMeta.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Revisions */}
            {page.revisions && page.revisions.length > 0 && (
              <div className="border-t border-white/[0.07] pt-3">
                <button
                  onClick={() => setShowRevisions(!showRevisions)}
                  className="flex items-center gap-1.5 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showRevisions ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  <span className="text-[9px] uppercase tracking-[0.15em]">
                    Historico ({page.revisions.length})
                  </span>
                </button>
                {showRevisions && (
                  <div className="mt-2 space-y-1.5">
                    {page.revisions.map(rev => (
                      <div key={rev.id} className="px-2 py-1.5 rounded bg-bg-3 text-[10px]">
                        <div className="flex items-center gap-2 text-text-muted">
                          <span className={cn(
                            "px-1 rounded",
                            rev.author === 'human' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber/10 text-amber'
                          )}>
                            {rev.author}
                          </span>
                          <span>{new Date(rev.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {rev.reason && <p className="text-text-muted mt-0.5">{rev.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
