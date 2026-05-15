"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import LayoutApp from "@/app/layout-app";
import {
  Users, Plus, Loader2, Trash2, Send, Search, X, ArrowLeft,
  ScanLine, MessageCircle, Check, XCircle, CornerDownRight,
  Upload, FileText, Type, MessageSquare, Target,
  Activity, Compass, ChevronRight, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientPersona, ClientSession, PersonaOffer } from "@/types";

/* ───────── Types ───────── */

interface LocalMessage { id: string; role: "user" | "assistant"; content: string; offerRefs?: { id: string; title: string }[] }
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

/* ───────── Maps ───────── */

const AWARENESS: Record<string, { label: string; cls: string }> = {
  "1": { label: "Pre-contemplacao", cls: "text-red-400 bg-red-400/8 border-red-400/20" },
  "2": { label: "Contemplacao", cls: "text-amber-400 bg-amber-400/8 border-amber-400/20" },
  "3": { label: "Preparacao", cls: "text-emerald-400 bg-emerald-400/8 border-emerald-400/20" },
  "4": { label: "Acao", cls: "text-sky-400 bg-sky-400/8 border-sky-400/20" },
  "5": { label: "Manutencao", cls: "text-violet-400 bg-violet-400/8 border-violet-400/20" },
};

const SENTIMENT: Record<string, { label: string; color: string }> = {
  curiosa: { label: "Curiosa", color: "text-amber-400" },
  desconfiada: { label: "Desconfiada", color: "text-red-400" },
  animada: { label: "Animada", color: "text-emerald-400" },
  indiferente: { label: "Indiferente", color: "text-text-muted" },
  irritada: { label: "Irritada", color: "text-red-500" },
  esperancosa: { label: "Esperancosa", color: "text-sky-400" },
  cansada: { label: "Cansada", color: "text-text-muted" },
};

const ACTION: Record<string, { label: string; pct: number; color: string }> = {
  compraria: { label: "Compraria", pct: 85, color: "#34d399" },
  clicaria: { label: "Clicaria", pct: 78, color: "#34d399" },
  pediria_mais_info: { label: "Pediria mais info", pct: 55, color: "#F4C430" },
  ignoraria: { label: "Ignoraria", pct: 25, color: "#6B6B73" },
  sairia: { label: "Sairia", pct: 10, color: "#f87171" },
};

/* ───────── Helpers ───────── */

function tryParseReport(content: string): TestReport | null {
  try {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const o = JSON.parse(m[0]);
    return typeof o.reacao_emocional === "number" && o.acao_provavel ? o as TestReport : null;
  } catch { return null; }
}

function fmtDate(d: string) {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  if (diff < 86400000) return `Hoje, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff < 172800000) return `Ontem, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/* ───────── CircularProgress ───────── */

function Ring({ pct, color, size = 48 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3} strokeDasharray={c} strokeDashoffset={c - (pct/100)*c} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  );
}

/* ───────── TestReport (inline) ───────── */

