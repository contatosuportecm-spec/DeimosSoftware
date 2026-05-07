"use client";

import { useState } from "react";
import LayoutApp from "@/app/layout-app";
import { useForgeKeys } from "@/hooks/useForgeKeys";
import Button from "@/components/ui/Button";
import { Key, Trash2, Check, Loader2, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

const PROVIDERS = [
  {
    id: "muapi",
    name: "Muapi",
    description: "Gateway para 200+ modelos de IA. Nano Banana, Seedance, Veo, Kling, LipSync e mais.",
    url: "https://muapi.ai",
  },
];

export default function ForgeSettingsPage() {
  const { keys, loading, saveKey, deleteKey } = useForgeKeys();
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (providerId: string) => {
    if (!keyInput.trim()) return;
    setSaving(true);
    await saveKey(providerId, keyInput.trim());
    setSaving(false);
    setEditingProvider(null);
    setKeyInput("");
  };

  return (
    <LayoutApp>
      <div className="p-6 max-w-2xl space-y-6">
        {/* Back */}
        <Link
          href="/forge"
          className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
        >
          <ArrowLeft size={12} />
          Voltar ao Forge
        </Link>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Key size={14} strokeWidth={1.5} className="text-gold" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Configuração</p>
          </div>
          <h1 className="text-lg font-medium text-text-primary">API Keys</h1>
          <p className="text-xs text-text-muted mt-1">
            Configure suas chaves de API para cada provider. As chaves ficam salvas no seu banco de dados.
          </p>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-gold/15 bg-gold/5">
          <Shield size={14} className="text-gold mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Suas API keys são armazenadas no Supabase e usadas apenas server-side. Nunca são expostas no frontend.
          </p>
        </div>

        {/* Providers list */}
        <div className="space-y-3">
          {PROVIDERS.map((provider) => {
            const existingKey = keys.find((k) => k.provider_id === provider.id);
            const isEditing = editingProvider === provider.id;

            return (
              <div key={provider.id} className="rounded-lg border border-border bg-bg-3 overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-bg-4 flex items-center justify-center border border-border">
                      <Key size={14} strokeWidth={1.5} className="text-text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{provider.name}</p>
                      <p className="text-[10px] text-text-muted">{provider.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {existingKey && !isEditing && (
                      <>
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-success/10 text-[10px] text-success font-medium">
                          <Check size={10} />
                          Configurada
                        </span>
                        <button
                          onClick={() => deleteKey(provider.id)}
                          className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                    {!isEditing && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingProvider(provider.id);
                          setKeyInput("");
                        }}
                      >
                        {existingKey ? "Alterar" : "Adicionar"}
                      </Button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="px-5 pb-4 pt-0 space-y-3 border-t border-border mt-0 pt-3">
                    <input
                      type="password"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="Cole sua API key aqui..."
                      className="w-full bg-bg-2 border border-border rounded-md px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/10 transition-colors font-mono"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave(provider.id);
                        if (e.key === "Escape") setEditingProvider(null);
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingProvider(null)}>
                        Cancelar
                      </Button>
                      <Button size="sm" disabled={!keyInput.trim() || saving} onClick={() => handleSave(provider.id)}>
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Salvar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </LayoutApp>
  );
}
