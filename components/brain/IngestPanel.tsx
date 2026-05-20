"use client"

import { useState, useRef } from 'react'
import { Upload, FileText, Link, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { ALL_KINDS, KIND_META, type WikiPageKind, type RawSourceKind } from '@/types/knowledge'
import { cn } from '@/lib/utils'

interface Props {
  onIngested: () => void
  onClose: () => void
}

type IngestStatus = 'idle' | 'uploading' | 'success' | 'error'

export default function IngestPanel({ onIngested, onClose }: Props) {
  const [mode, setMode] = useState<'file' | 'text' | 'url'>('file')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [niche, setNiche] = useState('')
  const [sourceKind, setSourceKind] = useState<RawSourceKind>('manual')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<IngestStatus>('idle')
  const [result, setResult] = useState<{ pages_created: number; pages_updated: number; slugs: string[] } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    setStatus('uploading')
    setError('')
    setResult(null)

    try {
      if (mode === 'file' && file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', title || file.name.replace(/\.[^.]+$/, ''))
        if (author) formData.append('author', author)
        if (niche) formData.append('niche', niche)
        formData.append('kind', sourceKind)

        const res = await fetch('/api/wiki/ingest', { method: 'POST', body: formData })
        if (!res.ok) throw new Error((await res.json()).error || 'Erro no upload')
        setResult(await res.json())
      } else if (mode === 'text' && content.length >= 50) {
        const res = await fetch('/api/wiki/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || 'Documento colado',
            author: author || undefined,
            niche: niche || undefined,
            kind: sourceKind,
            content,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Erro no ingest')
        setResult(await res.json())
      } else if (mode === 'url' && url) {
        const res = await fetch('/api/wiki/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || url,
            kind: 'manual',
            content: `URL para processar: ${url}`,
            source_url: url,
            niche: niche || undefined,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Erro no ingest')
        setResult(await res.json())
      } else {
        throw new Error('Preencha os campos obrigatorios')
      }

      setStatus('success')
      onIngested()
    } catch (err) {
      setStatus('error')
      setError((err as Error).message)
    }
  }

  const reset = () => {
    setStatus('idle')
    setResult(null)
    setError('')
    setFile(null)
    setContent('')
    setUrl('')
    setTitle('')
  }

  return (
    <div className="w-[380px] flex-shrink-0 border-l border-white/[0.07] bg-bg-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07]">
        <Upload size={14} strokeWidth={1.5} className="text-amber" />
        <span className="text-xs font-medium text-text-primary">Ingerir Documento</span>
        <div className="flex-1" />
        <button onClick={onClose} className="p-1 rounded hover:bg-white/[0.05] text-text-muted">
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mode selector */}
        <div className="flex gap-1 bg-bg-3 rounded-lg p-0.5">
          {[
            { id: 'file' as const, label: 'Arquivo', icon: FileText },
            { id: 'text' as const, label: 'Texto', icon: FileText },
            { id: 'url' as const, label: 'URL', icon: Link },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] transition-colors",
                mode === m.id
                  ? "bg-bg-4 text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              <m.icon size={11} strokeWidth={1.5} />
              {m.label}
            </button>
          ))}
        </div>

        {/* Source kind */}
        <div>
          <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Tipo de Fonte</label>
          <select
            value={sourceKind}
            onChange={e => setSourceKind(e.target.value as RawSourceKind)}
            className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-xs text-text-primary mt-1 focus:outline-none focus:border-amber/40"
          >
            <option value="manual">Manual / Geral</option>
            <option value="book">Livro</option>
            <option value="transcript">Transcricao</option>
            <option value="swipe">Swipe File / Copy</option>
            <option value="competitor_asset">Ativo de Concorrente</option>
            <option value="review_corpus">Corpus de Reviews</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Titulo</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nome do documento"
            className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-xs text-text-primary mt-1 focus:outline-none focus:border-amber/40"
          />
        </div>

        {/* Author + Niche */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Autor</label>
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-xs text-text-primary mt-1 focus:outline-none focus:border-amber/40"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Nicho</label>
            <input
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-xs text-text-primary mt-1 focus:outline-none focus:border-amber/40"
            />
          </div>
        </div>

        {/* Input area */}
        {mode === 'file' && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.md,.txt"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-white/[0.1] rounded-lg py-8 flex flex-col items-center gap-2 hover:border-amber/30 transition-colors"
            >
              <Upload size={20} strokeWidth={1.5} className="text-text-muted" />
              <span className="text-xs text-text-muted">
                {file ? file.name : 'Clique ou arraste — PDF, MD, TXT'}
              </span>
            </button>
          </div>
        )}

        {mode === 'text' && (
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">Conteudo</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={10}
              placeholder="Cole o conteudo aqui (minimo 50 caracteres)..."
              className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-2 text-xs text-text-primary mt-1 focus:outline-none focus:border-amber/40 resize-y"
            />
            <span className="text-[9px] text-text-muted mt-1">{content.length} caracteres</span>
          </div>
        )}

        {mode === 'url' && (
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-text-muted">URL</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-bg-3 border border-white/[0.07] rounded px-2.5 py-1.5 text-xs text-text-primary mt-1 focus:outline-none focus:border-amber/40"
            />
          </div>
        )}

        {/* Result */}
        {status === 'success' && result && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 size={14} strokeWidth={1.5} />
              Documento destilado com sucesso
            </div>
            <div className="text-[10px] text-text-secondary font-mono">
              {result.pages_created} criadas, {result.pages_updated} atualizadas
            </div>
            {result.slugs.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {result.slugs.map(s => (
                  <span key={s} className="px-1.5 py-0.5 rounded bg-bg-3 text-[9px] text-text-muted truncate max-w-[140px]">
                    {s}
                  </span>
                ))}
              </div>
            )}
            <button onClick={reset} className="text-[10px] text-amber hover:underline mt-2">
              Ingerir outro
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle size={14} strokeWidth={1.5} />
              {error}
            </div>
            <button onClick={reset} className="text-[10px] text-amber hover:underline mt-2">
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/* Submit */}
      {status === 'idle' && (
        <div className="px-4 py-3 border-t border-white/[0.07]">
          <button
            onClick={handleSubmit}
            disabled={
              (mode === 'file' && !file) ||
              (mode === 'text' && content.length < 50) ||
              (mode === 'url' && !url)
            }
            className="w-full py-2 rounded-lg bg-amber text-black text-xs font-medium hover:bg-amber-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Destilar Documento
          </button>
        </div>
      )}

      {status === 'uploading' && (
        <div className="px-4 py-3 border-t border-white/[0.07] flex items-center justify-center gap-2 text-amber text-xs">
          <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
          Destilando via IA...
        </div>
      )}
    </div>
  )
}
