"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LayoutApp from "@/app/layout-app";
import { Pencil, Plus, Loader2, MessageSquare, BookOpen, Feather, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VslSession, Book } from "@/types";
import { COPYWRITERS } from "@/lib/copywriters";

export default function VslStudioPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<VslSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"copywriter" | "book">("copywriter");
  const [books, setBooks] = useState<Book[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetch("/api/vsl-studio").then(r => r.json()).then(d => { setSessions(d); setLoading(false); }); }, []);
  const openModal = async () => { setShowModal(true); const r = await fetch("/api/biblioteca"); if (r.ok) { const d = await r.json(); setBooks(d.filter((b: Book) => b.status === "ready")); } };
  const create = async (kind: "copywriter" | "book", id: string, title: string) => { setCreating(true); const r = await fetch("/api/vsl-studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context_kind: kind, context_id: id, title }) }); if (r.ok) { const s = await r.json(); router.push(`/vsl-studio/${s.id}`); } setCreating(false); };
  const getLabel = (s: VslSession) => s.context_kind === "copywriter" ? (COPYWRITERS.find(c => c.id === s.context_id)?.name || s.context_id) : "Livro";

  return (
    <LayoutApp>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">Knowledge System</p>
            <h1 className="text-2xl font-display text-text-primary">VSL Studio</h1>
            <p className="text-sm text-text-secondary mt-1">Escreva copys de VSL com IA baseada em copywriters lendarios ou livros</p>
          </div>
          <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nova/10 border border-nova/20 text-nova text-[11px] font-semibold uppercase tracking-[0.12em] hover:bg-nova/15"><Plus size={14} strokeWidth={1.5} /> Nova sessao</button>
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 size={20} className="animate-spin text-text-muted" /></div> : sessions.length === 0 ? (
          <div className="text-center py-20"><Pencil size={32} strokeWidth={1} className="text-text-muted/30 mx-auto mb-3" /><p className="text-[13px] text-text-muted">Nenhuma sessao de VSL</p></div>
        ) : (
          <div className="space-y-2">{sessions.map(s => (
            <button key={s.id} onClick={() => router.push(`/vsl-studio/${s.id}`)} className="w-full flex items-center gap-3 p-4 rounded-xl bg-bg-3 border border-white/[0.06] hover:border-white/[0.10] text-left group">
              <MessageSquare size={14} strokeWidth={1.5} className="text-text-muted group-hover:text-nova flex-shrink-0" />
              <div className="min-w-0 flex-1"><p className="text-[12px] text-text-primary truncate">{s.title || "Nova sessao"}</p><div className="flex items-center gap-2 mt-0.5"><span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-text-muted border border-white/[0.06]">{s.context_kind === "copywriter" ? "Copywriter" : "Livro"}</span><span className="text-[10px] text-text-muted/60">{getLabel(s)}</span></div></div>
              <span className="text-[10px] text-text-muted/50 font-mono flex-shrink-0">{new Date(s.last_message_at).toLocaleDateString("pt-BR")}</span>
            </button>
          ))}</div>
        )}

        <AnimatePresence>
        {showModal && (
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
              onClick={() => setShowModal(false)}
            />
            <motion.div
              className="relative w-full max-w-lg mx-4 bg-[#0B0B0C] border border-white/[0.04] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 380, mass: 0.8 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]"><h2 className="text-[14px] font-semibold text-text-primary">Escolha o contexto</h2><button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-secondary"><X size={16} strokeWidth={1.5} /></button></div>
              <div className="flex items-center gap-1 px-5 pt-4 pb-2">
                <button onClick={() => setTab("copywriter")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium", tab === "copywriter" ? "bg-white/[0.08] text-text-primary" : "text-text-muted")}><Feather size={12} strokeWidth={1.5} /> Copywriters</button>
                <button onClick={() => setTab("book")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium", tab === "book" ? "bg-white/[0.08] text-text-primary" : "text-text-muted")}><BookOpen size={12} strokeWidth={1.5} /> Livros</button>
              </div>
              <div className="px-5 pb-5 max-h-[400px] overflow-y-auto">
                {tab === "copywriter" ? (
                  <div className="space-y-2 mt-2">{COPYWRITERS.map(cw => (
                    <button key={cw.id} onClick={() => create("copywriter", cw.id, `VSL com ${cw.name}`)} disabled={creating} className="w-full flex items-start gap-3 p-4 rounded-xl bg-bg-3 border border-white/[0.06] hover:border-nova/20 text-left disabled:opacity-50">
                      <div className="w-9 h-9 rounded-lg bg-nova/10 flex items-center justify-center flex-shrink-0"><Feather size={16} strokeWidth={1.5} className="text-nova" /></div>
                      <div><p className="text-[12px] font-semibold text-text-primary">{cw.name}</p><p className="text-[10px] text-text-muted/60 font-mono">{cw.era}</p><p className="text-[10px] text-text-muted mt-1">{cw.description}</p></div>
                    </button>
                  ))}</div>
                ) : (
                  <div className="space-y-2 mt-2">{books.length === 0 ? <div className="text-center py-8"><BookOpen size={24} strokeWidth={1} className="text-text-muted/30 mx-auto mb-2" /><p className="text-[12px] text-text-muted">Nenhum livro disponivel</p></div> : books.map(b => (
                    <button key={b.id} onClick={() => create("book", b.id, `VSL com ${b.title}`)} disabled={creating} className="w-full flex items-start gap-3 p-4 rounded-xl bg-bg-3 border border-white/[0.06] hover:border-gold/20 text-left disabled:opacity-50">
                      <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0"><BookOpen size={16} strokeWidth={1.5} className="text-gold" /></div>
                      <div><p className="text-[12px] font-semibold text-text-primary">{b.title}</p>{b.author && <p className="text-[10px] text-text-muted">{b.author}</p>}<p className="text-[10px] text-text-muted/50 font-mono mt-0.5">{b.chunk_count} chunks</p></div>
                    </button>
                  ))}</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </LayoutApp>
  );
}
