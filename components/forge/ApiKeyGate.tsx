"use client";

import { useState } from "react";
import { useForgeKeys } from "@/hooks/useForgeKeys";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Key, Check, Loader2 } from "lucide-react";

interface ApiKeyGateProps {
  providerId: string;
  providerName: string;
  children: React.ReactNode;
}

export default function ApiKeyGate({ providerId, providerName, children }: ApiKeyGateProps) {
  const { hasKey, saveKey, loading } = useForgeKeys();
  const [showModal, setShowModal] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (!hasKey(providerId)) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
          <div className="w-14 h-14 rounded-2xl bg-nova/10 border border-nova/20 flex items-center justify-center">
            <Key size={24} strokeWidth={1.5} className="text-nova" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-medium text-text-primary">API Key necessária</p>
            <p className="text-xs text-text-muted max-w-xs">
              Configure sua chave do <span className="text-text-secondary">{providerName}</span> para começar a gerar conteúdo.
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} size="md">
            Configurar API Key
          </Button>
        </div>

        <Modal open={showModal} onClose={() => setShowModal(false)} title={`API Key — ${providerName}`}>
          <div className="space-y-4">
            <p className="text-xs text-text-muted leading-relaxed">
              Insira sua API key do {providerName}. A chave será salva de forma segura e usada para todas as gerações.
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Sua API key..."
              className="w-full bg-bg-2 border border-border rounded-md px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/10 transition-colors font-mono"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={!keyInput.trim() || saving}
                onClick={async () => {
                  setSaving(true);
                  await saveKey(providerId, keyInput.trim());
                  setSaving(false);
                  setShowModal(false);
                  setKeyInput("");
                }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Salvar
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return <>{children}</>;
}
