"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Country } from "@/types";
import { cn } from "@/lib/utils";

interface AddOfferModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, libraryUrl: string, country: Country) => Promise<void>;
}

const COUNTRIES: { value: Country; label: string; flag: string }[] = [
  { value: "BR",    label: "Brasil", flag: "🇧🇷" },
  { value: "USA",   label: "EUA",    flag: "🇺🇸" },
  { value: "Latam", label: "Latam",  flag: "🌎" },
];

export default function AddOfferModal({ open, onClose, onAdd }: AddOfferModalProps) {
  const [name, setName]           = useState("");
  const [libraryUrl, setLibraryUrl] = useState("");
  const [country, setCountry]     = useState<Country>("BR");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !libraryUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await onAdd(name.trim(), libraryUrl.trim(), country);
      // Reset e fecha
      setName("");
      setLibraryUrl("");
      setCountry("BR");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar oferta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Oferta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome da oferta"
          placeholder="Ex: Ômega 3 Ultra"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          required
        />

        <Input
          label="URL da Meta Ads Library"
          placeholder="https://www.facebook.com/ads/library/?...&view_all_page_id=..."
          value={libraryUrl}
          onChange={(e) => setLibraryUrl(e.target.value)}
          disabled={loading}
          required
        />

        {/* Seletor de país */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium">
            País
          </span>
          <div className="flex gap-2">
            {COUNTRIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCountry(c.value)}
                disabled={loading}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-all",
                  country === c.value
                    ? "border-gold/40 bg-gold-muted text-gold"
                    : "border-border bg-bg-4 text-text-secondary hover:border-border-strong"
                )}
              >
                <span>{c.flag}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading || !name.trim() || !libraryUrl.trim()}
          >
            {loading ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
