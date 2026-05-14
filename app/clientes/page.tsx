"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import LayoutApp from "@/app/layout-app";
import {
  Users, Plus, Loader2, Trash2, Send, Search, ArrowLeft, X,
  MessageSquare, FlaskConical, MessagesSquare, ChevronRight,
  Zap, ShieldAlert, Target, Brain, Pen, Upload, FileText, Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientPersona, ClientSession } from "@/types";

/* ───────── Types ───────── */

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type ChatMode = "chat" | "test";

interface TestReport {
  reacao_emocional: number;
  sentimento: string;
  objecoes: string[];
  gatilhos_ativados: string[];
  acao_provavel: string;
  pensamento_interno: string;
  reescrita_na_minha_voz: string;
}

/* ───────── Helpers ───────── */

const SENTIMENT_MAP: Record<string, { label: string; color: string }> = {
  curiosa: { label: "Curiosa", color: "text-amber-400" },
  desconfiada: { label: "Desconfiada", color: "text-red-400" },
  animada: { label: "Animada", color: "text-emerald-400" },
  indiferente: { label: "Indiferente", color: "text-text-muted" },
  irritada: { label: "Irritada", color: "text-red-500" },
  esperancosa: { label: "Esperancosa", color: "text-sky-400" },
  cansada: { label: "Cansada", color: "text-text-muted" },
};

