"use client";

import { useState, FormEvent } from "react";
import { ForgeModel, ForgeGeneration, ForgeCategory } from "@/types/forge";
import { useForgeGenerate } from "@/hooks/useForgeGenerate";
import { useForgeUpload } from "@/hooks/useForgeUpload";
import ModelPicker from "./ModelPicker";
import AspectRatioPicker from "./AspectRatioPicker";
import ParamSelector from "./ParamSelector";
import GenerationCanvas from "./GenerationCanvas";
import HistorySidebar from "./HistorySidebar";
import UploadZone from "./UploadZone";
import ApiKeyGate from "./ApiKeyGate";
import { ArrowUp, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioShellProps {
  category: ForgeCategory;
  models: ForgeModel[];
  title: string;
}

export default function StudioShell({ category, models, title }: StudioShellProps) {
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id || "");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("");
  const [resolution, setResolution] = useState("");
  const [duration, setDuration] = useState<number>(0);
  const [quality, setQuality] = useState("");
  const [effect, setEffect] = useState("");
  const [showParams, setShowParams] = useState(false);

  const { generation, generate, isLoading, error, reset } = useForgeGenerate();
  const imageUpload = useForgeUpload();
  const audioUpload = useForgeUpload();

  const model = models.find((m) => m.id === selectedModelId);
  const inputs = model?.inputs;

  // Initialize defaults when model changes
  const handleModelChange = (id: string) => {
    setSelectedModelId(id);
    const m = models.find((m) => m.id === id);
    if (m?.inputs) {
      setAspectRatio(m.inputs.default_aspect_ratio || "");
      setResolution(m.inputs.default_resolution || "");
      setDuration(m.inputs.default_duration || 0);
      setQuality(m.inputs.default_quality || "");
      setEffect(m.inputs.default_effect || "");
    }
    imageUpload.clear();
    audioUpload.clear();
    reset();
  };

  // Set defaults on first render
  if (!aspectRatio && inputs?.default_aspect_ratio) {
    setAspectRatio(inputs.default_aspect_ratio);
  }
  if (!resolution && inputs?.default_resolution) {
    setResolution(inputs.default_resolution);
  }
  if (!duration && inputs?.default_duration) {
    setDuration(inputs.default_duration);
  }
  if (!quality && inputs?.default_quality) {
    setQuality(inputs.default_quality);
  }
  if (!effect && inputs?.default_effect) {
    setEffect(inputs.default_effect);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedModelId) return;

    await generate({
      model_id: selectedModelId,
      prompt: prompt || undefined,
      aspect_ratio: aspectRatio || undefined,
      resolution: resolution || undefined,
      duration: duration || undefined,
      quality: quality || undefined,
      effect: effect || undefined,
      image_url: imageUpload.uploadedUrl || undefined,
      audio_url: audioUpload.uploadedUrl || undefined,
    });
  };

  const handleSelectHistory = (gen: ForgeGeneration) => {
    // Could be expanded to show old generations
  };

  const providerId = model?.provider_id || "muapi";

  return (
    <ApiKeyGate providerId={providerId} providerName="Muapi">
      <div className="flex h-full">
        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-text-primary">{title}</h2>
              <ModelPicker models={models} selected={selectedModelId} onSelect={handleModelChange} />
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">
            <GenerationCanvas
              generation={generation}
              isLoading={isLoading}
              error={error}
              category={category}
            />

            {/* Uploads row */}
            {(inputs?.supports_image_upload || inputs?.supports_audio_upload) && (
              <div className="flex gap-3">
                {inputs.supports_image_upload && (
                  <UploadZone
                    accept="image"
                    onUpload={imageUpload.upload}
                    uploadedUrl={imageUpload.uploadedUrl}
                    onClear={imageUpload.clear}
                    uploading={imageUpload.uploading}
                    className="h-24 w-40"
                  />
                )}
                {inputs.supports_audio_upload && (
                  <UploadZone
                    accept="audio"
                    onUpload={audioUpload.upload}
                    uploadedUrl={audioUpload.uploadedUrl}
                    onClear={audioUpload.clear}
                    uploading={audioUpload.uploading}
                    className="h-24 w-40"
                  />
                )}
              </div>
            )}

            {/* Parameters panel */}
            {(inputs?.aspect_ratios || inputs?.resolutions || inputs?.durations || inputs?.qualities || inputs?.effects) && (
              <div className="rounded-lg border border-border bg-bg-3/50 overflow-hidden">
                <button
                  onClick={() => setShowParams(!showParams)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold hover:bg-bg-3 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 size={12} strokeWidth={1.5} />
                    Parâmetros
                  </span>
                  {showParams ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {showParams && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
                    {inputs.aspect_ratios && inputs.aspect_ratios.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-semibold">Aspect Ratio</p>
                        <AspectRatioPicker
                          options={inputs.aspect_ratios}
                          selected={aspectRatio}
                          onSelect={setAspectRatio}
                        />
                      </div>
                    )}

                    {inputs.resolutions && inputs.resolutions.length > 0 && (
                      <ParamSelector
                        label="Resolução"
                        options={inputs.resolutions}
                        selected={resolution}
                        onSelect={(v) => setResolution(String(v))}
                      />
                    )}

                    {inputs.durations && inputs.durations.length > 0 && (
                      <ParamSelector
                        label="Duração"
                        options={inputs.durations}
                        selected={duration}
                        onSelect={(v) => setDuration(Number(v))}
                      />
                    )}

                    {inputs.qualities && inputs.qualities.length > 0 && (
                      <ParamSelector
                        label="Qualidade"
                        options={inputs.qualities}
                        selected={quality}
                        onSelect={(v) => setQuality(String(v))}
                      />
                    )}

                    {inputs.effects && inputs.effects.length > 0 && (
                      <ParamSelector
                        label="Efeito"
                        options={inputs.effects}
                        selected={effect}
                        onSelect={(v) => setEffect(String(v))}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prompt bar */}
          <div className="border-t border-border px-5 py-3">
            <form onSubmit={handleSubmit} className="flex items-end gap-2.5">
              <div className="flex-1 relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    category === "lipsync"
                      ? "Descrição da cena (opcional)..."
                      : "Descreva o que você quer gerar..."
                  }
                  disabled={isLoading}
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = Math.min(target.scrollHeight, 120) + "px";
                  }}
                  className="w-full bg-bg-3 border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/10 transition-colors disabled:opacity-40 resize-none overflow-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || (!prompt.trim() && !imageUpload.uploadedUrl && !audioUpload.uploadedUrl)}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                  "bg-nova hover:bg-nova-hover disabled:opacity-30 disabled:cursor-not-allowed",
                  "shadow-[0_0_14px_rgba(255,138,31,0.30)] hover:shadow-[0_0_20px_rgba(255,138,31,0.45)]"
                )}
              >
                <ArrowUp size={16} strokeWidth={2} className="text-white" />
              </button>
            </form>
          </div>
        </div>

        {/* History sidebar */}
        <HistorySidebar
          category={category}
          onSelect={handleSelectHistory}
          activeId={generation?.id}
        />
      </div>
    </ApiKeyGate>
  );
}
