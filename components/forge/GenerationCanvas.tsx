"use client";

import { ForgeGeneration } from "@/types/forge";
import { Loader2, AlertCircle, Download, ImagePlus, Sparkles } from "lucide-react";

interface GenerationCanvasProps {
  generation: ForgeGeneration | null;
  isLoading: boolean;
  error: string | null;
  category: "image" | "video" | "lipsync";
}

export default function GenerationCanvas({ generation, isLoading, error, category }: GenerationCanvasProps) {
  // Result
  if (generation?.status === "completed" && generation.result_url) {
    const isVideo = category === "video" || category === "lipsync";

    return (
      <div className="flex-1 flex flex-col rounded-xl border border-border bg-bg-2 overflow-hidden min-h-0">
        <div className="flex-1 flex items-center justify-center p-6 bg-black/40 min-h-0">
          {isVideo ? (
            <video
              src={generation.result_url}
              controls
              autoPlay
              loop
              className="max-w-full max-h-full rounded-lg"
            />
          ) : (
            <img
              src={generation.result_url}
              alt={generation.prompt || "Generated"}
              className="max-w-full max-h-full rounded-lg object-contain"
            />
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-bg-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-[0.12em] flex-shrink-0">
              {generation.model_id}
            </span>
            {generation.prompt && (
              <span className="text-[10px] text-text-muted/60 truncate">
                · {generation.prompt}
              </span>
            )}
          </div>
          <a
            href={generation.result_url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-bg-3 hover:bg-bg-4 text-text-secondary hover:text-text-primary text-[10px] uppercase tracking-[0.12em] transition-colors border border-border"
          >
            <Download size={11} strokeWidth={1.5} />
            Download
          </a>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border border-danger/20 bg-danger/[0.03] min-h-0">
        <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center border border-danger/20">
          <AlertCircle size={22} strokeWidth={1.5} className="text-danger" />
        </div>
        <p className="text-xs text-danger max-w-sm text-center px-6">{error}</p>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 rounded-xl border border-border bg-bg-2 min-h-0">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-border" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin" style={{ animationDuration: "1.4s" }} />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-ember animate-spin" style={{ animationDuration: "2.2s", animationDirection: "reverse" }} />
          <Sparkles size={20} strokeWidth={1.5} className="text-gold relative" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs text-text-secondary font-medium tracking-wide">Gerando...</p>
          <p className="text-[10px] text-text-muted">
            {generation?.status === "processing" ? "Processando no servidor" : "Enviando requisição"}
          </p>
        </div>
      </div>
    );
  }

  // Empty state — estilo Krea/Higgsfield
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-bg-2 min-h-0 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,196,48,0.04),transparent_60%)]" />
      <div className="relative w-16 h-16 rounded-2xl bg-bg-3 border border-border flex items-center justify-center">
        <ImagePlus size={26} strokeWidth={1} className="text-text-muted/50" />
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-bg-2 border border-border flex items-center justify-center">
          <Sparkles size={10} strokeWidth={1.5} className="text-gold" />
        </div>
      </div>
      <div className="relative text-center space-y-1.5 px-6">
        <p className="text-sm text-text-secondary font-medium">Sua geração aparecerá aqui</p>
        <p className="text-[11px] text-text-muted">
          Digite um prompt detalhado e clique em <span className="text-gold">Gerar</span>
        </p>
      </div>
    </div>
  );
}
