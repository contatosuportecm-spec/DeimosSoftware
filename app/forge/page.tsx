"use client";

import { useRouter } from "next/navigation";
import LayoutApp from "@/app/layout-app";
import { Image, Video, Mic, ArrowRight, Zap, KeyRound, Clock, Sparkles } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useForgeHistory } from "@/hooks/useForgeHistory";

interface StudioCard {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  path: string;
  models: string[];
}

const STUDIOS: StudioCard[] = [
  {
    id: "image",
    name: "Image Studio",
    subtitle: "Text → Image",
    description: "Gere imagens para anúncios e criativos com modelos de última geração.",
    icon: Image,
    path: "/forge/image",
    models: ["Nano Banana 2", "GPT Image 2"],
  },
  {
    id: "video",
    name: "Video Studio",
    subtitle: "Text / Image → Video",
    description: "Crie vídeos cinematográficos para hooks, VSLs e criativos de performance.",
    icon: Video,
    path: "/forge/video",
    models: ["Seedance 2.0", "Veo 3", "Kling Motion"],
  },
  {
    id: "lipsync",
    name: "LipSync Studio",
    subtitle: "Image + Audio → Video",
    description: "Transforme fotos em talking heads com sincronia labial perfeita para UGC.",
    icon: Mic,
    path: "/forge/lipsync",
    models: ["LTX 2.3 Lipsync"],
  },
];

export default function ForgePage() {
  const router = useRouter();
  const { generations, loading: histLoading } = useForgeHistory(undefined, 5);

  return (
    <LayoutApp>
      <div className="p-6 space-y-5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[23px] font-light text-text-primary leading-tight tracking-tight">
              AI{" "}
              <span className="italic text-nova font-light">Studio.</span>
            </h1>
            <p className="text-[12px] text-text-muted mt-1.5 font-normal">
              Gere imagens, vídeos e talking heads com IA. Suas API keys, suas regras.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/forge/settings")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-3 border border-border hover:border-border-strong text-[10px] text-text-muted hover:text-text-secondary transition-colors"
            >
              <KeyRound size={11} strokeWidth={1.5} />
              API Keys
            </button>
          </div>
        </div>

        {/* ── Studios ── */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted font-semibold mb-3 px-1">
            Studios
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {STUDIOS.map((studio) => {
              const Icon = studio.icon;

              return (
                <button
                  key={studio.id}
                  onClick={() => router.push(studio.path)}
                  className="glass glass-hover rounded-xl text-left group overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    {/* Icon + Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-nova/10 border border-nova/20 flex items-center justify-center shadow-[0_0_12px_rgba(255,138,31,0.15)]">
                          <Icon size={16} strokeWidth={1.5} className="text-nova" />
                        </div>
                        <div>
                          <h3 className="text-[13px] font-semibold text-text-primary group-hover:text-white transition-colors leading-tight">
                            {studio.name}
                          </h3>
                          <p className="text-[9px] font-mono text-nova/60 mt-0.5">
                            {studio.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-nova/10 transition-all">
                        <ArrowRight size={12} strokeWidth={2} className="text-nova" />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {studio.description}
                    </p>

                    {/* Models tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
                      {studio.models.map((model) => (
                        <span
                          key={model}
                          className="px-2 py-[3px] rounded bg-bg-4/60 text-[9px] font-mono text-text-muted border border-border"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Bottom: Quick access + Recent ── */}
        <div className="grid grid-cols-[1fr_296px] gap-4">
          {/* Quick start */}
          <div className="glass rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-nova shadow-[0_0_8px_rgba(255,138,31,0.6)]" />
                <span className="text-xs font-semibold text-text-primary tracking-widest uppercase">
                  FORGE
                </span>
              </div>
              <span className="text-[10px] text-text-muted">AI Content Engine</span>
            </div>

            <div className="flex-1 p-5 flex items-center justify-center min-h-[160px]">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-xl bg-bg-3 border border-border flex items-center justify-center">
                    <Sparkles size={18} strokeWidth={1.5} className="text-text-muted/40" />
                  </div>
                </div>
                <p className="text-[12px] text-text-muted">
                  Selecione um studio acima para começar a gerar conteúdo.
                </p>
                <button
                  onClick={() => router.push("/forge/image")}
                  className="text-[11px] text-nova hover:text-nova-hover transition-colors"
                >
                  Abrir Image Studio →
                </button>
              </div>
            </div>
          </div>

          {/* Recent generations */}
          <div className="glass glass-hover rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-semibold">
                Últimas gerações
              </p>
              <Clock size={11} strokeWidth={1.5} className="text-text-muted/40" />
            </div>

            {histLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-nova/20 border-t-nova rounded-full animate-spin" />
              </div>
            ) : generations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-1.5">
                <p className="text-[11px] text-text-muted/60">Nenhuma geração ainda</p>
                <button
                  onClick={() => router.push("/forge/image")}
                  className="text-[10px] text-gold/70 hover:text-gold transition-colors"
                >
                  Criar primeira →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {generations.slice(0, 4).map((gen) => (
                  <div
                    key={gen.id}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-bg-3/40 border border-border"
                  >
                    <div className="w-7 h-7 rounded bg-bg-4 flex items-center justify-center flex-shrink-0">
                      {gen.category === "image" ? (
                        <Image size={11} strokeWidth={1.5} className="text-text-muted/50" />
                      ) : gen.category === "video" ? (
                        <Video size={11} strokeWidth={1.5} className="text-text-muted/50" />
                      ) : (
                        <Mic size={11} strokeWidth={1.5} className="text-text-muted/50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-text-primary truncate leading-tight">
                        {gen.prompt || gen.model_id}
                      </p>
                      <p className="text-[9px] text-text-muted font-mono mt-0.5">
                        {gen.model_id}
                      </p>
                    </div>
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        gen.status === "completed"
                          ? "bg-emerald-400"
                          : gen.status === "failed"
                          ? "bg-red-400"
                          : "bg-amber-400 animate-pulse"
                      }`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutApp>
  );
}
