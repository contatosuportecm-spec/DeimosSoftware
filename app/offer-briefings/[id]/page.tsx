"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import LayoutApp from "@/app/layout-app";
import BriefingDetail from "@/components/offer-briefings/BriefingDetail";
import { OfferBriefing } from "@/types";

export default function BriefingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [briefing, setBriefing] = useState<OfferBriefing | null>(null);
  const [loading, setLoading]   = useState(true);

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

  async function handleDelete() {
    const res = await fetch(`/api/offer-briefings/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/offer-briefings");
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
      <BriefingDetail
        briefing={briefing}
        onBack={() => router.push("/offer-briefings")}
        onEdit={() => router.push(`/offer-briefings/${id}/edit`)}
        onDelete={handleDelete}
      />
    </LayoutApp>
  );
}
