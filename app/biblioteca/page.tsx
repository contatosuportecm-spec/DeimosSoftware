"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import LayoutApp from "@/app/layout-app";
import {
  BookOpen, Send, Loader2, Upload, Trash2, ChevronDown, Plus, X,
  MessageSquare, Check, Search, FileText, MoreHorizontal, Youtube, Link,
  Pin, PinOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Book, PersonaOffer } from "@/types";
import { COPYWRITERS } from "@/lib/copywriters";
import type { Copywriter } from "@/types";
import MarkdownMessage from "@/components/ui/MarkdownMessage";

/* ───────── Types ───────── */

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  offerRefs?: { id: string; title: string }[];
}

interface Session {
  id: string;
  title: string | null;
  pinned: boolean | null;
  last_message_at: string;
}

/* ───────── Page ───────── */

export default function BibliotecaPage() {
  /* — state — */
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [showBookPicker, setShowBookPicker] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("biblioteca-draft") || "";
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");

  const [showDocs, setShowDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAuthor, setUploadAuthor] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [docTab, setDocTab] = useState<"pdf" | "youtube">("pdf");
  const [ytLinks, setYtLinks] = useState<string[]>([""]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState("");
  const [offers, setOffers] = useState<PersonaOffer[]>([]);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [showOfferPicker, setShowOfferPicker] = useState(false);
  const [copywriterId, setCopywriterId] = useState<string | null>(null);
  const activeCopywriter = copywriterId ? COPYWRITERS.find((c) => c.id === copywriterId) : null;

  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* — fetchers — */
  const fetchBooks = useCallback(async () => {
    const r = await fetch("/api/biblioteca");
    if (r.ok) setBooks((await r.json()).filter((b: Book) => b.status === "ready"));
  }, []);

  const fetchSessions = useCallback(async () => {
    const r = await fetch("/api/biblioteca/sessions");
    if (r.ok) setSessions(await r.json());
  }, []);

  const fetchOffers = useCallback(async () => {
    const r = await fetch("/api/clientes/offers");
    if (r.ok) setOffers(await r.json());
  }, []);
  const toggleOffer = (id: string) => setSelectedOfferIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  useEffect(() => { fetchBooks(); fetchSessions(); fetchOffers(); }, [fetchBooks, fetchSessions, fetchOffers]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Persist draft input to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("biblioteca-draft", input);
  }, [input]);

  /* — session actions — */
  const newSession = useCallback(async () => {
    // If current session is empty (no messages), just stay on it
    if (sessionId && messages.length === 0) return;

    const r = await fetch("/api/biblioteca/sessions", { method: "POST" });
    if (r.ok) {
      const s = await r.json();
      setSessionId(s.id);
      setMessages([]);
      fetchSessions();
    }
  }, [fetchSessions, sessionId, messages.length]);

  const loadSession = useCallback(async (sid: string) => {
    setSessionId(sid);
    const r = await fetch(`/api/biblioteca/sessions/${sid}`);
    if (r.ok) {
      const data = await r.json();
      setMessages(
        (data.messages || []).map((m: { id: string; role: string; content: string }) => ({
          id: m.id, role: m.role as "user" | "assistant", content: m.content,
        }))
      );
    }
  }, []);

  /* — chat — */
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    let sid = sessionId;
    if (!sid) {
      const r = await fetch("/api/biblioteca/sessions", { method: "POST" });
      if (!r.ok) return;
      const s = await r.json();
      sid = s.id;
      setSessionId(sid);
    }

    const refs = selectedOfferIds.map((oid) => { const o = offers.find((x) => x.id === oid); return o ? { id: oid, title: o.title } : null; }).filter(Boolean) as { id: string; title: string }[];
    const userMsg: LocalMessage = { id: crypto.randomUUID(), role: "user", content: text, offerRefs: refs.length > 0 ? refs : undefined };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setSelectedOfferIds([]);
    if (typeof window !== "undefined") localStorage.removeItem("biblioteca-draft");
    setLoading(true);

    try {
      const res = await fetch("/api/biblioteca/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, bookIds: selectedBookIds, message: text, offer_ids: refs.length > 0 ? refs.map((r) => r.id) : undefined, copywriter_id: copywriterId || undefined }),
      });
      if (!res.ok) throw new Error("API error");
      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6);
          if (d === "[DONE]") break;
          try {
            const { text: chunk } = JSON.parse(d);
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
            );
          } catch {}
        }
      }
      fetchSessions();
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: "Erro ao processar. Tente novamente." } : m))
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId, selectedBookIds, fetchSessions]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* — upload — */
  const processUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (uploadTitle) fd.append("title", uploadTitle);
    if (uploadAuthor) fd.append("author", uploadAuthor);
    const res = await fetch("/api/biblioteca/upload", { method: "POST", body: fd });
    if (res.ok) { setUploadTitle(""); setUploadAuthor(""); await fetchBooks(); }
    setUploading(false);
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await processUpload(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") await processUpload(file);
  };

  const handleYoutube = async () => {
    const validLinks = ytLinks.filter((l) => l.trim());
    if (validLinks.length === 0) return;
    setYtLoading(true);
    setYtError("");
    const res = await fetch("/api/biblioteca/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: validLinks, title: uploadTitle, author: uploadAuthor }),
    });
    if (res.ok) {
      setYtLinks([""]);
      setUploadTitle("");
      setUploadAuthor("");
      await fetchBooks();
    } else {
      const data = await res.json();
      setYtError(data.error || "Erro ao transcrever video");
    }
    setYtLoading(false);
  };

  const deleteSession = async (sid: string) => {
    await fetch(`/api/biblioteca/sessions/${sid}`, { method: "DELETE" });
    if (sessionId === sid) { setSessionId(null); setMessages([]); }
    fetchSessions();
  };

  const togglePinSession = async (sid: string, currentPinned: boolean | null) => {
    await fetch(`/api/biblioteca/sessions/${sid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !currentPinned }),
    });
    fetchSessions();
  };

  const addYtLink = () => setYtLinks((prev) => [...prev, ""]);
  const updateYtLink = (i: number, val: string) => { setYtLinks((prev) => prev.map((l, idx) => idx === i ? val : l)); setYtError(""); };
  const removeYtLink = (i: number) => setYtLinks((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

  const handleDelete = async (id: string) => {
    await fetch(`/api/biblioteca/${id}`, { method: "DELETE" });
    setSelectedBookIds((prev) => prev.filter((bid) => bid !== id));
    fetchBooks();
  };

  /* — derived — */
  const selectedBooks = books.filter((b) => selectedBookIds.includes(b.id));
  const toggleBook = (id: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const activeSession = sessions.find((s) => s.id === sessionId);
  const filteredSessions = sessions.filter(
    (s) => !sessionSearch || (s.title || "").toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return `Hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    if (diff < 172800000) return `Ontem, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  /* ───────── Render ───────── */

  return (
    <LayoutApp>
      <div className="flex h-full overflow-hidden">

        {/* ══════ LEFT — Conversations ══════ */}
        <div className="w-[260px] flex-shrink-0 border-r border-white/[0.08] flex flex-col bg-bg-2">
          {/* Header */}
          <div className="px-5 pt-6 pb-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted mb-4 font-mono">
              Conversas
            </p>
            <div className="relative">
              <Search size={13} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
              <input
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                placeholder="Buscar conversas..."
                className="w-full bg-bg-3 border border-white/[0.10] rounded-lg pl-9 pr-3 py-2 text-[11px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-gold/30 transition-colors"
              />
            </div>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
            {filteredSessions.map((s) => (
              <div
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 relative cursor-pointer group",
                  s.id === sessionId
                    ? "bg-white/[0.08]"
                    : "hover:bg-white/[0.05]"
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {s.pinned && <Pin size={9} strokeWidth={2} className="text-gold shrink-0 mt-0.5" />}
                      <p className={cn(
                        "text-[12px] truncate leading-tight",
                        s.id === sessionId ? "text-text-primary font-medium" : "text-text-secondary"
                      )}>
                        {s.title || "Nova conversa"}
                      </p>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1 font-mono">
                      {formatDate(s.last_message_at)}
                    </p>
                  </div>
                  {/* Actions — visible on hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePinSession(s.id, s.pinned); }}
                      className="p-1 rounded hover:bg-white/[0.08] text-text-muted/50 hover:text-gold transition-colors"
                      title={s.pinned ? "Desafixar" : "Fixar"}
                    >
                      {s.pinned ? <PinOff size={10} strokeWidth={1.5} /> : <Pin size={10} strokeWidth={1.5} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                      className="p-1 rounded hover:bg-red-500/10 text-text-muted/50 hover:text-red-400 transition-colors"
                      title="Apagar"
                    >
                      <Trash2 size={10} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                {s.id === sessionId && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-gold rounded-r" />
                )}
              </div>
            ))}
            {filteredSessions.length === 0 && (
              <p className="text-[11px] text-text-muted text-center py-8">
                {sessionSearch ? "Nenhum resultado" : "Nenhuma conversa"}
              </p>
            )}
          </div>

          {/* New conversation button */}
          <div className="p-3 border-t border-white/[0.08]">
            <button
              onClick={newSession}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/[0.10] text-[11px] text-text-secondary hover:text-text-primary hover:bg-white/[0.06] hover:border-white/[0.15] transition-all"
            >
              <Plus size={13} strokeWidth={1.5} />
              Nova conversa
            </button>
          </div>
        </div>

        {/* ══════ CENTER — Chat ══════ */}
        <div className="flex-1 flex flex-col min-w-0 bg-bg-1">
          {/* Chat header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3 min-w-0">
              {activeSession ? (
                <h2 className="text-[13px] text-text-primary font-medium truncate">
                  {activeSession.title || "Nova conversa"}
                </h2>
              ) : (
                <div className="flex items-center gap-2.5">
                  <BookOpen size={15} strokeWidth={1.5} className="text-gold" />
                  <div>
                    <h2 className="text-[13px] text-text-primary font-medium">Biblioteca</h2>
                    <p className="text-[10px] text-text-muted">Converse com seus documentos</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {/* Copywriter voice selector */}
              <select
                value={copywriterId || ""}
                onChange={(e) => setCopywriterId(e.target.value || null)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border bg-bg-3 appearance-none cursor-pointer pr-6",
                  copywriterId
                    ? "border-gold/25 text-gold bg-gold/8"
                    : "border-white/[0.10] text-text-muted hover:text-text-secondary"
                )}
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B6B73' stroke-width='1.2' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
              >
                <option value="">Voz: Neutra</option>
                {COPYWRITERS.map((cw) => (
                  <option key={cw.id} value={cw.id}>{cw.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowDocs(!showDocs)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-medium uppercase tracking-[0.08em] transition-all border",
                  showDocs
                    ? "bg-nova/12 border-nova/25 text-nova"
                    : "border-white/[0.10] text-text-secondary hover:text-text-primary hover:border-white/[0.15]"
                )}
              >
                <FileText size={12} strokeWidth={1.5} />
                Documentos
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 fluid-chat-bg">
                <div className="ai-orb-empty mb-6">
                  <div className="ai-orb-container">
                    <div className="ai-orb-c ai-orb-c4" />
                    <div className="ai-orb-c ai-orb-c3" />
                    <div className="ai-orb-c ai-orb-c2" />
                    <div className="ai-orb-c ai-orb-c1" />
                  </div>
                  <div className="ai-orb-glass" />
                  <div className="ai-orb-rings">
                    <div className="ai-orb-ring ai-orb-ring-1" />
                    <div className="ai-orb-ring ai-orb-ring-2" />
                  </div>
                </div>
                <p className="text-[15px] text-text-secondary font-light">
                  Pergunte sobre seus documentos
                </p>
                <p className="text-[11px] text-text-muted mt-2 max-w-xs leading-relaxed">
                  {selectedBooks.length > 0
                    ? `Referenciando: ${selectedBooks.map((b) => b.title).join(", ")}`
                    : "Selecione documentos abaixo para usar como base de conhecimento"}
                </p>
              </div>
            ) : (
              <div className="px-6 py-6 space-y-5 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className="max-w-[80%]">
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
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-[13px] leading-[1.7]",
                          msg.role === "user"
                            ? "bg-bg-3 border border-white/[0.10] text-text-primary"
                            : "bg-bg-2 border border-white/[0.06] text-text-secondary"
                        )}
                      >
                        <MarkdownMessage content={msg.content} />
                      </div>
                    </div>
                  </div>
                ))}

                {loading && messages[messages.length - 1]?.content === "" && (
                  <div className="flex items-center gap-3 py-3 animate-fade-in">
                    <div className="ai-orb-mini">
                      <div className="ai-orb-container">
                        <div className="ai-orb-c ai-orb-c4" />
                        <div className="ai-orb-c ai-orb-c3" />
                        <div className="ai-orb-c ai-orb-c2" />
                        <div className="ai-orb-c ai-orb-c1" />
                      </div>
                      <div className="ai-orb-glass" />
                    </div>
                    <div>
                      <span className="text-[11px] text-text-secondary animate-pulse">
                        {selectedBooks.length > 1 ? "Cruzando documentos" : selectedBooks.length === 1 ? "Analisando documento" : "Pensando"}
                        <span className="loading-dots" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input zone */}
          <div className="border-t border-white/[0.08] px-6 py-4 bg-bg-2/40 relative">
            {/* @ offer picker — positioned above input zone */}
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
              {/* Document selector — multi-select pills */}
              <div className="relative mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Selected document pills */}
                  {selectedBooks.map((b) => (
                    <span key={b.id} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-[10px] bg-gold/10 border border-gold/20 text-gold">
                      <BookOpen size={9} strokeWidth={1.5} />
                      <span className="max-w-[120px] truncate">{b.title}</span>
                      <button onClick={() => toggleBook(b.id)} className="p-0.5 rounded-full hover:bg-gold/20 transition-colors">
                        <X size={8} strokeWidth={2} />
                      </button>
                    </span>
                  ))}
                  {/* Add document button */}
                  <button
                    onClick={() => setShowBookPicker(!showBookPicker)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] transition-all border",
                      "bg-bg-3 border-white/[0.10] text-text-muted hover:text-text-secondary hover:border-white/[0.15]"
                    )}
                  >
                    <Plus size={9} strokeWidth={2} />
                    {selectedBooks.length === 0 ? "Selecionar documento" : "Adicionar"}
                  </button>
                </div>

                {showBookPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowBookPicker(false)} />
                    <div className="absolute bottom-full mb-2 left-0 w-[280px] bg-bg-3 border border-white/[0.12] rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.08]">
                        <p className="text-[9px] uppercase tracking-[0.18em] text-text-muted font-mono">
                          Selecionar documentos
                        </p>
                        {selectedBookIds.length > 0 && (
                          <button onClick={() => setSelectedBookIds([])} className="text-[9px] text-text-muted hover:text-red-400 transition-colors">
                            Limpar
                          </button>
                        )}
                      </div>
                      <div className="max-h-[240px] overflow-y-auto p-1.5">
                        {books.map((b) => {
                          const isSelected = selectedBookIds.includes(b.id);
                          return (
                            <button
                              key={b.id}
                              onClick={() => toggleBook(b.id)}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] transition-colors",
                                isSelected ? "bg-gold/10 text-text-primary" : "text-text-secondary hover:bg-white/[0.05]"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                isSelected ? "bg-gold border-gold" : "border-white/[0.15]"
                              )}>
                                {isSelected && <Check size={10} strokeWidth={3} className="text-black" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate">{b.title}</p>
                                {b.author && <p className="text-[9px] text-text-muted truncate">{b.author}</p>}
                              </div>
                              <span className="text-[8px] text-text-muted/50 font-mono shrink-0">{b.source_type === "youtube" ? "YT" : "PDF"}</span>
                            </button>
                          );
                        })}
                        {books.length === 0 && (
                          <p className="text-[10px] text-text-muted text-center py-4">Nenhum documento disponivel</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Input row — pill style */}
              <div className="relative">
                <div className={cn(
                  "flex items-center gap-1.5 rounded-2xl border transition-all duration-300 flex-wrap px-3 py-1.5 min-h-[44px]",
                  input.trim() || selectedOfferIds.length > 0 ? "bg-bg-3 border-white/[0.14]" : "bg-bg-3 border-white/[0.08]",
                  loading && "opacity-60 pointer-events-none"
                )}>
                  {/* Inline @ chips */}
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

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => { const v = e.target.value; setInput(v); if (v.endsWith("@")) { setShowOfferPicker(true); setInput(v.slice(0, -1)); } }}
                    onKeyDown={onKey}
                    placeholder={selectedOfferIds.length > 0 ? "Sua pergunta..." : (selectedBooks.length > 0 ? `Pergunte sobre ${selectedBooks.length === 1 ? `"${selectedBooks[0].title}"` : `${selectedBooks.length} documentos`}...` : "Selecione documentos e pergunte... (@ para oferta)")}
                    className="flex-1 min-w-[120px] bg-transparent py-1.5 text-[13px] text-text-primary placeholder:text-text-muted/40 focus:outline-none"
                  />

                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className={cn(
                      "p-2 rounded-full transition-all duration-300 shrink-0",
                      input.trim()
                        ? "bg-nova text-black hover:bg-nova/80 active:scale-[0.93] opacity-100"
                        : "bg-transparent text-text-muted/30 scale-75 opacity-0 pointer-events-none"
                    )}
                  >
                    <Send size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <p className="text-[9px] text-text-muted/40 text-center mt-2">
                A IA responde com base no documento selecionado
              </p>
            </div>
          </div>
        </div>

        {/* ══════ RIGHT — Documents Panel ══════ */}
        {showDocs && (
          <div className="w-[300px] flex-shrink-0 border-l border-white/[0.08] flex flex-col bg-bg-2">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <p className="text-[13px] text-text-primary font-medium">Documentos</p>
              <button
                onClick={() => setShowDocs(false)}
                className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-white/[0.06] transition-colors"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            {/* Source toggle + upload */}
            <div className="px-4 pb-4">
              {/* Tab toggle */}
              <div className="flex items-center gap-1 p-1 bg-bg-3 rounded-lg mb-3">
                <button
                  onClick={() => setDocTab("pdf")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-colors",
                    docTab === "pdf" ? "bg-white/[0.08] text-text-primary" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <FileText size={11} strokeWidth={1.5} /> PDF
                </button>
                <button
                  onClick={() => setDocTab("youtube")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-colors",
                    docTab === "youtube" ? "bg-white/[0.08] text-text-primary" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <Youtube size={11} strokeWidth={1.5} /> YouTube
                </button>
              </div>

              {docTab === "pdf" ? (
                /* PDF upload zone */
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center py-6 rounded-xl border border-dashed cursor-pointer transition-all",
                    dragOver
                      ? "border-nova/50 bg-nova/[0.06]"
                      : "border-white/[0.12] bg-bg-3/50 hover:border-white/[0.20] hover:bg-bg-3"
                  )}
                >
                  <Upload size={20} strokeWidth={1.5} className={cn("mb-2", dragOver ? "text-nova" : "text-text-muted/50")} />
                  <p className="text-[11px] text-text-secondary">
                    Arraste um PDF ou <span className="text-nova">clique aqui</span>
                  </p>
                  <p className="text-[9px] text-text-muted mt-1">PDF ate 100MB</p>
                  <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
                </div>
              ) : (
                /* YouTube URLs input — multiple links = 1 document */
                <div className="space-y-2">
                  {ytLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Youtube size={12} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-red-400/50" />
                        <input
                          value={link}
                          onChange={(e) => updateYtLink(i, e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full bg-bg-3 border border-white/[0.10] rounded-lg pl-8 pr-3 py-2 text-[10px] text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-red-500/30"
                        />
                      </div>
                      {ytLinks.length > 1 && (
                        <button onClick={() => removeYtLink(i)} className="p-1 rounded text-text-muted/40 hover:text-red-400 transition-colors">
                          <X size={12} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addYtLink}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-white/[0.08] text-[10px] text-text-muted hover:text-text-secondary hover:border-white/[0.14] transition-colors"
                  >
                    <Plus size={11} strokeWidth={1.5} />
                    Adicionar mais um link
                  </button>
                  <button
                    onClick={handleYoutube}
                    disabled={ytLoading || ytLinks.every((l) => !l.trim())}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-semibold uppercase tracking-[0.08em] hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                  >
                    {ytLoading ? <Loader2 size={12} className="animate-spin" /> : <Youtube size={12} strokeWidth={1.5} />}
                    {ytLoading ? "Transcrevendo..." : `Criar documento (${ytLinks.filter((l) => l.trim()).length} video${ytLinks.filter((l) => l.trim()).length !== 1 ? "s" : ""})`}
                  </button>
                  {ytError && <p className="text-[10px] text-red-400">{ytError}</p>}
                </div>
              )}

              {/* Title / Author fields (shared) */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Titulo"
                  className="bg-bg-3 border border-white/[0.10] rounded-lg px-3 py-1.5 text-[10px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-gold/30"
                />
                <input
                  value={uploadAuthor}
                  onChange={(e) => setUploadAuthor(e.target.value)}
                  placeholder="Autor"
                  className="bg-bg-3 border border-white/[0.10] rounded-lg px-3 py-1.5 text-[10px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-gold/30"
                />
              </div>

              {uploading && (
                <div className="flex items-center gap-2 mt-3 px-1">
                  <Loader2 size={12} className="animate-spin text-nova" />
                  <p className="text-[10px] text-text-secondary">Processando PDF...</p>
                </div>
              )}
            </div>

            {/* Documents list */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-1.5">
                {books.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => { toggleBook(b.id) }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all group",
                      selectedBookIds.includes(b.id)
                        ? "bg-gold/10 border border-gold/15"
                        : "border border-transparent hover:bg-white/[0.05]"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      selectedBookIds.includes(b.id)
                        ? (b.source_type === "youtube" ? "bg-red-500/15" : "bg-gold/15")
                        : "bg-bg-3"
                    )}>
                      {b.source_type === "youtube"
                        ? <Youtube size={14} strokeWidth={1.5} className={selectedBookIds.includes(b.id) ? "text-red-400" : "text-text-muted/60"} />
                        : <FileText size={14} strokeWidth={1.5} className={selectedBookIds.includes(b.id) ? "text-gold" : "text-text-muted/60"} />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-text-primary truncate leading-tight">{b.title}</p>
                      <p className="text-[9px] text-text-muted mt-0.5 font-mono">
                        {b.source_type === "youtube" ? "YouTube · " : ""}{b.author ? `${b.author} · ` : ""}{b.chunk_count} blocos
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all"
                    >
                      <Trash2 size={11} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}

                {books.length === 0 && (
                  <div className="flex flex-col items-center py-10 text-center">
                    <FileText size={24} strokeWidth={1} className="text-text-muted/30 mb-3" />
                    <p className="text-[11px] text-text-muted">Nenhum documento</p>
                    <p className="text-[9px] text-text-muted/60 mt-1">Arraste um PDF acima</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.08] flex items-center justify-between">
              <p className="text-[9px] text-text-muted font-mono">
                {books.length} documento{books.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </LayoutApp>
  );
}
