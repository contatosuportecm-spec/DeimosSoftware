"use client";

import LayoutApp from "@/app/layout-app";
import StudioShell from "@/components/forge/StudioShell";
import { getForgeModelsByCategory } from "@/lib/forge/models";

const LIPSYNC_MODELS = getForgeModelsByCategory("lipsync");

export default function LipSyncStudioPage() {
  return (
    <LayoutApp>
      <div className="h-[100dvh]">
        <StudioShell
          category="lipsync"
          models={LIPSYNC_MODELS}
          title="LipSync Studio"
        />
      </div>
    </LayoutApp>
  );
}
