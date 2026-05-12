"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LayoutApp from "@/app/layout-app";
import BriefingForm from "@/components/offer-briefings/BriefingForm";
import { CreateOfferBriefingInput } from "@/types";

export default function NewBriefingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleCreate(input: CreateOfferBriefingInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/offer-briefings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Erro ao criar briefing");
      }
      router.push("/offer-briefings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar briefing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LayoutApp>
      <BriefingForm
        onSubmit={handleCreate}
        onCancel={() => router.push("/offer-briefings")}
        loading={loading}
        error={error}
      />
    </LayoutApp>
  );
}
