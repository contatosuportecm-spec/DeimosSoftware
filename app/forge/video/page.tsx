"use client";

import LayoutApp from "@/app/layout-app";
import StudioShell from "@/components/forge/StudioShell";
import { getForgeModelsByCategory } from "@/lib/forge/models";

const VIDEO_MODELS = getForgeModelsByCategory("video");

export default function VideoStudioPage() {
  return (
    <LayoutApp>
      <div className="h-[100dvh]">
        <StudioShell
          category="video"
          models={VIDEO_MODELS}
          title="Video Studio"
        />
      </div>
    </LayoutApp>
  );
}
