"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";

interface QuizGenerateModalProps {
  open: boolean;
  onClose: () => void;
  /** Generates the questions and creates the nodes. Resolves with how many were created. */
  onGenerate: (text: string) => Promise<number>;
}

export default function QuizGenerateModal({ open, onClose, onGenerate }: QuizGenerateModalProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setError(null); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleGenerate = async () => {
    if (text.trim().length < 20) { setError("Cole um texto com pelo menos 20 caracteres."); return; }
    setLoading(true);
    setError(null);
    try {
      await onGenerate(text.trim());
      setText("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar perguntas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-bg-2 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#FF8A1F18", border: "1px solid #FF8A1F30" }}
            >
              <Sparkles size={15} strokeWidth={1.5} style={{ color: "#FF8A1F" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Gerar perguntas com IA</h2>
              <p className="text-[11px] text-text-muted">Cole um texto e a IA cria as perguntas e respostas do quiz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors disabled:opacity-40"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            placeholder={"Ex:\nQue eventos te levaram a ganhar peso\nO que mais deseja alcançar\nComo é sua energia durante o dia\nQuão frequente se exercita\n..."}
            rows={12}
            className="w-full bg-bg-1 border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted/60 outline-none focus:border-[#FF8A1F]/40 resize-none leading-relaxed disabled:opacity-50"
          />

          {error && (
            <p className="text-[12px] text-red-400">{error}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted">
              {text.trim().length} caracteres
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-[12px] text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-[12px] font-semibold text-black bg-[#FF8A1F] hover:bg-[#E5740F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} strokeWidth={2} />
                    Gerar perguntas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
