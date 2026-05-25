"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface CreateFunnelModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string) => Promise<void>;
}

export default function CreateFunnelModal({ open, onClose, onCreate }: CreateFunnelModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onCreate(name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create funnel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Funnel">
      <div className="space-y-4">
        <Input
          label="Funnel Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Webinar Funnel"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-bg-3 border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1 focus:border-gold/40 focus:ring-gold/10 resize-none"
            placeholder="Optional description..."
          />
        </div>
        {error && (
          <p className="text-[11px] text-danger bg-danger/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          className="w-full"
        >
          {loading ? "Creating..." : "Create Funnel"}
        </Button>
      </div>
    </Modal>
  );
}
