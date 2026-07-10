"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { ALL_KINDS, KIND_META, type WikiPageKind } from '@/types/knowledge'
import { cn } from '@/lib/utils'

interface Props {
  onClose: () => void
  onCreated: (slug: string) => void
}

export default function CreatePageModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<WikiPageKind>('resource')
  const [summary, setSummary] = useState('')
  const [bodyMd, setBodyMd] = useState('')
  const [niches, setNiches] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!title.trim() || !bodyMd.trim()) {
      setError('Titulo e conteudo sao obrigatorios')
      return
    }

    setSaving(true)
    setError('')

    const slug = `${kind}--${title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)}`

    try {
      const res = await fetch('/api/wiki/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          kind,
          title: title.trim(),
          summary: summary.trim() || null,
          body_md: bodyMd,
          niches: niches.split(',').map(n => n.trim()).filter(Boolean),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar')
      onCreated(slug)
    } catch (err) {
      setError((err as Error).message)
    }

    setSaving(false)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="fixed inset-0 bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-[#0B0B0C] border border-white/[0.04] rounded-2xl w-[520px] max-h-[85vh] flex flex-col shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 380, mass: 0.8 }}
      >
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.07]">
          <Plus size={14} strokeWidth={1.5} className="text-amber" />
          <span className="text-sm font-medium text-text-primary">Criar Pagina</span>
          <div className="flex-1" />
          <button onClick={onClose} className="p-1 rounded hover:bg-white/[0.05] text-text-muted">
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Titulo *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-sm text-text-primary mt-1 focus:outline-none focus:border-amber/40"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Tipo</label>
              <select
                value={kind}
                onChange={e => setKind(e.target.value as WikiPageKind)}
                className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-sm text-text-primary mt-1 focus:outline-none focus:border-amber/40"
              >
                {ALL_KINDS.map(k => (
                  <option key={k} value={k}>{KIND_META[k].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Resumo</label>
            <input
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Uma linha descrevendo a pagina"
              className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-xs text-text-primary mt-1 focus:outline-none focus:border-amber/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Niches (virgula)</label>
              <input
                value={niches}
                onChange={e => setNiches(e.target.value)}
                placeholder="geral, financeiro"
                className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-xs text-text-primary mt-1 focus:outline-none focus:border-amber/40"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Tags (virgula)</label>
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="contrato, sop"
                className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-xs text-text-primary mt-1 focus:outline-none focus:border-amber/40"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Conteudo (Markdown) *</label>
            <textarea
              value={bodyMd}
              onChange={e => setBodyMd(e.target.value)}
              rows={12}
              placeholder="# Titulo&#10;&#10;Conteudo em markdown..."
              className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-2 text-xs text-text-primary mt-1 font-mono focus:outline-none focus:border-amber/40 resize-y"
            />
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}
        </div>

        <div className="px-5 py-3 border-t border-white/[0.07] flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded text-xs text-text-muted hover:text-text-secondary">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !title.trim() || !bodyMd.trim()}
            className="px-4 py-1.5 rounded-lg bg-amber text-black text-xs font-medium hover:bg-amber-hover disabled:opacity-30 transition-colors"
          >
            {saving ? 'Criando...' : 'Criar Pagina'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