const ACTION_MAP: Record<string, { label: string; color: string; bg: string }> = {
  clicaria: { label: "Clicaria", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  ignoraria: { label: "Ignoraria", color: "text-text-muted", bg: "bg-white/[0.04] border-white/[0.08]" },
  compraria: { label: "Compraria", color: "text-gold", bg: "bg-gold/10 border-gold/20" },
  pediria_mais_info: { label: "Pediria mais info", color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20" },
  sairia: { label: "Sairia", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
};

function tryParseReport(content: string): TestReport | null {
  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const obj = JSON.parse(match[0]);
    if (typeof obj.reacao_emocional === "number" && obj.acao_provavel) return obj as TestReport;
    return null;
  } catch {
    return null;
  }
}

function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 86400000) return `Hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff < 172800000) return `Ontem, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/* ───────── Test Report Component ───────── */

function TestReportCard({ report }: { report: TestReport }) {
  const sentiment = SENTIMENT_MAP[report.sentimento] || { label: report.sentimento, color: "text-text-secondary" };
  const action = ACTION_MAP[report.acao_provavel] || { label: report.acao_provavel, color: "text-text-secondary", bg: "bg-white/[0.04] border-white/[0.08]" };
  const score = report.reacao_emocional;
  const scoreColor = score >= 7 ? "text-emerald-400" : score >= 4 ? "text-amber-400" : "text-red-400";
  const scoreBg = score >= 7 ? "bg-emerald-400/10 border-emerald-400/20" : score >= 4 ? "bg-amber-400/10 border-amber-400/20" : "bg-red-400/10 border-red-400/20";

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Score + Sentiment + Action row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold", scoreBg, scoreColor)}>
          <Zap size={11} strokeWidth={2} />
          {score}/10
        </div>
        <span className={cn("text-[11px] font-medium", sentiment.color)}>{sentiment.label}</span>
        <div className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-[0.08em]", action.bg, action.color)}>
          <Target size={10} strokeWidth={2} />
          {action.label}
        </div>
      </div>

      {/* Objections */}
      {report.objecoes.length > 0 && (
        <div className="p-3 rounded-xl bg-red-400/[0.04] border border-red-400/10">
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldAlert size={11} strokeWidth={1.5} className="text-red-400/70" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-red-400/70 font-medium">Objecoes</span>
          </div>
          <ul className="space-y-1">
            {report.objecoes.map((o, i) => (
              <li key={i} className="text-[11px] text-text-secondary leading-relaxed">- {o}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Triggers */}
      {report.gatilhos_ativados.length > 0 && (
        <div className="p-3 rounded-xl bg-emerald-400/[0.04] border border-emerald-400/10">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={11} strokeWidth={1.5} className="text-emerald-400/70" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-emerald-400/70 font-medium">Gatilhos ativados</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {report.gatilhos_ativados.map((g, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/15 text-emerald-400/90">{g}</span>
            ))}
          </div>
        </div>
      )}

      {/* Internal thought */}
      {report.pensamento_interno && (
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-2">
            <Brain size={11} strokeWidth={1.5} className="text-ai-blue/70" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-ai-blue/70 font-medium">Pensamento interno</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed italic">&ldquo;{report.pensamento_interno}&rdquo;</p>
        </div>
      )}

      {/* Rewrite */}
      {report.reescrita_na_minha_voz && (
        <div className="p-3 rounded-xl bg-gold/[0.04] border border-gold/10">
          <div className="flex items-center gap-1.5 mb-2">
            <Pen size={11} strokeWidth={1.5} className="text-gold/70" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-gold/70 font-medium">Na voz da persona</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">&ldquo;{report.reescrita_na_minha_voz}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

/* ───────── Main Page ───────── */

export default function ClientesPage() {
  /* — view state — */
  const [view, setView] = useState<"grid" | "chat">("grid");
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);

  /* — data — */
  const [personas, setPersonas] = useState<ClientPersona[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("chat");
  const [sessionSearch, setSessionSearch] = useState("");

  /* — modal — */
  const [showNewModal, setShowNewModal] = useState(false);
  const [studyText, setStudyText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [modalTab, setModalTab] = useState<"text" | "pdf">("text");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activePersona = personas.find((p) => p.id === activePersonaId) || null;

  /* — fetchers — */
  const fetchPersonas = useCallback(async () => {
    const r = await fetch("/api/clientes");
    if (r.ok) {
      setPersonas(await r.json());
      setLoadingPersonas(false);
    }
  }, []);

  const fetchSessions = useCallback(async (personaId: string) => {
    const r = await fetch(`/api/clientes/${personaId}/sessions`);
    if (r.ok) setSessions(await r.json());
  }, []);

  useEffect(() => { fetchPersonas(); }, [fetchPersonas]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  /* — persona actions — */
  const openPersona = useCallback(async (personaId: string) => {
    setActivePersonaId(personaId);
    setView("chat");
    setSessionId(null);
    setMessages([]);
    setInput("");
    await fetchSessions(personaId);
  }, [fetchSessions]);

  const deletePersona = async (id: string) => {
    await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    setPersonas((p) => p.filter((x) => x.id !== id));
    if (activePersonaId === id) {
      setView("grid");
      setActivePersonaId(null);
    }
  };

  /* — session actions — */
  const newSession = useCallback(async () => {
    if (!activePersonaId) return;
    if (sessionId && messages.length === 0) return;
    const r = await fetch(`/api/clientes/${activePersonaId}/sessions`, { method: "POST" });
    if (r.ok) {
      const s = await r.json();
      setSessionId(s.id);
      setMessages([]);
      await fetchSessions(activePersonaId);
      inputRef.current?.focus();
    }
  }, [activePersonaId, sessionId, messages.length, fetchSessions]);

  const loadSession = useCallback(async (sid: string) => {
    if (!activePersonaId) return;
    setSessionId(sid);
    const r = await fetch(`/api/clientes/${activePersonaId}/sessions/${sid}`);
    if (r.ok) {
      const data = await r.json();
      setMessages(
        (data.messages || []).map((m: { id: string; role: string; content: string }) => ({
          id: m.id, role: m.role as "user" | "assistant", content: m.content,
        }))
      );
    }
  }, [activePersonaId]);

  const deleteSession = async (sid: string) => {
    if (!activePersonaId) return;
    await fetch(`/api/clientes/${activePersonaId}/sessions/${sid}`, { method: "DELETE" });
    if (sessionId === sid) { setSessionId(null); setMessages([]); }
    fetchSessions(activePersonaId);
  };

  /* — chat — */
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !activePersonaId) return;

    let sid = sessionId;
    if (!sid) {
      const r = await fetch(`/api/clientes/${activePersonaId}/sessions`, { method: "POST" });
      if (!r.ok) return;
      const s = await r.json();
      sid = s.id;
      setSessionId(sid);
    }

    const userMsg: LocalMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/clientes/${activePersonaId}/sessions/${sid}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode }),
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
      fetchSessions(activePersonaId);
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: "Erro ao processar. Tente novamente." } : m))
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId, activePersonaId, mode, fetchSessions]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* — generate persona — */
  const handleGenerate = async () => {
    if (modalTab === "text" && studyText.trim().length < 50) { setGenError("Texto muito curto. Minimo 50 caracteres."); return; }
    if (modalTab === "pdf" && !uploadFile) { setGenError("Selecione um arquivo."); return; }
    setGenerating(true); setGenError("");

    try {
      let res: Response;
      if (modalTab === "pdf" && uploadFile) {
        const fd = new FormData();
        fd.append("file", uploadFile);
        res = await fetch("/api/clientes/generate", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/clientes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studyText }),
        });
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Erro na API" }));
        setGenError(d.error || "Erro ao gerar persona");
        return;
      }
      await fetchPersonas();
      setShowNewModal(false);
      setStudyText("");
      setUploadFile(null);
    } catch {
      setGenError("Erro de conexao. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    const name = file?.name.toLowerCase() || "";
    if (file && (name.endsWith(".pdf") || name.endsWith(".md") || name.endsWith(".txt"))) setUploadFile(file);
    else setGenError("Apenas PDF, MD ou TXT");
  };

  const handleFileSelect = () => {
    const file = fileRef.current?.files?.[0];
    if (file) { setUploadFile(file); setGenError(""); }
  };

  /* — derived — */
  const filteredSessions = sessions.filter(
    (s) => !sessionSearch || (s.title || "").toLowerCase().includes(sessionSearch.toLowerCase())
  );
  const activeSession = sessions.find((s) => s.id === sessionId);

  /* ───────── GRID VIEW ───────── */
  if (view === "grid") {
    return (
      <LayoutApp>
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">Knowledge System</p>
              <h1 className="text-2xl font-display text-text-primary">Clientes Artificiais</h1>
              <p className="text-sm text-text-secondary mt-1">Crie personas a partir de estudos de publico e converse como clientes reais</p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nova/10 border border-nova/20 text-nova text-[11px] font-semibold uppercase tracking-[0.12em] hover:bg-nova/15 transition-colors"
            >
              <Plus size={14} strokeWidth={1.5} /> Nova persona
            </button>
          </div>

          {/* Grid */}
          {loadingPersonas ? (
            <div className="flex justify-center py-20"><Loader2 size={20} className="animate-spin text-text-muted" /></div>
          ) : personas.length === 0 ? (
            <div className="text-center py-20">
              <Users size={32} strokeWidth={1} className="text-text-muted/30 mx-auto mb-3" />
              <p className="text-[13px] text-text-muted">Nenhuma persona criada</p>
              <p className="text-[11px] text-text-muted/50 mt-1">Clique em &ldquo;Nova persona&rdquo; para comecar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personas.map((p) => (
                <div key={p.id} className="group relative rounded-xl bg-bg-3 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 cursor-pointer" onClick={() => openPersona(p.id)}>
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center border shrink-0" style={{ backgroundColor: `${p.avatar_color}15`, borderColor: `${p.avatar_color}30` }}>
                        <span className="text-[12px] font-bold" style={{ color: p.avatar_color }}>{p.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[13px] font-semibold text-text-primary">{p.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {p.age_range && <span className="text-[10px] text-text-muted font-mono">{p.age_range}</span>}
                          {p.niche && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-text-muted border border-white/[0.06]">{p.niche}</span>}
                        </div>
                      </div>
                      <ChevronRight size={14} strokeWidth={1.5} className="text-text-muted/30 group-hover:text-text-muted/60 transition-colors mt-1 shrink-0" />
                    </div>
                    {p.pains.length > 0 && (
                      <p className="text-[10px] text-text-muted/70 mt-3 line-clamp-2 leading-relaxed">{p.pains.slice(0, 2).join(" · ")}</p>
                    )}
                    {(p.behavior || p.emotional_state) && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {p.emotional_state && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-ai-blue/8 border border-ai-blue/15 text-ai-blue/80">{p.emotional_state}</span>}
                        {p.awareness_level && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-text-muted font-mono">Nv.{p.awareness_level}</span>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePersona(p.id); }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Persona Modal */}
        {showNewModal && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => { if (!generating) { setShowNewModal(false); setGenError(""); setUploadFile(null); } }} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
              <div className="bg-bg-2 border border-white/[0.10] rounded-2xl w-full max-w-lg shadow-2xl pointer-events-auto">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.08]">
                  <div>
                    <h2 className="text-[15px] font-display text-text-primary">Criar Persona</h2>
                    <p className="text-[11px] text-text-muted mt-0.5">Envie um documento ou cole texto para gerar a persona</p>
                  </div>
                  <button onClick={() => { if (!generating) { setShowNewModal(false); setGenError(""); setUploadFile(null); } }} className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-white/[0.06] transition-colors">
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="p-6">
                  {/* Tab toggle */}
                  <div className="flex items-center gap-1 p-1 bg-bg-3 rounded-lg mb-4">
                    <button
                      onClick={() => setModalTab("text")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-colors",
                        modalTab === "text" ? "bg-white/[0.08] text-text-primary" : "text-text-muted hover:text-text-secondary"
                      )}
                    >
                      <Type size={11} strokeWidth={1.5} /> Texto
                    </button>
                    <button
                      onClick={() => setModalTab("pdf")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-colors",
                        modalTab === "pdf" ? "bg-white/[0.08] text-text-primary" : "text-text-muted hover:text-text-secondary"
                      )}
                    >
                      <FileText size={11} strokeWidth={1.5} /> Documento
                    </button>
                  </div>

                  {modalTab === "text" ? (
                    <>
                      <label className="block text-[9px] uppercase tracking-[0.18em] text-text-muted mb-2">Estudo de publico</label>
                      <textarea
                        value={studyText}
                        onChange={(e) => setStudyText(e.target.value)}
                        placeholder="Cole aqui o estudo de publico, pesquisas, reviews, depoimentos, dados demograficos, dores, desejos..."
                        rows={10}
                        className="w-full bg-bg-3 border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-nova/30 resize-none leading-relaxed"
                      />
                      <p className="text-[10px] text-text-muted/50 mt-1.5 font-mono">{studyText.length} caracteres</p>
                    </>
                  ) : (
                    <>
                      <label className="block text-[9px] uppercase tracking-[0.18em] text-text-muted mb-2">Documento (PDF, MD, TXT)</label>
                      {!uploadFile ? (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={handleFileDrop}
                          onClick={() => fileRef.current?.click()}
                          className={cn(
                            "flex flex-col items-center justify-center py-12 rounded-xl border border-dashed cursor-pointer transition-all",
                            dragOver
                              ? "border-nova/50 bg-nova/[0.06]"
                              : "border-white/[0.12] bg-bg-3/50 hover:border-white/[0.20] hover:bg-bg-3"
                          )}
                        >
                          <Upload size={24} strokeWidth={1.5} className={cn("mb-3", dragOver ? "text-nova" : "text-text-muted/50")} />
                          <p className="text-[11px] text-text-secondary">
                            Arraste um arquivo ou <span className="text-nova">clique aqui</span>
                          </p>
                          <p className="text-[9px] text-text-muted mt-1">PDF, Markdown ou TXT</p>
                          <input ref={fileRef} type="file" accept=".pdf,.md,.txt" className="hidden" onChange={handleFileSelect} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-3 border border-white/[0.08]">
                          <div className="w-10 h-10 rounded-lg bg-nova/10 flex items-center justify-center shrink-0">
                            <FileText size={18} strokeWidth={1.5} className="text-nova" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] text-text-primary truncate">{uploadFile.name}</p>
                            <p className="text-[10px] text-text-muted font-mono">{(uploadFile.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button
                            onClick={() => { setUploadFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                            className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <X size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {genError && <p className="text-[11px] text-red-400 mt-3">{genError}</p>}
                </div>

                <div className="flex items-center justify-end gap-3 px-6 pb-5">
                  <button
                    onClick={() => { if (!generating) { setShowNewModal(false); setGenError(""); setUploadFile(null); } }}
                    className="px-4 py-2 rounded-lg text-[11px] text-text-muted hover:text-text-secondary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating || (modalTab === "text" ? studyText.trim().length < 50 : !uploadFile)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-nova text-black text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-nova/90 disabled:opacity-40 transition-colors"
                  >
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} strokeWidth={1.5} />}
                    {generating ? "Gerando..." : "Gerar persona"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </LayoutApp>
    );
  }

  /* ───────── CHAT VIEW ───────── */
  return (
    <LayoutApp>
      <div className="flex h-full overflow-hidden">

        {/* ══════ LEFT — Persona selector + Sessions ══════ */}
        <div className="w-[260px] flex-shrink-0 border-r border-white/[0.08] flex flex-col bg-bg-2">
          {/* Back to grid */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => { setView("grid"); setActivePersonaId(null); setSessionId(null); setMessages([]); }}
              className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors mb-3"
            >
              <ArrowLeft size={12} strokeWidth={1.5} />
              Todas as personas
            </button>
          </div>

          {/* Persona cards (mini) */}
          <div className="px-3 pb-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted mb-2 px-1 font-mono">Personas</p>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { if (p.id !== activePersonaId) openPersona(p.id); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200 relative",
                    p.id === activePersonaId
                      ? "bg-white/[0.08]"
                      : "hover:bg-white/[0.04]"
                  )}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center border shrink-0" style={{ backgroundColor: `${p.avatar_color}15`, borderColor: `${p.avatar_color}30` }}>
                    <span className="text-[9px] font-bold" style={{ color: p.avatar_color }}>{p.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[11px] truncate", p.id === activePersonaId ? "text-text-primary font-medium" : "text-text-secondary")}>{p.name}</p>
                    {p.niche && <p className="text-[9px] text-text-muted truncate">{p.niche}</p>}
                  </div>
                  {p.id === activePersonaId && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-gold rounded-r" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.06] mx-3" />

          {/* Sessions */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted mb-2 font-mono">Conversas</p>
            <div className="relative">
              <Search size={13} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
              <input
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-bg-3 border border-white/[0.10] rounded-lg pl-9 pr-3 py-2 text-[11px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-gold/30 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
            {filteredSessions.map((s) => (
              <div
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 relative cursor-pointer group",
                  s.id === sessionId ? "bg-white/[0.08]" : "hover:bg-white/[0.05]"
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[12px] truncate leading-tight", s.id === sessionId ? "text-text-primary font-medium" : "text-text-secondary")}>
                      {s.title || "Nova conversa"}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1 font-mono">{formatDate(s.last_message_at)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-text-muted/50 hover:text-red-400 transition-all shrink-0 mt-0.5"
                  >
                    <Trash2 size={10} strokeWidth={1.5} />
                  </button>
                </div>
                {s.id === sessionId && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-gold rounded-r" />
                )}
              </div>
            ))}
            {filteredSessions.length === 0 && (
              <p className="text-[11px] text-text-muted text-center py-6">
                {sessionSearch ? "Nenhum resultado" : "Nenhuma conversa"}
              </p>
            )}
          </div>

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
              {activePersona && (
                <>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border shrink-0" style={{ backgroundColor: `${activePersona.avatar_color}15`, borderColor: `${activePersona.avatar_color}30` }}>
                    <span className="text-[10px] font-bold" style={{ color: activePersona.avatar_color }}>{activePersona.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[13px] text-text-primary font-medium truncate">
                      {activeSession?.title || activePersona.name}
                    </h2>
                    {activeSession && <p className="text-[10px] text-text-muted truncate">{activePersona.name} · {activePersona.niche || "geral"}</p>}
                  </div>
                </>
              )}
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-1 p-1 bg-bg-3 rounded-lg border border-white/[0.06]">
              <button
                onClick={() => setMode("chat")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all",
                  mode === "chat"
                    ? "bg-white/[0.10] text-text-primary"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                <MessagesSquare size={12} strokeWidth={1.5} />
                Conversar
              </button>
              <button
                onClick={() => setMode("test")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all",
                  mode === "test"
                    ? "bg-nova/15 text-nova"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                <FlaskConical size={12} strokeWidth={1.5} />
                Testar
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
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
                  {mode === "test" ? "Teste sua copy com " : "Converse com "}
                  {activePersona?.name || "a persona"}
                </p>
                <p className="text-[11px] text-text-muted mt-2 max-w-xs leading-relaxed">
                  {mode === "test"
                    ? "Envie uma headline, copy ou oferta e receba um relatorio de reacao"
                    : "A IA responde exatamente como esse cliente responderia"
                  }
                </p>
              </div>
            ) : (
              <div className="px-6 py-6 space-y-5 max-w-3xl mx-auto">
                {messages.map((msg) => {
                  const report = msg.role === "assistant" && mode === "test" && msg.content ? tryParseReport(msg.content) : null;
                  return (
                    <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-[1.7]",
                          msg.role === "user"
                            ? "bg-bg-3 border border-white/[0.10] text-text-primary"
                            : "bg-bg-2 border border-white/[0.06] text-text-secondary"
                        )}
                      >
                        {report ? (
                          <TestReportCard report={report} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>
                    </div>
                  );
                })}

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
                        {mode === "test" ? "Analisando como " + (activePersona?.name || "persona") : "Pensando"}
                        <span className="loading-dots" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input zone */}
          <div className="border-t border-white/[0.08] px-6 py-4 bg-bg-2/40">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className={cn(
                  "flex items-center gap-2 rounded-full border transition-all duration-300",
                  input.trim() ? "bg-bg-3 border-white/[0.14]" : "bg-bg-3 border-white/[0.08]",
                  loading && "opacity-60 pointer-events-none"
                )}>
                  {/* AI orb indicator */}
                  <div className="pl-3 flex items-center">
                    <div className={cn("ai-orb-micro transition-all duration-500", loading ? "animate-spin-slow opacity-100" : "opacity-40")}>
                      <div className="ai-orb-container">
                        <div className="ai-orb-c ai-orb-c4" />
                        <div className="ai-orb-c ai-orb-c3" />
                        <div className="ai-orb-c ai-orb-c1" />
                      </div>
                      <div className="ai-orb-glass" />
                    </div>
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKey}
                    placeholder={
                      mode === "test"
                        ? "Cole sua headline, copy ou oferta..."
                        : `Fale com ${activePersona?.name || "a persona"}...`
                    }
                    className="flex-1 bg-transparent py-3 pr-2 text-[13px] text-text-primary placeholder:text-text-muted/40 focus:outline-none"
                  />

                  <div className="relative mr-1.5 group/send">
                    <button
                      onClick={sendMessage}
                      disabled={loading || !input.trim()}
                      className={cn(
                        "p-2 rounded-full transition-all duration-300",
                        input.trim()
                          ? "bg-nova text-black hover:bg-nova/80 hover:shadow-[0_0_12px_rgba(255,138,31,0.25)] active:scale-[0.93] scale-100 opacity-100"
                          : "bg-transparent text-text-muted/30 scale-75 opacity-0 pointer-events-none"
                      )}
                    >
                      <Send size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-text-muted/40 text-center mt-2">
                {mode === "test"
                  ? "A IA gera um relatorio de reacao como a persona"
                  : `${activePersona?.name || "Persona"} responde em primeira pessoa, sem quebrar personagem`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </LayoutApp>
  );
}
