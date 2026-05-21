"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LayoutApp from "@/app/layout-app";
import FunnelFlow from "@/components/funnels/FunnelFlow";
import { useFunnelDetail } from "@/hooks/useFunnels";
import { ArrowLeft, Pencil, Check } from "lucide-react";
import type { FunnelStage, FunnelConnection } from "@/types/funnels";

export default function FunnelEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { funnel, loading, save } = useFunnelDetail(id);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout>();

  const handleSave = useCallback(
    (patch: { stages?: FunnelStage[]; connections?: FunnelConnection[] }) => {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await save(patch);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }, 600);
    },
    [save]
  );

  const handleNameSave = useCallback(async () => {
    if (nameValue.trim()) {
      await save({ name: nameValue.trim() });
    }
    setEditingName(false);
  }, [nameValue, save]);

  if (loading) {
    return (
      <LayoutApp>
        <div className="h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-nova/30 border-t-nova rounded-full animate-spin" />
        </div>
      </LayoutApp>
    );
  }

  if (!funnel) {
    return (
      <LayoutApp>
        <div className="h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-text-muted">Funnel not found</p>
          <button
            onClick={() => router.push("/funnels")}
            className="text-sm text-gold hover:text-gold-hover transition-colors"
          >
            Back to Funnels
          </button>
        </div>
      </LayoutApp>
    );
  }

  return (
    <LayoutApp>
      <div className="min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-bg-1/60 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/funnels")}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
            </button>

            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="bg-transparent border-b border-gold/40 px-1 py-0.5 text-sm text-text-primary outline-none"
                />
                <button
                  onClick={handleNameSave}
                  className="p-1 rounded text-gold hover:bg-gold/10 transition-colors"
                >
                  <Check size={14} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setNameValue(funnel.name); setEditingName(true); }}
                className="group flex items-center gap-1.5 hover:bg-white/[0.04] rounded-lg px-2 py-1 transition-colors"
              >
                <h1 className="text-sm font-semibold text-text-primary">
                  {funnel.name}
                </h1>
                <Pencil
                  size={11}
                  strokeWidth={1.5}
                  className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-[10px] text-emerald-400 font-medium animate-[fadeIn_200ms_ease-out]">
                Saved
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
              <span className="text-[10px] text-text-muted">Auto-save</span>
            </div>
          </div>
        </div>

        {/* Flow */}
        <div className="flex-1 overflow-y-auto">
          <FunnelFlow funnel={funnel} onSave={handleSave} />
        </div>
      </div>
    </LayoutApp>
  );
}
