"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { CreateProductInput, ProductFormat, ProductPlatform } from "@/types";
import { cn } from "@/lib/utils";

interface CreateProductModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateProductInput) => Promise<void>;
}

const FORMATS: { value: ProductFormat; label: string }[] = [
  { value: "ebook",   label: "E-book" },
  { value: "webapp",  label: "WebApp" },
  { value: "curso",   label: "Curso" },
  { value: "servico", label: "Serviço" },
];

const PLATFORMS: { value: ProductPlatform; label: string }[] = [
  { value: "perfectpay", label: "PerfectPay" },
  { value: "kirvano",    label: "Kirvano" },
];

export default function CreateProductModal({ open, onClose, onCreate }: CreateProductModalProps) {
  const [name, setName]                     = useState("");
  const [description, setDescription]       = useState("");
  const [format, setFormat]                 = useState<ProductFormat>("ebook");
  const [category, setCategory]             = useState("");
  const [price, setPrice]                   = useState("");
  const [installmentPrice, setInstallmentPrice] = useState("");
  const [maxInstallments, setMaxInstallments]   = useState("");
  const [guaranteeDays, setGuaranteeDays]       = useState("7");
  const [imageUrl, setImageUrl]             = useState("");
  const [pixelId, setPixelId]               = useState("");
  const [platform, setPlatform]             = useState<ProductPlatform>("perfectpay");
  const [bumpName, setBumpName]             = useState("");
  const [bumpPrice, setBumpPrice]           = useState("");
  const [upsellName, setUpsellName]         = useState("");
  const [upsellPrice, setUpsellPrice]       = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function reset() {
    setName(""); setDescription(""); setFormat("ebook"); setCategory("");
    setPrice(""); setInstallmentPrice(""); setMaxInstallments("");
    setGuaranteeDays("7"); setImageUrl(""); setPixelId("");
    setPlatform("perfectpay"); setBumpName(""); setBumpPrice("");
    setUpsellName(""); setUpsellPrice("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedPrice = parseFloat(price);
    if (!name.trim() || isNaN(parsedPrice) || parsedPrice <= 0) return;

    setLoading(true);
    setError(null);

    try {
      const input: CreateProductInput = {
        name: name.trim(),
        format,
        platform,
        price: parsedPrice,
        ...(description.trim() && { description: description.trim() }),
        ...(category.trim() && { category: category.trim() }),
        ...(installmentPrice && { installment_price: parseFloat(installmentPrice) }),
        ...(maxInstallments && { max_installments: parseInt(maxInstallments) }),
        ...(guaranteeDays && { guarantee_days: parseInt(guaranteeDays) }),
        ...(imageUrl.trim() && { image_url: imageUrl.trim() }),
        ...(pixelId.trim() && { pixel_id: pixelId.trim() }),
        ...(bumpName.trim() && { bump_name: bumpName.trim() }),
        ...(bumpPrice && { bump_price: parseFloat(bumpPrice) }),
        ...(upsellName.trim() && { upsell_name: upsellName.trim() }),
        ...(upsellPrice && { upsell_price: parseFloat(upsellPrice) }),
      };

      await onCreate(input);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar produto");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = name.trim() && price && !isNaN(parseFloat(price)) && parseFloat(price) > 0;

  return (
    <Modal open={open} onClose={onClose} title="Novo Produto" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

        {/* ── Básico ── */}
        <SectionLabel>Dados do Produto</SectionLabel>

        <Input
          label="Nome do produto"
          placeholder="Ex: Guia Definitivo de Emagrecimento"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium">
            Descrição
          </label>
          <textarea
            placeholder="Descrição curta do produto..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={2}
            className="w-full bg-bg-3 border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1 focus:border-gold/40 focus:ring-gold/10 resize-none"
          />
        </div>

        {/* Formato */}
        <ButtonGroup
          label="Formato"
          options={FORMATS}
          value={format}
          onChange={(v) => setFormat(v as ProductFormat)}
          disabled={loading}
        />

        <Input
          label="Categoria"
          placeholder="Ex: saúde, finanças"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
        />

        {/* ── Preço ── */}
        <SectionLabel>Preço</SectionLabel>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Preço (R$)"
            placeholder="97.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={loading}
            required
            type="number"
            id="price"
          />
          <Input
            label="Preço parcelado"
            placeholder="12.90"
            value={installmentPrice}
            onChange={(e) => setInstallmentPrice(e.target.value)}
            disabled={loading}
            type="number"
            id="installmentPrice"
          />
          <Input
            label="Máx. parcelas"
            placeholder="12"
            value={maxInstallments}
            onChange={(e) => setMaxInstallments(e.target.value)}
            disabled={loading}
            type="number"
            id="maxInstallments"
          />
        </div>

        {/* ── Configurações ── */}
        <SectionLabel>Configurações</SectionLabel>

        <ButtonGroup
          label="Plataforma"
          options={PLATFORMS}
          value={platform}
          onChange={(v) => setPlatform(v as ProductPlatform)}
          disabled={loading}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Garantia (dias)"
            placeholder="7"
            value={guaranteeDays}
            onChange={(e) => setGuaranteeDays(e.target.value)}
            disabled={loading}
            type="number"
            id="guaranteeDays"
          />
          <Input
            label="Pixel ID (Facebook)"
            placeholder="123456789"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            disabled={loading}
            id="pixelId"
          />
        </div>

        <Input
          label="URL da imagem"
          placeholder="https://..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={loading}
          id="imageUrl"
        />

        {/* ── Extras ── */}
        <SectionLabel>Order Bump (opcional)</SectionLabel>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nome do bump"
            placeholder="Bônus Premium"
            value={bumpName}
            onChange={(e) => setBumpName(e.target.value)}
            disabled={loading}
            id="bumpName"
          />
          <Input
            label="Preço (R$)"
            placeholder="27.00"
            value={bumpPrice}
            onChange={(e) => setBumpPrice(e.target.value)}
            disabled={loading}
            type="number"
            id="bumpPrice"
          />
        </div>

        <SectionLabel>Upsell (opcional)</SectionLabel>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nome do upsell"
            placeholder="Pacote Completo"
            value={upsellName}
            onChange={(e) => setUpsellName(e.target.value)}
            disabled={loading}
            id="upsellName"
          />
          <Input
            label="Preço (R$)"
            placeholder="197.00"
            value={upsellPrice}
            onChange={(e) => setUpsellPrice(e.target.value)}
            disabled={loading}
            type="number"
            id="upsellPrice"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading || !canSubmit}>
            {loading ? "Criando..." : "Criar Produto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted/60 pt-1">
      {children}
    </p>
  );
}

function ButtonGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium">
        {label}
      </span>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-all",
              value === opt.value
                ? "border-gold/40 bg-gold-muted text-gold"
                : "border-border bg-bg-4 text-text-secondary hover:border-border-strong"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
