"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WikiPage } from "@/types";
import LayoutApp from "@/app/layout-app";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Send, Loader2, Feather, Pencil } from "lucide-react";
import WikiPageEditor from "@/components/knowledge/WikiPageEditor";
import { useRouter } from "next/navigation";

interface ConsultMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function CopywriterPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [voice, setVoice] = useState<WikiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ConsultMessage[]>([]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/wiki/pages/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) return;
        setVoice(data);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function ask() {
    if (!input.trim() || sending) return;
    const question = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: question, timestamp: Date.now() }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/copywriters/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice_slug: slug,
          question,
          context: context.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, timestamp: Date.now() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `[erro] ${err instanceof Error ? err.message : "falha"}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <LayoutApp>
        <div className="max-w-5xl mx-auto px-6 py-10 text-xs text-text-muted">
          Carregando...
        </div>
      </LayoutApp>
    );
  }

  if (!voice) {
    return (
      <LayoutApp>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <Link href="/copywriters" className="text-xs text-text-muted hover:text-nova flex items-center gap-1.5 mb-4">
            <ArrowLeft size={12} strokeWidth={1.5} /> Voltar
          </Link>
          <Card padding="lg">
            <p className="text-sm text-text-secondary">Copywriter não encontrado.</p>
          </Card>
        </div>
      </LayoutApp>
    );
  }

  const structured = (voice.structured ?? {}) as { era?: string; best_for?: string[] };

  return (
    <LayoutApp>
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/copywriters"
          className="text-xs text-text-muted hover:text-nova flex items-center gap-1.5"
        >
          <ArrowLeft size={12} strokeWidth={1.5} /> Copywriters
        </Link>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-text-muted hover:text-nova flex items-center gap-1.5"
        >
          <Pencil size={12} strokeWidth={1.5} /> Editar
        </button>
      </div>

      {editing && (
        <WikiPageEditor
          page={voice}
          onClose={() => setEditing(false)}
          onSaved={(updated) => setVoice(updated)}
          onDeleted={() => router.push("/copywriters")}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        {/* Sidebar: perfil */}
        <div className="space-y-4">
          <Card padding="lg">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-nova/10 border border-nova/20 flex items-center justify-center flex-shrink-0">
                <Feather size={20} strokeWidth={1.5} className="text-nova" />
              </div>
              <div>
                <h1 className="text-xl font-display text-text-primary mb-0.5">{voice.title}</h1>
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
                  {structured.era}
                </p>
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{voice.summary}</p>
          </Card>

          <Card padding="lg">
            <h2 className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-3">
              Perfil completo
            </h2>
            <div className="prose-deimos text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto pr-2">
              {voice.body_md}
            </div>
          </Card>
        </div>

        {/* Consulta */}
        <div className="flex flex-col h-[80vh]">
          <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-border px-5 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">Consultar</p>
              <p className="text-xs text-text-secondary mt-1">
                Pergunte como {voice.title.split(" ")[0]} responderia. Cole copy/headline pra ele
                analisar.
              </p>
            </div>

            {/* Mensagens */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-10 px-4">
                  <p className="text-xs text-text-muted leading-relaxed max-w-sm mx-auto">
                    Exemplos:<br />
                    <span className="text-text-secondary">
                      &quot;Como você abriria uma VSL pra GLP-1 brasileiro?&quot;<br />
                      &quot;Audita essa headline pra mim&quot; (cola no campo abaixo)
                    </span>
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] bg-nova/10 border border-nova/20 rounded-lg px-3.5 py-2.5"
                        : "max-w-[90%] bg-bg-3 border border-border rounded-lg px-3.5 py-2.5"
                    }
                  >
                    <p className="text-[9px] uppercase tracking-[0.18em] text-text-muted mb-1.5">
                      {m.role === "user" ? "Você" : voice.title}
                    </p>
                    <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Loader2 size={12} className="animate-spin" />
                  {voice.title} está pensando...
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-4 space-y-2">
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="(opcional) Cole copy/headline/briefing pra ser analisado..."
                className="w-full bg-bg-2 border border-border rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-nova/40"
                rows={2}
              />
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), ask())}
                  placeholder="Sua pergunta..."
                  className="flex-1 bg-bg-2 border border-border rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-nova/40"
                  disabled={sending}
                />
                <Button onClick={ask} disabled={sending || !input.trim()} size="sm">
                  <Send size={12} strokeWidth={1.5} />
                  Enviar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
    </LayoutApp>
  );
}
