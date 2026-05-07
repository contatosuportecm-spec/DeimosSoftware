"use client";

import { ForgeGeneration } from "@/types/forge";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Download, Image as ImageIcon, Video } from "lucide-react";

interface GenerationCanvasProps {
  generation: ForgeGeneration | null;
  isLoading: boolean;
  error: string | null;
  category: "image" | "video" | "lipsync";
}

export default function GenerationCanvas({ generation, isLoading, error, category }: GenerationCanvasProps) {
  // Empty state
  if (!generation && !isLoading && !error) {
    const Icon = category === "image" ? ImageIcon : Video;
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-bg-2 min-h-[320px]">
        <div className="w-16 h-16 rounded-2xl bg-bg-3 flex items-center justify-center border border-border">
          <Icon size={28} strokeWidth={1} className="text-text-muted/40" />
        </div>
        <p className="text-xs text-text-muted">Escreva um prompt e clique em Gerar</p>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-bg-2 min-h-[320px]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-gold/20 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin" style={{ animationDuration: "2s" }} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs text-text-secondary font-medium">Gerando...</p>
          <p className="text-[10px] text-text-muted">
            {generation?.status === "processing" ? "Processando no servidor" : "Enviando requisição"}
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border border-danger/20 bg-danger/5 min-h-[320px]">
        <AlertCircle size={28} strokeWidth={1.5} className="text-danger" />
        <p className="text-xs text-danger max-w-xs text-center">{error}</p>
      </div>
    );
  }

  // Result
  if (generation?.status === "completed" && generation.result_url) {
    const isVideo = category === "video" || category === "lipsync";

    return (
      <div className="flex-1 flex flex-col rounded-xl border border-border bg-bg-2 overflow-hidden min-h-[320px]">
        <div className="flex-1 flex items-center justify-center p-4 bg-black/30">
          {isVideo ? (
            <video
              src={generation.result_url}
              controls
              autoPlay
              loop
              className="max-w-full max-h-[500px] rounded-lg"
            />
          ) : (
            <img
              src={generation.result_url}
              alt={generation.prompt || "Generated"}
              className="max-w-full max-h-[500px] rounded-lg object-contain"
            />
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
          <span className="text-[10px] text-text-muted font-mono">
            {generation.model_id}
          </span>
          <a
            href={generation.result_url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-3 hover:bg-bg-4 text-text-secondary hover:text-text-primary text-[10px] transition-colors border border-border"
          >
            <Download size={11} />
            Download
          </a>
        </div>
      </div>
    );
  }

  return null;
}
