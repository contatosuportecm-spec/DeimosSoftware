"use client";

import { useState, useEffect, FormEvent, useRef, ClipboardEvent } from "react";
import { ForgeModel, ForgeGeneration, ForgeCategory } from "@/types/forge";
import { useForgeGenerate } from "@/hooks/useForgeGenerate";
import { useForgeUpload } from "@/hooks/useForgeUpload";
import ModelPicker from "./ModelPicker";
import AspectRatioPicker from "./AspectRatioPicker";
import ParamSelector from "./ParamSelector";
import EffectPicker from "./EffectPicker";
import GenerationCanvas from "./GenerationCanvas";
import HistoryStrip from "./HistoryStrip";
import UploadZone from "./UploadZone";
import ApiKeyGate from "./ApiKeyGate";
import { Sparkles, Loader2, ArrowUp, ChevronLeft, Plus, X as XIcon } from "lucide-react";
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

  const { generation, generate, isLoading, error, reset } = useForgeGenerate();
  const imageUpload = useForgeUpload();
  const audioUpload = useForgeUpload();
  const formRef = useRef<HTMLFormElement>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Refresh history when generation completes
  const prevStatus = useRef(generation?.status);
  useEffect(() => {
    if (prevStatus.current !== "completed" && generation?.status === "completed") {
      setHistoryRefreshKey((k) => k + 1);
    }
    prevStatus.current = generation?.status;
  }, [generation?.status]);

  const model = models.find((m) => m.id === selectedModelId);
  const inputs = model?.inputs;

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

  // Defaults na primeira renderização
  if (!aspectRatio && inputs?.default_aspect_ratio) setAspectRatio(inputs.default_aspect_ratio);
  if (!resolution && inputs?.default_resolution) setResolution(inputs.default_resolution);
  if (!duration && inputs?.default_duration) setDuration(inputs.default_duration);
  if (!quality && inputs?.default_quality) setQuality(inputs.default_quality);
  if (!effect && inputs?.default_effect) setEffect(inputs.default_effect);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedModelId) return;

    const multiImage = inputs?.multi_image && imageUpload.uploadedUrls.length > 0;
    await generate({
      model_id: selectedModelId,
      prompt: prompt || undefined,
      aspect_ratio: aspectRatio || undefined,
      resolution: resolution || undefined,
      duration: duration || undefined,
      quality: quality || undefined,
      effect: effect || undefined,
      image_url: !multiImage ? (imageUpload.uploadedUrl || undefined) : undefined,
      image_urls: multiImage ? imageUpload.uploadedUrls : undefined,
      audio_url: audioUpload.uploadedUrl || undefined,
    });
  };

  const handleSelectHistory = (gen: ForgeGeneration) => {
    // TODO: hidratar canvas com a generation selecionada
  };

  const handleUseAsReference = (url: string) => {
    if (inputs?.supports_image_upload) {
      imageUpload.setUrl(url);
    }
  };

  const supportsImageRef = !!inputs?.supports_image_upload;

  const triggerSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const providerId = model?.provider_id || "muapi";

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!inputs?.supports_image_upload) return;

    // Check DataTransferItemList (Chrome/Edge)
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) imageUpload.upload(file, providerId);
          return;
        }
      }
    }

    // Fallback: check files (Firefox/Safari)
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) {
          e.preventDefault();
          imageUpload.upload(file, providerId);
          return;
        }
      }
    }
  };

  const promptOk = !inputs?.prompt_required || prompt.trim().length > 0;
  const imageOk = !inputs?.image_required || !!imageUpload.uploadedUrl || imageUpload.uploadedUrls.length > 0;
  const audioOk = !inputs?.audio_required || !!audioUpload.uploadedUrl;
  const canSubmit = !isLoading && !imageUpload.uploading && !audioUpload.uploading && !!selectedModelId && promptOk && imageOk && audioOk;

  const missing: string[] = [];
  if (!promptOk) missing.push("Prompt");
  if (!imageOk) missing.push("Imagem");
  if (!audioOk) missing.push("Áudio");
  if (imageUpload.uploading) missing.push("Upload em andamento...");
  if (audioUpload.uploading) missing.push("Upload em andamento...");

  // Quando há imagem e a variante omite certos campos, esconde-os da UI.
  const omittedParams = new Set(
    imageUpload.uploadedUrl && model?.endpoint_with_image?.omit_when_image
      ? model.endpoint_with_image.omit_when_image
      : [],
  );

  const promptCount = prompt.length;
  const promptMax = 2000;

  return (
    <ApiKeyGate providerId={providerId} providerName="Muapi">
      <div className="flex flex-col h-full">
        {/* TOPBAR */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <a
              href="/forge"
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-border hover:border-border-strong hover:bg-bg-3 text-text-muted hover:text-text-primary transition-colors"
              title="Voltar ao AI Studio"
            >
              <ChevronLeft size={14} strokeWidth={1.5} />
            </a>
            <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-text-primary">
              {title}
            </h2>
            <ModelPicker models={models} selected={selectedModelId} onSelect={handleModelChange} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerSubmit}
              disabled={!canSubmit}
              title={missing.length > 0 ? `Faltando: ${missing.join(", ")}` : undefined}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-[0.12em] transition-all",
                "bg-gold text-black hover:bg-gold-hover disabled:opacity-30 disabled:cursor-not-allowed",
                canSubmit && "shadow-[0_0_18px_rgba(244,196,48,0.30)] hover:shadow-[0_0_24px_rgba(244,196,48,0.45)]",
              )}
            >
              {isLoading ? (
                <Loader2 size={13} strokeWidth={2} className="animate-spin" />
              ) : (
                <Sparkles size={13} strokeWidth={2} />
              )}
              Gerar
            </button>
          </div>
        </div>

        {/* CORPO: 2 colunas */}
        <div className="flex-1 flex min-h-0">
          {/* COLUNA ESQUERDA — Prompt + Configurações */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="w-[340px] flex-shrink-0 border-r border-border overflow-y-auto px-5 py-5 space-y-5"
          >
            {/* PROMPT */}
            {inputs?.has_prompt && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold">
                    Prompt
                    {inputs?.prompt_required && <span className="text-ember ml-1">*</span>}
                    {!inputs?.prompt_required && (
                      <span className="text-text-muted/50 ml-1.5 normal-case tracking-normal text-[9px]">opcional</span>
                    )}
                  </span>
                  <span className="text-[9px] font-mono text-text-muted/60">
                    {promptCount} / {promptMax}
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, promptMax))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (canSubmit) triggerSubmit();
                      }
                    }}
                    onPaste={handlePaste}
                    placeholder={
                      category === "lipsync"
                        ? "Descrição da cena (opcional)..."
                        : inputs?.supports_image_upload
                        ? "Descreva com detalhes... (Ctrl+V para colar imagem)"
                        : "Descreva sua imagem com o máximo de detalhes..."
                    }
                    disabled={isLoading}
                    rows={6}
                    className="w-full bg-bg-3 border border-border rounded-lg px-3.5 py-3 pr-10 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/15 transition-colors disabled:opacity-40 resize-none"
                  />
                  <button
                    type="button"
                    onClick={triggerSubmit}
                    disabled={!canSubmit}
                    className={cn(
                      "absolute bottom-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                      canSubmit
                        ? "bg-gold text-black hover:bg-gold-hover shadow-[0_0_10px_rgba(244,196,48,0.25)]"
                        : "bg-bg-4 text-text-muted/30 cursor-not-allowed",
                    )}
                    title="Gerar (Enter)"
                  >
                    {isLoading ? (
                      <Loader2 size={12} strokeWidth={2} className="animate-spin" />
                    ) : (
                      <ArrowUp size={13} strokeWidth={2} />
                    )}
                  </button>
                </div>
              </section>
            )}

            {/* UPLOADS */}
            {(inputs?.supports_image_upload || inputs?.supports_audio_upload) && (
              <section className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold">
                    Entradas
                  </span>
                  {model?.endpoint_with_image && imageUpload.uploadedUrl && (
                    <span className="text-[9px] text-gold font-mono">
                      → {category === "image" ? "Edição" : "Image-to-Video"}
                    </span>
                  )}
                  {model?.endpoint_with_image && !imageUpload.uploadedUrl && (
                    <span className="text-[9px] text-text-muted/60">
                      Imagem opcional · ativa modo I2V
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {inputs?.supports_image_upload && inputs?.multi_image ? (
                    <MultiImageUpload
                      urls={imageUpload.uploadedUrls}
                      uploading={imageUpload.uploading}
                      onUpload={imageUpload.upload}
                      onRemove={imageUpload.removeUrl}
                      onClear={imageUpload.clear}
                      required={!!inputs?.image_required}
                    />
                  ) : inputs?.supports_image_upload ? (
                    <UploadZone
                      accept="image"
                      label={inputs?.image_required ? "Imagem*" : "Imagem"}
                      onUpload={imageUpload.upload}
                      uploadedUrl={imageUpload.uploadedUrl}
                      onClear={imageUpload.clear}
                      uploading={imageUpload.uploading}
                      className="h-24 flex-1"
                    />
                  ) : null}
                  {inputs?.supports_audio_upload && (
                    <UploadZone
                      accept="audio"
                      label={inputs?.audio_required ? "Áudio*" : "Áudio"}
                      onUpload={audioUpload.upload}
                      uploadedUrl={audioUpload.uploadedUrl}
                      onClear={audioUpload.clear}
                      uploading={audioUpload.uploading}
                      className="h-24 flex-1"
                    />
                  )}
                </div>
              </section>
            )}

            {/* CONFIGURAÇÕES */}
            {(inputs?.aspect_ratios || inputs?.resolutions || inputs?.durations || inputs?.qualities || inputs?.effects) && (
              <section className="space-y-4">
                <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold block">
                  Configurações
                </span>

                {inputs?.aspect_ratios && inputs.aspect_ratios.length > 0 && !omittedParams.has("aspect_ratio") && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted/80 font-semibold">
                      Aspect Ratio
                    </p>
                    <AspectRatioPicker
                      options={inputs.aspect_ratios}
                      selected={aspectRatio}
                      onSelect={setAspectRatio}
                    />
                  </div>
                )}

                {inputs?.resolutions && inputs.resolutions.length > 0 && !omittedParams.has("resolution") && (
                  <ParamSelector
                    label="Resolução"
                    options={inputs.resolutions}
                    selected={resolution}
                    onSelect={(v) => setResolution(String(v))}
                  />
                )}

                {inputs?.durations && inputs.durations.length > 0 && !omittedParams.has("duration") && (
                  <ParamSelector
                    label="Duração"
                    options={inputs.durations}
                    selected={duration}
                    onSelect={(v) => setDuration(Number(v))}
                  />
                )}

                {inputs?.qualities && inputs.qualities.length > 0 && !omittedParams.has("quality") && (
                  <ParamSelector
                    label="Qualidade"
                    options={inputs.qualities}
                    selected={quality}
                    onSelect={(v) => setQuality(String(v))}
                  />
                )}

                {inputs?.effects && inputs.effects.length > 0 && !omittedParams.has("effect") && (
                  <EffectPicker
                    options={inputs.effects}
                    selected={effect}
                    onSelect={setEffect}
                  />
                )}
              </section>
            )}

            {/* submit invisível pra Enter funcionar no textarea */}
            <button type="submit" className="hidden" />
          </form>

          {/* COLUNA DIREITA — Canvas + Histórico */}
          <div className="flex-1 min-w-0 flex flex-col px-6 py-5 gap-4 overflow-hidden">
            <div className="flex-1 flex min-h-0">
              <GenerationCanvas
                generation={generation}
                isLoading={isLoading}
                error={error}
                category={category}
                supportsImageRef={supportsImageRef}
                onUseAsReference={handleUseAsReference}
              />
            </div>

            <HistoryStrip
              category={category}
              onSelect={handleSelectHistory}
              activeId={generation?.id}
              supportsImageRef={supportsImageRef}
              onUseAsReference={handleUseAsReference}
              refreshKey={historyRefreshKey}
            />

            {/* Imagens geradas — disponível em studios de vídeo/lipsync que aceitam imagem */}
            {category !== "image" && supportsImageRef && (
              <HistoryStrip
                category="image"
                onSelect={handleSelectHistory}
                label="Suas Imagens"
                supportsImageRef
                onUseAsReference={handleUseAsReference}
              />
            )}
          </div>
        </div>
      </div>
    </ApiKeyGate>
  );
}

/* ── Multi-image upload grid ── */
function MultiImageUpload({
  urls,
  uploading,
  onUpload,
  onRemove,
  onClear,
  required,
}: {
  urls: string[];
  uploading: boolean;
  onUpload: (file: File) => Promise<string | null>;
  onRemove: (url: string) => void;
  onClear: () => void;
  required: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      if (f.type.startsWith("image/")) onUpload(f);
    });
  };

  return (
    <div className="flex-1 space-y-2">
      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-bg-3 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(url)}
              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <XIcon size={8} strokeWidth={2} className="text-white" />
            </button>
          </div>
        ))}

        {/* Add button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors",
            uploading
              ? "border-border bg-bg-3/50"
              : "border-border hover:border-gold/30 hover:bg-bg-3/50 cursor-pointer",
          )}
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin text-text-muted" />
          ) : (
            <Plus size={16} strokeWidth={1.5} className="text-text-muted/60" />
          )}
        </button>
      </div>

      {urls.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="text-[9px] text-text-muted/50 hover:text-text-muted transition-colors"
        >
          Limpar todas
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
