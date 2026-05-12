"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import LayoutApp from "@/app/layout-app";
import BriefingForm from "@/components/offer-briefings/BriefingForm";
import { OfferBriefing, CreateOfferBriefingInput } from "@/types";

export default function EditBriefingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [briefing, setBriefing] = useState<OfferBriefing | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/offer-briefings/${id}`);
        if (!res.ok) throw new Error();
        setBriefing(await res.json());
      } catch {
        router.push("/offer-briefings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  async function handleUpdate(input: CreateOfferBriefingInput) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/offer-briefings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Erro ao atualizar");
      }
      router.push(`/offer-briefings/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <LayoutApp>
        <div className="flex items-center justify-center h-full">
          <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </LayoutApp>
    );
  }

  if (!briefing) return null;

  return (
    <LayoutApp>
      <BriefingForm
        initialData={briefing}
        onSubmit={handleUpdate}
        onCancel={() => router.push(`/offer-briefings/${id}`)}
        loading={saving}
        error={error}
      />
    </LayoutApp>
  );
}
