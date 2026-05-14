"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, Pencil, Feather, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreamChat } from "@/hooks/useStreamChat";
import { VslSession } from "@/types";
import { COPYWRITERS } from "@/lib/copywriters";

export default function VslChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<VslSession | null>(null);
  useEffect(() => { fetch(`/api/vsl-studio/${sessionId}`).then(r => r.json()).then(d => setSession(d.session)); }, [sessionId]);

  const buildBody = useCallback((text: string) => ({ message: text }), []);
  const { messages, input, setInput, sendMessage, loading } = useStreamChat({ endpoint: `/api/vsl-studio/${sessionId}/chat`, buildBody });
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const contextInfo = () => {
    if (!session) return null;
    if (session.context_kind === "copywriter") { const cw = COPYWRITERS.find(c => c.id === session.context_id); return <><Feather size={12} strokeWidth={1.5} className="text-nova" /><span className="text-[11px] text-text-secondary">{cw?.name || session.context_id}</span></>; }
    return <><BookOpen size={12} strokeWidth={1.5} className="text-gold" /><span className="text-[11px] text-text-secondary">Livro</span></>;
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-bg-1">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.06] bg-bg-2/50 backdrop-blur-sm">
        <Link href="/vsl-studio" className="text-text-muted hover:text-text-secondary"><ArrowLeft size={16} strokeWidth={1.5} /></Link>
        <Pencil size={14} strokeWidth={1.5} className="text-nova" /><span className="text-[12px] text-text-primary font-medium">VSL Studio</span><span className="text-text-muted/30">·</span>{contextInfo()}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && <div className="flex flex-col items-center justify-center h-full text-center"><Pencil size={32} strokeWidth={1} className="text-text-muted/20 mb-3" /><p className="text-[13px] text-text-muted">Comece a escrever sua VSL</p><p className="text-[11px] text-text-muted/50 mt-1 max-w-sm">Descreva sua oferta, peca hooks, leads, mecanismos ou secoes inteiras</p></div>}
        {messages.map(msg => (
          <div key={msg.id} className={cn("max-w-[75%] rounded-xl px-4 py-3 text-[13px] leading-relaxed", msg.role === "user" ? "ml-auto bg-nova/10 border border-nova/15 text-text-primary" : "bg-bg-3 border border-white/[0.06] text-text-secondary")}>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.content === "" && <div className="flex items-center gap-2 text-text-muted"><Loader2 size={12} className="animate-spin" /><span className="text-[11px]">Escrevendo...</span></div>}
      </div>
      <div className="border-t border-white/[0.06] px-6 py-4 bg-bg-2/30">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder="Descreva o que precisa para a VSL..." rows={1} className="flex-1 bg-bg-3 border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-nova/30 resize-none" />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="p-3 rounded-xl bg-nova text-black hover:bg-nova/90 disabled:opacity-30"><Send size={16} strokeWidth={1.5} /></button>
        </div>
      </div>
    </div>
  );
}