function ReportView({ r }: { r: TestReport }) {
  const sent = SENTIMENT[r.sentimento] || { label: r.sentimento, color: "text-text-secondary" };
  const act = ACTION[r.acao_provavel] || { label: r.acao_provavel, pct: 50, color: "#F4C430" };
  const sc = r.reacao_emocional;
  const scClr = sc >= 7 ? "text-emerald-400" : sc >= 4 ? "text-gold" : "text-red-400";

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Metrics */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-1/60 border border-white/[0.06]">
          <span className={cn("text-[18px] font-bold font-mono leading-none", scClr)}>{sc.toFixed(1)}</span>
          <span className="text-[9px] text-text-muted">/10</span>
        </div>
        <span className={cn("text-[11px] font-medium", sent.color)}>{sent.label}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="relative">
            <Ring pct={act.pct} color={act.color} size={36} />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold font-mono text-text-primary">{act.pct}%</span>
          </div>
          <span className="text-[9px] text-text-muted max-w-[60px] leading-tight">{act.label}</span>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-2">
        {r.objecoes.length > 0 && (
          <div className="p-2.5 rounded-lg bg-bg-1/40 border border-white/[0.05]">
            <p className="text-[8px] uppercase tracking-[0.15em] text-red-400/60 mb-1.5 flex items-center gap-1"><XCircle size={9} strokeWidth={1.5} /> Objecoes</p>
            {r.objecoes.map((o,i) => <p key={i} className="text-[10px] text-text-secondary leading-relaxed">&#8226; {o}</p>)}
          </div>
        )}
        {r.gatilhos_ativados.length > 0 && (
          <div className="p-2.5 rounded-lg bg-bg-1/40 border border-white/[0.05]">
            <p className="text-[8px] uppercase tracking-[0.15em] text-emerald-400/60 mb-1.5 flex items-center gap-1"><Check size={9} strokeWidth={1.5} /> Gatilhos</p>
            {r.gatilhos_ativados.map((g,i) => <p key={i} className="text-[10px] text-text-secondary leading-relaxed">&#8226; {g}</p>)}
          </div>
        )}
      </div>

      {r.pensamento_interno && (
        <div className="p-2.5 rounded-lg bg-bg-1/40 border border-white/[0.05]">
          <p className="text-[8px] uppercase tracking-[0.15em] text-ai-blue/50 mb-1 flex items-center gap-1"><MessageSquare size={9} strokeWidth={1.5} /> Pensamento</p>
          <p className="text-[10px] text-text-secondary leading-relaxed italic">&ldquo;{r.pensamento_interno}&rdquo;</p>
        </div>
      )}

      {r.reescrita_na_minha_voz && (
        <div className="p-2.5 rounded-lg bg-nova/[0.05] border border-nova/10">
          <p className="text-[8px] uppercase tracking-[0.15em] text-nova/60 mb-1 flex items-center gap-1"><CornerDownRight size={9} strokeWidth={1.5} /> Na voz dela</p>
          <p className="text-[10px] text-text-secondary leading-relaxed">&ldquo;{r.reescrita_na_minha_voz}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function ClientesPage() {
  const [view, setView] = useState<"grid" | "chat">("grid");
  const [personas, setPersonas] = useState<ClientPersona[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("chat");
  const [sessionSearch, setSessionSearch] = useState("");

  /* modal */
  const [showModal, setShowModal] = useState(false);
  const [studyText, setStudyText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [modalTab, setModalTab] = useState<"text" | "pdf">("text");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  /* test panel */
  const [showTest, setShowTest] = useState(false);
  const [testCopy, setTestCopy] = useState("");
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  /* offers / @ mention */
  const [offers, setOffers] = useState<PersonaOffer[]>([]);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [showOfferPicker, setShowOfferPicker] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const persona = personas.find((p) => p.id === activePersonaId) || null;
  const activeSession = sessions.find((s) => s.id === sessionId);

  /* ── fetchers ── */
  const fetchPersonas = useCallback(async () => {
    const r = await fetch("/api/clientes");
    if (r.ok) { setPersonas(await r.json()); setLoadingPersonas(false); }
  }, []);

  const fetchSessions = useCallback(async (pid: string) => {
    const r = await fetch(`/api/clientes/${pid}/sessions`);
    if (r.ok) setSessions(await r.json());
  }, []);

  const fetchOffers = useCallback(async () => {
    const r = await fetch("/api/clientes/offers");
    if (r.ok) setOffers(await r.json());
  }, []);

  useEffect(() => { fetchPersonas(); fetchOffers(); }, [fetchPersonas, fetchOffers]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  /* ── persona ── */
  const openPersona = useCallback(async (pid: string) => {
    setActivePersonaId(pid);
    setView("chat");
    setSessionId(null); setMessages([]); setInput("");
    setTestReport(null); setTestCopy(""); setSelectedOfferIds([]);
    await fetchSessions(pid);
  }, [fetchSessions]);

  const deletePersona = async (id: string) => {
    await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    setPersonas((p) => p.filter((x) => x.id !== id));
    if (activePersonaId === id) { setView("grid"); setActivePersonaId(null); }
  };

  /* ── sessions ── */
  const newSession = useCallback(async () => {
    if (!activePersonaId || (sessionId && messages.length === 0)) return;
    const r = await fetch(`/api/clientes/${activePersonaId}/sessions`, { method: "POST" });
    if (r.ok) { const s = await r.json(); setSessionId(s.id); setMessages([]); await fetchSessions(activePersonaId); inputRef.current?.focus(); }
  }, [activePersonaId, sessionId, messages.length, fetchSessions]);

  const loadSession = useCallback(async (sid: string) => {
    if (!activePersonaId) return;
    setSessionId(sid);
    const r = await fetch(`/api/clientes/${activePersonaId}/sessions/${sid}`);
    if (r.ok) { const d = await r.json(); setMessages((d.messages || []).map((m: { id: string; role: string; content: string }) => ({ id: m.id, role: m.role as "user"|"assistant", content: m.content }))); }
  }, [activePersonaId]);

  const deleteSession = async (sid: string) => {
    if (!activePersonaId) return;
    await fetch(`/api/clientes/${activePersonaId}/sessions/${sid}`, { method: "DELETE" });
    if (sessionId === sid) { setSessionId(null); setMessages([]); }
    fetchSessions(activePersonaId);
  };

  /* ── stream helper ── */
  const stream = useCallback(async (pid: string, sid: string, text: string, m: ChatMode, onChunk: (c: string) => void, onDone: () => void, onErr: () => void, offerIds?: string[]) => {
    try {
      const res = await fetch(`/api/clientes/${pid}/sessions/${sid}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, mode: m, offer_ids: offerIds }) });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true }); const lines = buf.split("\n"); buf = lines.pop() ?? ""; for (const l of lines) { if (!l.startsWith("data: ")) continue; const d = l.slice(6); if (d === "[DONE]") break; try { onChunk(JSON.parse(d).text); } catch {} } }
      onDone();
    } catch { onErr(); }
  }, []);

  /* ── send message ── */
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !activePersonaId) return;
    let sid = sessionId;
    if (!sid) { const r = await fetch(`/api/clientes/${activePersonaId}/sessions`, { method: "POST" }); if (!r.ok) return; const s = await r.json(); sid = s.id; setSessionId(sid); }
    const refs = selectedOfferIds.map((oid) => { const o = offers.find((x) => x.id === oid); return o ? { id: oid, title: o.title } : null; }).filter(Boolean) as { id: string; title: string }[];
    const userMsg: LocalMessage = { id: crypto.randomUUID(), role: "user", content: text, offerRefs: refs.length > 0 ? refs : undefined };
    const aId = crypto.randomUUID();
    setMessages((p) => [...p, userMsg, { id: aId, role: "assistant", content: "" }]);
    setInput(""); setLoading(true);
    const oids = selectedOfferIds.length > 0 ? selectedOfferIds : undefined;
    setSelectedOfferIds([]);
    await stream(activePersonaId, sid!, text, mode,
      (c) => setMessages((p) => p.map((m) => m.id === aId ? { ...m, content: m.content + c } : m)),
      () => { setLoading(false); fetchSessions(activePersonaId); },
      () => { setLoading(false); setMessages((p) => p.map((m) => m.id === aId ? { ...m, content: "Erro ao processar." } : m)); },
      oids
    );
  }, [input, loading, sessionId, activePersonaId, mode, fetchSessions, stream, selectedOfferIds]);

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  /* ── test panel ── */
  const runTest = useCallback(async () => {
    if (!testCopy.trim() || testLoading || !activePersonaId) return;
    setTestLoading(true); setTestReport(null);
    const r = await fetch(`/api/clientes/${activePersonaId}/sessions`, { method: "POST" });
    if (!r.ok) { setTestLoading(false); return; }
    const s = await r.json(); let full = "";
    const oids = selectedOfferIds.length > 0 ? selectedOfferIds : undefined;
    await stream(activePersonaId, s.id, testCopy.trim(), "test",
      (c) => { full += c; },
      async () => {
        setTestLoading(false);
        const rp = tryParseReport(full);
        if (rp) {
          setTestReport(rp);
          // Auto-save the tested copy as an offer
          const title = testCopy.trim().slice(0, 80);
          await fetch("/api/clientes/offers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content: testCopy.trim(), last_report: rp, persona_id: activePersonaId }),
          });
          fetchOffers();
        }
        fetchSessions(activePersonaId);
      },
      () => { setTestLoading(false); },
      oids
    );
  }, [testCopy, testLoading, activePersonaId, stream, fetchSessions, fetchOffers, selectedOfferIds]);

  const saveOfferManually = async () => {
    if (!testCopy.trim()) return;
    const title = testCopy.trim().slice(0, 80);
    await fetch("/api/clientes/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content: testCopy.trim(), persona_id: activePersonaId }),
    });
    fetchOffers();
  };

  const toggleOffer = (id: string) => setSelectedOfferIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const deleteOffer = async (id: string) => {
    await fetch(`/api/clientes/offers/${id}`, { method: "DELETE" });
    setOffers((p) => p.filter((x) => x.id !== id));
    setSelectedOfferIds((p) => p.filter((x) => x !== id));
  };

  /* ── generate ── */
  const handleGenerate = async () => {
    if (modalTab === "text" && studyText.trim().length < 50) { setGenError("Texto muito curto. Minimo 50 caracteres."); return; }
    if (modalTab === "pdf" && !uploadFile) { setGenError("Selecione um arquivo."); return; }
    setGenerating(true); setGenError("");
    try {
      let res: Response;
      if (modalTab === "pdf" && uploadFile) { const fd = new FormData(); fd.append("file", uploadFile); res = await fetch("/api/clientes/generate", { method: "POST", body: fd }); }
      else { res = await fetch("/api/clientes/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studyText }) }); }
      if (!res.ok) { const d = await res.json().catch(() => ({ error: "Erro" })); setGenError(d.error || "Erro"); return; }
      await fetchPersonas(); setShowModal(false); setStudyText(""); setUploadFile(null);
    } catch { setGenError("Erro de conexao."); } finally { setGenerating(false); }
  };

  const handleFileDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; const n = f?.name.toLowerCase() || ""; if (f && (n.endsWith(".pdf") || n.endsWith(".md") || n.endsWith(".txt"))) setUploadFile(f); else setGenError("Apenas PDF, MD ou TXT"); };
  const handleFileSelect = () => { const f = fileRef.current?.files?.[0]; if (f) { setUploadFile(f); setGenError(""); } };

  const filteredSessions = sessions.filter((s) => !sessionSearch || (s.title || "").toLowerCase().includes(sessionSearch.toLowerCase()));

  /* ════════════════════════ GRID VIEW ════════════════════════ */
  if (view === "grid") {
    return (
      <LayoutApp>
        <div className="max-w-[1100px] mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-text-muted mb-3 font-mono flex items-center gap-1.5">
                Knowledge System
              </p>
              <h1 className="text-[32px] font-display leading-tight mb-2">
                <span className="text-text-primary">Clientes </span>
                <span className="text-nova">Artificiais</span>
              </h1>
              <p className="text-[13px] text-text-secondary leading-relaxed max-w-md">
                Simule seu publico-alvo com IA e teste mensagens<br />antes de investir em trafego.
              </p>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-nova text-nova text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-nova/10 transition-colors shrink-0">
              <Plus size={14} strokeWidth={2} /> Nova Persona
            </button>
          </div>

          {/* Cards */}
          {loadingPersonas ? (
            <div className="flex justify-center py-20"><Loader2 size={20} className="animate-spin text-text-muted" /></div>
          ) : personas.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Empty state inside first card slot */}
              <div className="rounded-xl bg-bg-3/50 border border-white/[0.06] flex flex-col items-center justify-center py-20">
                <Users size={28} strokeWidth={1} className="text-text-muted/20 mb-3" />
                <p className="text-[13px] text-text-secondary mb-1">Nenhuma persona criada</p>
                <p className="text-[10px] text-text-muted">Cole um estudo de publico para comecar</p>
              </div>
              {/* Create card */}
              <div onClick={() => setShowModal(true)} className="relative rounded-xl border border-white/[0.08] hover:border-nova/25 flex flex-col items-center justify-center py-20 cursor-pointer transition-all group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-nova/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-full border border-white/[0.10] flex items-center justify-center mb-4 group-hover:border-nova/30 transition-colors relative z-10">
                  <Plus size={20} strokeWidth={1.5} className="text-text-muted/50 group-hover:text-nova transition-colors" />
                </div>
                <p className="text-[13px] font-medium text-text-secondary group-hover:text-text-primary transition-colors relative z-10">Nova persona</p>
                <p className="text-[10px] text-text-muted/50 mt-1 relative z-10">A partir do estudo de publico</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {personas.map((p) => {
                const aw = AWARENESS[p.awareness_level || "3"];
                const attrCount = p.pains.length + p.desires.length + p.objections.length + p.vocabulary.length;
                return (
                  <div key={p.id} onClick={() => openPersona(p.id)} className="group relative rounded-xl bg-bg-3 border border-white/[0.06] hover:border-nova/20 transition-all duration-300 cursor-pointer hover:shadow-[0_0_40px_rgba(244,196,48,0.04)]">
                    <div className="p-6">
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 shrink-0" style={{ backgroundColor: `${p.avatar_color}12`, borderColor: `${p.avatar_color}35` }}>
                            <span className="text-[14px] font-bold" style={{ color: p.avatar_color }}>{p.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-[16px] font-semibold text-text-primary">{p.name}</h3>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            </div>
                            <p className="text-[10px] text-text-muted mt-0.5">{[p.age_range, p.niche].filter(Boolean).join(" · ")}</p>
                          </div>
                        </div>
                        {aw && (
                          <span className={cn("text-[9px] font-medium px-2.5 py-1 rounded-full border shrink-0", aw.cls)}>{aw.label}</span>
                        )}
                      </div>

                      {/* Quote */}
                      {(p.desires.length > 0 || p.pains.length > 0) && (
                        <p className="text-[11px] text-text-secondary/70 leading-[1.7] mb-5 italic pl-4 border-l-2 border-white/[0.06]">
                          &ldquo;{p.desires[0] || p.pains[0]}&rdquo;
                        </p>
                      )}

                      {/* Sections */}
                      <div className="space-y-4">
                        {/* Consciencia */}
                        {p.behavior && (
                          <div className="flex gap-3">
                            <Compass size={14} strokeWidth={1.5} className="text-nova/50 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.18em] text-text-muted font-semibold mb-1">Consciencia</p>
                              <p className="text-[11px] text-text-secondary leading-[1.7] line-clamp-4">{p.behavior}</p>
                            </div>
                          </div>
                        )}

                        {/* Emocional */}
                        {p.emotional_state && (
                          <div className="flex gap-3">
                            <Activity size={14} strokeWidth={1.5} className="text-nova/50 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.18em] text-text-muted font-semibold mb-1">Emocional</p>
                              <p className="text-[11px] text-text-secondary leading-[1.7]">{p.emotional_state}</p>
                            </div>
                          </div>
                        )}

                        {/* Dores */}
                        {p.pains.length > 0 && (
                          <div className="flex gap-3">
                            <AlertCircle size={14} strokeWidth={1.5} className="text-nova/50 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.18em] text-text-muted font-semibold mb-1.5">Dores</p>
                              <ul className="space-y-1">
                                {p.pains.slice(0, 3).map((pain, i) => (
                                  <li key={i} className="text-[11px] text-text-secondary leading-[1.7] flex items-start gap-2">
                                    <span className="text-nova/40 mt-1.5 shrink-0">&#8226;</span>
                                    <span>{pain}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-white/[0.04] flex items-center justify-between">
                      <span className="text-[10px] text-text-muted flex items-center gap-1.5 font-mono">
                        <Users size={11} strokeWidth={1.5} className="text-text-muted/50" />
                        {attrCount} atributos
                      </span>
                      <ChevronRight size={14} strokeWidth={1.5} className="text-text-muted/30 group-hover:text-nova transition-colors" />
                    </div>

                    <button onClick={(e) => { e.stopPropagation(); deletePersona(p.id); }} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 text-text-muted/30 hover:text-red-400 transition-all z-10">
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                );
              })}

              {/* Create card */}
              <div onClick={() => setShowModal(true)} className="relative rounded-xl border border-white/[0.08] hover:border-nova/25 flex flex-col items-center justify-center min-h-[300px] cursor-pointer transition-all group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-nova/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-full border border-white/[0.10] flex items-center justify-center mb-4 group-hover:border-nova/30 transition-colors relative z-10">
                  <Plus size={22} strokeWidth={1.5} className="text-text-muted/50 group-hover:text-nova transition-colors" />
                </div>
                <p className="text-[14px] font-medium text-text-secondary group-hover:text-text-primary transition-colors relative z-10">Nova persona</p>
                <p className="text-[10px] text-text-muted/50 mt-1 relative z-10">A partir do estudo de publico</p>
              </div>
            </div>
          )}
        </div>

        {showModal && <GenerateModal {...{ showModal, setShowModal: setShowModal, studyText, setStudyText, generating, genError, setGenError, modalTab, setModalTab, uploadFile, setUploadFile, dragOver, setDragOver, fileRef, handleGenerate, handleFileDrop, handleFileSelect }} />}
      </LayoutApp>
    );
  }

  /* ════════════════════════ CHAT VIEW ════════════════════════ */
  return (
    <LayoutApp>
      <div className="flex h-full overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-[260px] flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-bg-2/50">
          {/* Back */}
          <div className="px-4 pt-4 pb-2">
            <button onClick={() => { setView("grid"); setActivePersonaId(null); setSessionId(null); setMessages([]); }} className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors">
              <ArrowLeft size={12} strokeWidth={1.5} /> Todas as personas
            </button>
          </div>

          {/* Persona selector */}
          <div className="px-3 pb-2">
            <p className="text-[8px] uppercase tracking-[0.2em] text-text-muted mb-2 px-1 font-mono">Personas</p>
            <div className="space-y-0.5 max-h-[180px] overflow-y-auto">
              {personas.map((p) => (
                <button key={p.id} onClick={() => { if (p.id !== activePersonaId) openPersona(p.id); }} className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all relative", p.id === activePersonaId ? "bg-white/[0.06]" : "hover:bg-white/[0.03]")}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center border shrink-0" style={{ backgroundColor: `${p.avatar_color}12`, borderColor: `${p.avatar_color}25` }}>
                    <span className="text-[9px] font-bold" style={{ color: p.avatar_color }}>{p.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[11px] truncate", p.id === activePersonaId ? "text-text-primary font-medium" : "text-text-secondary")}>{p.name}</p>
                    {p.niche && <p className="text-[9px] text-text-muted truncate">{p.niche}</p>}
                  </div>
                  {p.id === activePersonaId && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-gold rounded-r" />}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.05] mx-3 my-1" />

          {/* Sessions */}
          <div className="px-3 pt-2 pb-2">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[8px] uppercase tracking-[0.2em] text-text-muted font-mono">Conversas</p>
              <button onClick={newSession} className="text-[9px] text-text-muted hover:text-text-primary transition-colors flex items-center gap-1">
                <Plus size={10} strokeWidth={2} /> Nova
              </button>
            </div>
            <div className="relative mb-2">
              <Search size={12} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted/40" />
              <input value={sessionSearch} onChange={(e) => setSessionSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-bg-3/60 border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-gold/20 transition-colors" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
            {filteredSessions.length === 0 ? (
              <p className="text-[10px] text-text-muted/50 text-center py-6">{sessionSearch ? "Sem resultados" : "Nenhuma conversa"}</p>
            ) : filteredSessions.map((s) => (
              <div key={s.id} onClick={() => loadSession(s.id)} className={cn("px-3 py-2.5 rounded-lg cursor-pointer group relative transition-all", s.id === sessionId ? "bg-white/[0.05]" : "hover:bg-white/[0.03]")}>
                <p className={cn("text-[11px] truncate leading-tight", s.id === sessionId ? "text-text-primary font-medium" : "text-text-secondary")}>{s.title || "Nova conversa"}</p>
                <p className="text-[9px] text-text-muted/60 mt-0.5 font-mono">{fmtDate(s.last_message_at)}</p>
                {s.id === sessionId && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-gold rounded-r" />}
                <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-text-muted/30 hover:text-red-400 transition-all"><Trash2 size={10} strokeWidth={1.5} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER CHAT ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-bg-1">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {persona && (
                <>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0" style={{ backgroundColor: `${persona.avatar_color}12`, borderColor: `${persona.avatar_color}35` }}>
                    <span className="text-[10px] font-bold" style={{ color: persona.avatar_color }}>{persona.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[13px] text-text-primary font-semibold truncate">{activeSession?.title || persona.name}</h2>
                    <p className="text-[9px] text-text-muted">{[persona.age_range, persona.niche].filter(Boolean).join(" · ")}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Mode toggle */}
              <div className="flex items-center p-0.5 bg-bg-3/80 rounded-lg border border-white/[0.05]">
                <button onClick={() => setMode("chat")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all", mode === "chat" ? "bg-gold/12 text-gold" : "text-text-muted hover:text-text-secondary")}>
                  <MessageCircle size={11} strokeWidth={1.5} /> Conversar
                </button>
                <button onClick={() => setMode("test")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all", mode === "test" ? "bg-nova/12 text-nova" : "text-text-muted hover:text-text-secondary")}>
                  <ScanLine size={11} strokeWidth={1.5} /> Testar
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 fluid-chat-bg">
                <div className="ai-orb-empty mb-5">
                  <div className="ai-orb-container"><div className="ai-orb-c ai-orb-c4" /><div className="ai-orb-c ai-orb-c3" /><div className="ai-orb-c ai-orb-c2" /><div className="ai-orb-c ai-orb-c1" /></div>
                  <div className="ai-orb-glass" />
                  <div className="ai-orb-rings"><div className="ai-orb-ring ai-orb-ring-1" /><div className="ai-orb-ring ai-orb-ring-2" /></div>
                </div>
                <p className="text-[14px] text-text-secondary font-light">{mode === "test" ? "Teste sua copy" : "Converse"} com {persona?.name}</p>
                <p className="text-[10px] text-text-muted mt-1.5 max-w-[280px] leading-relaxed">
                  {mode === "test" ? "Envie uma headline, copy ou oferta e receba um relatorio de reacao da persona" : "A IA responde em primeira pessoa, como o cliente responderia de verdade"}
                </p>
              </div>
            ) : (
              <div className="px-5 py-5 space-y-4 max-w-3xl mx-auto">
                {messages.map((msg) => {
                  const report = msg.role === "assistant" && mode === "test" && msg.content ? tryParseReport(msg.content) : null;
                  return (
                    <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "assistant" && persona && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center border shrink-0 mt-1" style={{ backgroundColor: `${persona.avatar_color}12`, borderColor: `${persona.avatar_color}25` }}>
                          <span className="text-[7px] font-bold" style={{ color: persona.avatar_color }}>{persona.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className={cn("max-w-[78%]", msg.role === "user" ? "text-right" : "")}>
                        {/* Offer refs chips above user message */}
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
                        <div className={cn(
                          "rounded-2xl px-4 py-3 text-[12px] leading-[1.7]",
                          msg.role === "user" ? "bg-bg-3 border border-white/[0.08] text-text-primary" : "bg-bg-2/80 border border-white/[0.05] text-text-secondary"
                        )}>
                          {report ? <ReportView r={report} /> : <div className="whitespace-pre-wrap">{msg.content}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {loading && messages[messages.length - 1]?.content === "" && (
                  <div className="flex items-center gap-2.5 py-2 animate-fade-in">
                    <div className="ai-orb-mini"><div className="ai-orb-container"><div className="ai-orb-c ai-orb-c4" /><div className="ai-orb-c ai-orb-c3" /><div className="ai-orb-c ai-orb-c2" /><div className="ai-orb-c ai-orb-c1" /></div><div className="ai-orb-glass" /></div>
                    <span className="text-[10px] text-text-muted animate-pulse">{mode === "test" ? `Analisando como ${persona?.name}` : "Pensando"}<span className="loading-dots" /></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.06] px-5 py-3 bg-bg-2/20 shrink-0 relative">
            {/* @ offer picker (floating above input) */}
            {showOfferPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOfferPicker(false)} />
                <div className="absolute bottom-full mb-1 left-5 w-[280px] bg-bg-3 border border-white/[0.12] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
                    <p className="text-[8px] uppercase tracking-[0.18em] text-text-muted font-mono">@ Referenciar oferta</p>
                    {selectedOfferIds.length > 0 && (
                      <button onClick={() => setSelectedOfferIds([])} className="text-[8px] text-text-muted hover:text-red-400 transition-colors">Limpar</button>
                    )}
                  </div>
                  <div className="max-h-[220px] overflow-y-auto p-1.5">
                    {offers.length === 0 ? (
                      <div className="text-center py-6 px-3">
                        <Target size={16} strokeWidth={1} className="text-text-muted/20 mx-auto mb-2" />
                        <p className="text-[10px] text-text-muted">Nenhuma oferta disponivel</p>
                        <p className="text-[9px] text-text-muted/50 mt-0.5">Crie ofertas no modulo Ofertas ou teste uma copy no painel</p>
                      </div>
                    ) : offers.map((o) => {
                      const sel = selectedOfferIds.includes(o.id);
                      const report = o.last_report as Record<string, unknown> | null;
                      const score = report?.reacao_emocional as number | undefined;
                      const isBriefing = o.source === "briefing";
                      return (
                        <div key={o.id} className="flex items-center gap-1.5 group/offer">
                          <button onClick={() => { toggleOffer(o.id); if (!sel) setShowOfferPicker(false); }} className={cn("flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors min-w-0", sel ? "bg-gold/10" : "hover:bg-white/[0.04]")}>
                            <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors", sel ? "bg-gold border-gold" : "border-white/[0.12]")}>
                              {sel && <span className="text-[8px] text-black font-bold">&#10003;</span>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className={cn("text-[10px] truncate", sel ? "text-gold font-medium" : "text-text-secondary")}>{o.title}</p>
                                <span className={cn("text-[7px] px-1 py-0 rounded shrink-0 uppercase font-semibold tracking-wider", isBriefing ? "bg-nova/10 text-nova border border-nova/20" : "bg-white/[0.04] text-text-muted border border-white/[0.06]")}>
                                  {isBriefing ? "Oferta" : "Copy"}
                                </span>
                              </div>
                              <p className="text-[8px] text-text-muted/50 truncate">{o.content.slice(0, 60)}</p>
                            </div>
                            {score && (
                              <span className={cn("text-[9px] font-bold font-mono shrink-0", score >= 7 ? "text-emerald-400" : score >= 4 ? "text-amber-400" : "text-red-400")}>{score}/10</span>
                            )}
                          </button>
                          {!isBriefing && (
                            <button onClick={() => deleteOffer(o.id)} className="p-1 rounded opacity-0 group-hover/offer:opacity-100 hover:bg-red-500/10 text-text-muted/30 hover:text-red-400 transition-all shrink-0">
                              <Trash2 size={9} strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {offers.length > 0 && selectedOfferIds.length > 0 && (
                    <div className="px-3 py-1.5 border-t border-white/[0.06]">
                      <p className="text-[8px] text-text-muted/50 text-center">{selectedOfferIds.length} referenciada{selectedOfferIds.length !== 1 ? "s" : ""}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className={cn("flex items-center gap-1.5 rounded-2xl border bg-bg-3/80 transition-all flex-wrap px-3 py-1.5 min-h-[44px]", input.trim() || selectedOfferIds.length > 0 ? "border-white/[0.10]" : "border-white/[0.05]", loading && "opacity-50 pointer-events-none")}>
              {/* Inline @ chips */}
              {selectedOfferIds.map((oid) => {
                const o = offers.find((x) => x.id === oid);
                if (!o) return null;
                return (
                  <span key={oid} className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-md bg-gold/12 border border-gold/20 text-gold text-[11px] shrink-0 max-w-[180px]">
                    <span className="text-[11px] font-semibold opacity-60">@</span>
                    <span className="truncate text-[11px]">{o.title}</span>
                    <button onClick={() => toggleOffer(oid)} className="p-0.5 rounded hover:bg-gold/20 ml-0.5 shrink-0"><X size={9} strokeWidth={2} /></button>
                  </span>
                );
              })}

              <input ref={inputRef} type="text" value={input} onChange={(e) => {
                const val = e.target.value;
                setInput(val);
                if (val.endsWith("@")) {
                  setShowOfferPicker(true);
                  setInput(val.slice(0, -1));
                }
              }} onKeyDown={onKey} placeholder={selectedOfferIds.length > 0 ? "Sua mensagem..." : (mode === "test" ? "Cole headline ou @ para oferta..." : "Digite ou @ para oferta...")} className="flex-1 min-w-[120px] bg-transparent py-1.5 text-[12px] text-text-primary placeholder:text-text-muted/35 focus:outline-none" />

              <button onClick={sendMessage} disabled={loading || !input.trim()} className={cn("p-2 rounded-full transition-all duration-300 shrink-0", input.trim() ? "bg-nova text-black hover:bg-nova/80 active:scale-95 opacity-100" : "text-text-muted/20 opacity-0 pointer-events-none")}>
                <Send size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT TEST PANEL ── */}
        {showTest && (
          <div className="w-[300px] flex-shrink-0 border-l border-white/[0.06] flex flex-col bg-bg-2/40">
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] uppercase tracking-[0.18em] text-text-muted font-mono">Teste rapido</p>
                <button onClick={() => setShowTest(false)} className="p-1 rounded text-text-muted/40 hover:text-text-secondary"><X size={13} strokeWidth={1.5} /></button>
              </div>
              <textarea value={testCopy} onChange={(e) => setTestCopy(e.target.value)} placeholder="Cole aqui a copy, headline ou oferta..." rows={3} className="w-full bg-bg-3/60 border border-white/[0.06] rounded-xl px-3 py-2.5 text-[11px] text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-nova/20 resize-none leading-relaxed" />
              <button onClick={runTest} disabled={testLoading || !testCopy.trim()} className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-nova text-black text-[10px] font-bold uppercase tracking-[0.08em] hover:bg-nova/90 disabled:opacity-40 transition-colors">
                {testLoading ? <Loader2 size={11} className="animate-spin" /> : <ScanLine size={11} strokeWidth={2} />} Analisar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {testLoading ? (
                <div className="flex flex-col items-center py-12">
                  <div className="ai-orb-mini mb-3"><div className="ai-orb-container"><div className="ai-orb-c ai-orb-c4" /><div className="ai-orb-c ai-orb-c3" /><div className="ai-orb-c ai-orb-c2" /><div className="ai-orb-c ai-orb-c1" /></div><div className="ai-orb-glass" /></div>
                  <p className="text-[10px] text-text-muted animate-pulse">Analisando<span className="loading-dots" /></p>
                </div>
              ) : testReport ? (
                <ReportView r={testReport} />
              ) : (
                <div className="flex flex-col items-center py-12 text-center">
                  <ScanLine size={18} strokeWidth={1} className="text-text-muted/15 mb-3" />
                  <p className="text-[10px] text-text-muted/60">Cole uma copy e clique Analisar</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && <GenerateModal {...{ showModal, setShowModal: setShowModal, studyText, setStudyText, generating, genError, setGenError, modalTab, setModalTab, uploadFile, setUploadFile, dragOver, setDragOver, fileRef, handleGenerate, handleFileDrop, handleFileSelect }} />}
    </LayoutApp>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GENERATE MODAL (extracted to reduce main component noise)
   ═══════════════════════════════════════════════════════════════ */

function GenerateModal({ setShowModal, studyText, setStudyText, generating, genError, setGenError, modalTab, setModalTab, uploadFile, setUploadFile, dragOver, setDragOver, fileRef, handleGenerate, handleFileDrop, handleFileSelect }: {
  showModal: boolean; setShowModal: (v: boolean) => void;
  studyText: string; setStudyText: (v: string) => void;
  generating: boolean; genError: string; setGenError: (v: string) => void;
  modalTab: "text" | "pdf"; setModalTab: (v: "text" | "pdf") => void;
  uploadFile: File | null; setUploadFile: (v: File | null) => void;
  dragOver: boolean; setDragOver: (v: boolean) => void;
  fileRef: React.RefObject<HTMLInputElement>;
  handleGenerate: () => void; handleFileDrop: (e: React.DragEvent) => void; handleFileSelect: () => void;
}) {
  const close = () => { if (!generating) { setShowModal(false); setGenError(""); setUploadFile(null); } };
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={close} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div className="bg-bg-2 border border-white/[0.10] rounded-2xl w-full max-w-lg shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-[15px] font-display text-text-primary">Criar Persona</h2>
              <p className="text-[11px] text-text-muted mt-0.5">Cole texto ou envie um documento</p>
            </div>
            <button onClick={close} className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-white/[0.06] transition-colors"><X size={16} strokeWidth={1.5} /></button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-1 p-1 bg-bg-3/80 rounded-lg mb-4 border border-white/[0.04]">
              <button onClick={() => setModalTab("text")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-colors", modalTab === "text" ? "bg-white/[0.08] text-text-primary" : "text-text-muted hover:text-text-secondary")}>
                <Type size={11} strokeWidth={1.5} /> Texto
              </button>
              <button onClick={() => setModalTab("pdf")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-colors", modalTab === "pdf" ? "bg-white/[0.08] text-text-primary" : "text-text-muted hover:text-text-secondary")}>
                <FileText size={11} strokeWidth={1.5} /> Documento
              </button>
            </div>
            {modalTab === "text" ? (
              <>
                <textarea value={studyText} onChange={(e) => setStudyText(e.target.value)} placeholder="Cole aqui o estudo de publico, pesquisas, reviews, depoimentos..." rows={10} className="w-full bg-bg-3/60 border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted/35 focus:outline-none focus:border-nova/25 resize-none leading-relaxed" />
                <p className="text-[9px] text-text-muted/40 mt-1.5 font-mono">{studyText.length} caracteres</p>
              </>
            ) : (
              <>
                {!uploadFile ? (
                  <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleFileDrop} onClick={() => fileRef.current?.click()} className={cn("flex flex-col items-center justify-center py-12 rounded-xl border border-dashed cursor-pointer transition-all", dragOver ? "border-nova/40 bg-nova/[0.04]" : "border-white/[0.10] bg-bg-3/30 hover:border-white/[0.18]")}>
                    <Upload size={22} strokeWidth={1.5} className={cn("mb-2.5", dragOver ? "text-nova" : "text-text-muted/40")} />
                    <p className="text-[11px] text-text-secondary">Arraste ou <span className="text-nova">selecione</span></p>
                    <p className="text-[9px] text-text-muted/50 mt-1">PDF, Markdown, TXT</p>
                    <input ref={fileRef} type="file" accept=".pdf,.md,.txt" className="hidden" onChange={handleFileSelect} />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-3/60 border border-white/[0.06]">
                    <div className="w-10 h-10 rounded-lg bg-nova/8 flex items-center justify-center shrink-0"><FileText size={18} strokeWidth={1.5} className="text-nova" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-text-primary truncate">{uploadFile.name}</p>
                      <p className="text-[9px] text-text-muted font-mono">{(uploadFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button onClick={() => { setUploadFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"><X size={14} strokeWidth={1.5} /></button>
                  </div>
                )}
              </>
            )}
            {genError && <p className="text-[11px] text-red-400 mt-3">{genError}</p>}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 pb-5">
            <button onClick={close} className="px-4 py-2 rounded-lg text-[11px] text-text-muted hover:text-text-secondary transition-colors">Cancelar</button>
            <button onClick={handleGenerate} disabled={generating || (modalTab === "text" ? studyText.trim().length < 50 : !uploadFile)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-nova text-black text-[11px] font-bold uppercase tracking-[0.10em] hover:bg-nova/90 disabled:opacity-40 transition-colors">
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} strokeWidth={1.5} />}
              {generating ? "Gerando..." : "Gerar persona"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
