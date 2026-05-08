"use client";

import LayoutApp from "@/app/layout-app";
import StudioShell from "@/components/forge/StudioShell";
import { getForgeModelsByCategory } from "@/lib/forge/models";

const IMAGE_MODELS = getForgeModelsByCategory("image");

export default function ImageStudioPage() {
  return (
    <LayoutApp>
      <div className="h-[100dvh]">
        <StudioShell
          category="image"
          models={IMAGE_MODELS}
          title="Image Studio"
        />
      </div>
    </LayoutApp>
  );
}
