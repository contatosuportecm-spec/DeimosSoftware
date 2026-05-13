"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LayoutApp from "@/app/layout-app";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { AvatarInterviewOutput, AvatarTestCopyOutput, WikiPage } from "@/types";
import {
  ArrowLeft, MessageCircle, Beaker, Loader2, Send, Pencil,
  CheckCircle2, AlertTriangle, XCircle, UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import WikiPageEditor from "@/components/knowledge/WikiPageEditor";

type Mode = "interview" | "test_copy";

export default function AvatarDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [avatar, setAvatar] = useState<WikiPage | null>(null);
  const [mode, setMode] = useState<Mode>("interview");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // interview
  const [question, setQuestion] = useState("");
  const [askResponses, setAskResponses] = useState<{ q: string; a: AvatarInterviewOutput }[]>([]);
  const [asking, setAsking] = useState(false);

  // test copy
  const [copyToTest, setCopyToTest] = useState("");
  const [testResult, setTestResult] = useState<AvatarTestCopyOutput | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch(`/api/wiki/pages/${slug}`)
      .then((r) => r.json())
      .then((d) => !d?.error && setAvatar(d))
      .finally(() => setLoading(false));
  }, [slug]);

  async function ask() {
    if (!question.trim() || asking) return;
    const q = question;
    setQuestion("");
    setAsking(true);
    try {
      const res = await fetch("/api/avatar/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_slug: slug, question: q }),
      });
      const data = await res.json();
      setAskResponses((prev) => [...prev, { q, a: data }]);
    } finally {
      setAsking(false);
    }
  }

  async function testCopy() {
    if (!copyToTest.trim() || testing) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/avatar/test-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_slug: slug, copy: copyToTest }),
      });
      const data = await res.json();
      setTestResult(data);
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <LayoutApp>
        <div className="max-w-5xl mx-auto px-6 py-10 text-xs text-text-muted">Carregando...</div>
      </LayoutApp>
    );
  }

  if (!avatar) {
    return (
      <LayoutApp>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <Link href="/avatar" className="text-xs text-text-muted hover:text-ai-blue flex items-center gap-1.5 mb-4">
            <ArrowLeft size={12} strokeWidth={1.5} /> Voltar
          </Link>
          <Card padding="lg">
            <p className="text-sm text-text-secondary">Avatar não encontrado.</p>
          </Card>
        </div>
      </LayoutApp>
    );
  }

  return (
    <LayoutApp>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-3">
          <Link href="/avatar" className="text-xs text-text-muted hover:text-ai-blue flex items-center gap-1.5">
            <ArrowLeft size={12} strokeWidth={1.5} /> Avatar Vivo
          </Link>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-text-muted hover:text-ai-blue flex items-center gap-1.5"
          >
            <Pencil size={12} strokeWidth={1.5} /> Editar
          </button>
        </div>

        {editing && (
          <WikiPageEditor
            page={avatar}
            onClose={() => setEditing(false)}
            onSaved={(updated) => setAvatar(updated)}
            onDeleted={() => router.push("/avatar")}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-130px)]">
          {/* Sidebar: perfil */}
          <div className="space-y-3 overflow-y-auto pr-1">
            <Card padding="md">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center flex-shrink-0">
                  <UserCircle size={18} strokeWidth={1.5} className="text-ai-blue" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-medium text-text-primary leading-tight">{avatar.title}</h1>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed mt-2">{avatar.summary}</p>
            </Card>

            <Card padding="md">
              <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted mb-2">Perfil</p>
              <div className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap max-h-[70vh] overflow-y-auto">
                {avatar.body_md}
              </div>
            </Card>
          </div>

          {/* Conteúdo principal */}
          <Card padding="none" className="flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setMode("interview")}
                className={cn(
                  "flex-1 px-4 py-3 text-xs flex items-center justify-center gap-2 transition-colors",
                  mode === "interview"
                    ? "text-ai-blue bg-bg-3 border-b-2 border-ai-blue"
                    : "text-text-muted hover:bg-white/[0.02]",
                )}
              >
                <MessageCircle size={13} strokeWidth={1.5} /> Entrevistar
              </button>
              <button
                onClick={() => setMode("test_copy")}
                className={cn(
                  "flex-1 px-4 py-3 text-xs flex items-center justify-center gap-2 transition-colors",
                  mode === "test_copy"
                    ? "text-nova bg-bg-3 border-b-2 border-nova"
                    : "text-text-muted hover:bg-white/[0.02]",
                )}
              >
                <Beaker size={13} strokeWidth={1.5} /> Testar copy
              </button>
            </div>

            {/* Interview mode */}
            {mode === "interview" && (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {askResponses.length === 0 && (
                    <p className="text-xs text-text-muted text-center mt-10 leading-relaxed">
                      Exemplos:<br />
                      <span className="text-text-secondary">
                        &quot;O que você sente quando olha no espelho de manhã?&quot;<br />
                        &quot;Você confiaria mais numa médica ou numa influencer?&quot;<br />
                        &quot;O que faz você desistir de uma dieta?&quot;
                      </span>
                    </p>
                  )}
                  {askResponses.map((r, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-end">
                        <div className="bg-ai-blue/10 border border-ai-blue/20 rounded-lg px-3 py-2 max-w-[85%]">
                          <p className="text-[9px] uppercase tracking-wider text-text-muted mb-1">Pesquisador</p>
                          <p className="text-xs text-text-primary">{r.q}</p>
                        </div>
                      </div>
                      <div className="bg-bg-3 border border-border rounded-lg px-3 py-2 max-w-[90%]">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] uppercase tracking-wider text-text-muted">{avatar.title}</p>
                          <ConfidenceBadge confidence={r.a.confidence} />
                        </div>
                        <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">{r.a.response}</p>
                      </div>
                    </div>
                  ))}
                  {asking && (
                    <p className="text-xs text-text-muted flex items-center gap-2">
                      <Loader2 size={11} className="animate-spin" /> Pensando...
                    </p>
                  )}
                </div>
                <div className="border-t border-border p-3 flex gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && ask()}
                    placeholder="Sua pergunta para o avatar..."
                    disabled={asking}
                    className="flex-1 bg-bg-2 border border-border rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ai-blue/40"
                  />
                  <Button onClick={ask} disabled={asking || !question.trim()} size="sm">
                    <Send size={12} strokeWidth={1.5} />
                  </Button>
                </div>
              </>
            )}

            {/* Test copy mode */}
            {mode === "test_copy" && (
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Input */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">Copy a testar</p>
                    <textarea
                      value={copyToTest}
                      onChange={(e) => setCopyToTest(e.target.value)}
                      placeholder="Cole headline, lead, anúncio inteiro..."
                      className="w-full bg-bg-2 border border-border rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-nova/40 font-mono leading-relaxed"
                      rows={12}
                    />
                    <Button
                      onClick={testCopy}
                      disabled={testing || !copyToTest.trim()}
                      className="w-full"
                    >
                      {testing ? (
                        <><Loader2 size={12} className="animate-spin" /> Simulando...</>
                      ) : (
                        <><Beaker size={12} strokeWidth={1.5} /> Testar</>
                      )}
                    </Button>
                  </div>

                  {/* Resultado */}
                  <div className="space-y-3">
                    {!testResult && !testing && (
                      <p className="text-xs text-text-muted text-center mt-10 leading-relaxed">
                        Reação simulada<br />aparece aqui.
                      </p>
                    )}

                    {testResult && (
                      <>
                        {/* Interest */}
                        <Card padding="md">
                          <div className="flex items-baseline justify-between mb-2">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">Interesse</p>
                            <span className={cn(
                              "text-2xl font-mono",
                              testResult.interest >= 7 ? "text-success" :
                              testResult.interest >= 4 ? "text-warning" : "text-danger",
                            )}>
                              {testResult.interest}<span className="text-xs text-text-muted">/10</span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-bg-4 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                testResult.interest >= 7 ? "bg-success" :
                                testResult.interest >= 4 ? "bg-warning" : "bg-danger",
                              )}
                              style={{ width: `${testResult.interest * 10}%` }}
                            />
                          </div>
                          <p className="text-[10px] uppercase tracking-wider text-text-muted mt-3">
                            Próxima ação: <span className="text-text-secondary">{testResult.next_likely_action}</span>
                          </p>
                          <p className="text-[11px] text-text-secondary leading-relaxed mt-2 italic">
                            {testResult.reasoning}
                          </p>
                        </Card>

                        {testResult.objections_raised?.length > 0 && (
                          <Card padding="sm" className="border-warning/30 bg-warning/5">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-warning mb-1.5">
                              Objeções não respondidas
                            </p>
                            <ul className="space-y-1">
                              {testResult.objections_raised.map((o, i) => (
                                <li key={i} className="text-[11px] text-text-secondary">• {o}</li>
                              ))}
                            </ul>
                          </Card>
                        )}

                        {testResult.trigger_words_hit?.length > 0 && (
                          <Card padding="sm" className="border-danger/30 bg-danger/5">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-danger mb-1.5">
                              Palavras-gatilho usadas
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {testResult.trigger_words_hit.map((w, i) => (
                                <span key={i} className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded">
                                  {w}
                                </span>
                              ))}
                            </div>
                          </Card>
                        )}

                        {testResult.rewrite_in_avatar_voice && (
                          <Card padding="md">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">
                              Reescrita na voz do avatar
                            </p>
                            <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                              {testResult.rewrite_in_avatar_voice}
                            </p>
                          </Card>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </LayoutApp>
  );
}

function ConfidenceBadge({ confidence }: { confidence: AvatarInterviewOutput["confidence"] }) {
  const config = {
    high:    { icon: <CheckCircle2 size={10} />, label: "alta", color: "text-success" },
    medium:  { icon: <CheckCircle2 size={10} />, label: "média", color: "text-text-secondary" },
    low:     { icon: <AlertTriangle size={10} />, label: "baixa", color: "text-warning" },
    no_data: { icon: <XCircle size={10} />, label: "sem dados", color: "text-danger" },
  }[confidence];
  return (
    <span className={cn("text-[9px] uppercase tracking-wider flex items-center gap-1", config.color)}>
      {config.icon} {config.label}
    </span>
  );
}
