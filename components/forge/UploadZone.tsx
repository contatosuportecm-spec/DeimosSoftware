"use client";

import { useState, useRef, DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, Music, Video, Loader2 } from "lucide-react";

interface UploadZoneProps {
  accept: "image" | "audio" | "video";
  onUpload: (file: File) => Promise<string | null>;
  uploadedUrl: string | null;
  onClear: () => void;
  uploading?: boolean;
  className?: string;
  label?: string;
}

const ACCEPT_MAP = { image: "image/*", audio: "audio/*", video: "video/*" };
const ICON_MAP = { image: ImageIcon, audio: Music, video: Video };

export default function UploadZone({ accept, onUpload, uploadedUrl, onClear, uploading, className, label }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptStr = ACCEPT_MAP[accept];
  const Icon = ICON_MAP[accept];
  const headerLabel = label || (accept === "image" ? "Imagem" : "Áudio");
  const isRequired = headerLabel.endsWith("*");
  const cleanLabel = isRequired ? headerLabel.slice(0, -1) : headerLabel;

  const handleFile = (file: File) => {
    onUpload(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (uploadedUrl) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden border border-border bg-bg-3", className)}>
        {accept === "image" ? (
          <img src={uploadedUrl} alt="Upload" className="w-full h-full object-cover" />
        ) : accept === "video" ? (
          <video src={uploadedUrl} muted playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full gap-2 px-3">
            <Music size={16} className="text-gold" />
            <span className="text-xs text-text-secondary truncate">Áudio carregado</span>
          </div>
        )}
        <button
          onClick={onClear}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-black transition-colors"
        >
          <X size={12} className="text-white" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
        dragOver ? "border-gold/50 bg-gold/5" : "border-border hover:border-border-strong hover:bg-bg-3/50",
        className
      )}
    >
      {uploading ? (
        <Loader2 size={20} className="animate-spin text-text-muted" />
      ) : (
        <>
          <div className="w-8 h-8 rounded-lg bg-bg-3 flex items-center justify-center">
            <Icon size={14} strokeWidth={1.5} className="text-text-muted" />
          </div>
          <p className="text-[10px] text-text-secondary font-medium">
            {cleanLabel}
            {isRequired && <span className="text-ember ml-0.5">*</span>}
          </p>
          <p className="text-[9px] text-text-muted/60">Arraste ou clique</p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptStr}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
