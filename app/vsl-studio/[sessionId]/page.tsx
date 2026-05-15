"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, Pencil, Feather, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VslSession, PersonaOffer } from "@/types";
import { COPYWRITERS } from "@/lib/copywriters";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  offerRefs?: { id: string; title: string }[];
}

export default function VslChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<VslSession | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [offers, setOffers] = useState<PersonaOffer[]>([]);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [showOfferPicker, setShowOfferPicker] = useState(false);

  useEffect(() => { fetch(`/api/vsl-studio/${sessionId}`).then(r => r.json()).then(d => setSession(d.session)); }, [sessionId]);
  useEffect(() => { fetch("/api/clientes/offers").then(r => r.ok ? r.json() : []).then(setOffers); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const toggleOffer = (id: string) => setSelectedOfferIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const refs = selectedOfferIds.map((oid) => { const o = offers.find((x) => x.id === oid); return o ? { id: oid, title: o.title } : null; }).filter(Boolean) as { id: string; title: string }[];
    const userMsg: LocalMessage = { id: crypto.randomUUID(), role: "user", content: text, offerRefs: refs.length > 0 ? refs : undefined };
    const aId = crypto.randomUUID();
    setMessages((p) => [...p, userMsg, { id: aId, role: "assistant", content: "" }]);
    setInput(""); setLoading(true);
    setSelectedOfferIds([]);

    try {
      const res = await fetch(`/api/vsl-studio/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, offer_ids: refs.length > 0 ? refs.map((r) => r.id) : undefined }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const l of lines) {
          if (!l.startsWith("data: ")) continue;
          const d = l.slice(6);
          if (d === "[DONE]") break;
          try { setMessages((p) => p.map((m) => m.id === aId ? { ...m, content: m.content + JSON.parse(d).text } : m)); } catch {}
        }
      }
    } catch {
      setMessages((p) => p.map((m) => m.id === aId ? { ...m, content: "Erro ao processar." } : m));
    } finally { setLoading(false); }
  }, [input, loading, sessionId, selectedOfferIds, offers]);

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
        {messages.length === 0 && <div className="flex flex-col items-center justify-center h-full text-center"><Pencil size={32} strokeWidth={1} className="text-text-muted/20 mb-3" /><p className="text-[13px] text-text-muted">Comece a escrever sua VSL</p><p className="text-[11px] text-text-muted/50 mt-1 max-w-sm">Descreva sua oferta, peca hooks, leads, mecanismos ou secoes inteiras. Use @ para referenciar uma oferta.</p></div>}
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className="max-w-[75%]">
              {msg.offerRefs && msg.offerRefs.length > 0 && (
                <div className={cn("flex items-center gap-1 mb-1 flex-wrap", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.offerRefs.map((ref) => (
                    <span key={ref.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold/10 border border-gold/20 text-gold text-[9px]">
                      <span className="font-semibold opacity-60">@</span>
                      <span className="truncate max-w-[120px]">{ref.title}</span>
                    </span>
                  ))}
                </div>
              )}
              <div className={cn("rounded-xl px-4 py-3 text-[13px] leading-relaxed", msg.role === "user" ? "bg-nova/10 border border-nova/15 text-text-primary" : "bg-bg-3 border border-white/[0.06] text-text-secondary")}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.content === "" && <div className="flex items-center gap-2 text-text-muted"><Loader2 size={12} className="animate-spin" /><span className="text-[11px]">Escrevendo...</span></div>}
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] px-6 py-4 bg-bg-2/30 relative">
        {/* @ picker */}
        {showOfferPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowOfferPicker(false)} />
            <div className="absolute bottom-full mb-1 left-6 w-[260px] bg-bg-3 border border-white/[0.12] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <p className="text-[8px] uppercase tracking-[0.18em] text-text-muted font-mono">@ Referenciar oferta</p>
              </div>
              <div className="max-h-[200px] overflow-y-auto p-1.5">
                {offers.length === 0 ? (
                  <p className="text-[10px] text-text-muted text-center py-4">Nenhuma oferta disponivel</p>
                ) : offers.map((o) => {
                  const sel = selectedOfferIds.includes(o.id);
                  const isBriefing = o.source === "briefing";
                  return (
                    <button key={o.id} onClick={() => { toggleOffer(o.id); if (!sel) setShowOfferPicker(false); }} className={cn("w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[10px] transition-colors", sel ? "bg-gold/10 text-gold" : "text-text-secondary hover:bg-white/[0.04]")}>
                      <span className={cn("text-[10px] font-bold", sel ? "text-gold" : "text-text-muted/40")}>@</span>
                      <span className="truncate flex-1">{o.title}</span>
                      <span className={cn("text-[7px] px-1 rounded uppercase font-semibold", isBriefing ? "bg-nova/10 text-nova" : "bg-white/[0.04] text-text-muted")}>{isBriefing ? "Oferta" : "Copy"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="max-w-3xl mx-auto">
          <div className={cn("flex items-center gap-1.5 rounded-2xl border bg-bg-3 transition-all flex-wrap px-3 py-1.5 min-h-[44px]", input.trim() || selectedOfferIds.length > 0 ? "border-white/[0.10]" : "border-white/[0.08]", loading && "opacity-50 pointer-events-none")}>
            {selectedOfferIds.map((oid) => {
              const o = offers.find((x) => x.id === oid);
              if (!o) return null;
              return (
                <span key={oid} className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-md bg-gold/12 border border-gold/20 text-gold text-[11px] shrink-0 max-w-[160px]">
                  <span className="text-[11px] font-semibold opacity-60">@</span>
                  <span className="truncate text-[11px]">{o.title}</span>
                  <button onClick={() => toggleOffer(oid)} className="p-0.5 rounded hover:bg-gold/20 ml-0.5 shrink-0"><X size={9} strokeWidth={2} /></button>
                </span>
              );
            })}
            <input value={input} onChange={(e) => { const v = e.target.value; setInput(v); if (v.endsWith("@")) { setShowOfferPicker(true); setInput(v.slice(0, -1)); } }} onKeyDown={onKey} placeholder={selectedOfferIds.length > 0 ? "Sua mensagem..." : "Descreva o que precisa... (@ para oferta)"} className="flex-1 min-w-[120px] bg-transparent py-1.5 text-[13px] text-text-primary placeholder:text-text-muted/40 focus:outline-none" />
            <button onClick={sendMessage} disabled={loading || !input.trim()} className={cn("p-2 rounded-full transition-all shrink-0", input.trim() ? "bg-nova text-black hover:bg-nova/90 opacity-100" : "text-text-muted/20 opacity-0 pointer-events-none")}>
              <Send size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
