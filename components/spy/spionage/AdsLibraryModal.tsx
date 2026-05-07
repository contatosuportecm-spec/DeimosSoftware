"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Globe, Search, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { NicheKeywordGroup } from "@/hooks/useNicheKeywords";
import { buildAdsLibraryUrl } from "@/lib/spy-utils";
import { Country } from "@/types";
import { cn } from "@/lib/utils";

interface AdsLibraryModalProps {
  open: boolean;
  onClose: () => void;
  groups: NicheKeywordGroup[];
  loading: boolean;
}

const COUNTRY_OPTIONS: { value: Country; label: string; flag: string }[] = [
  { value: "BR",    label: "BR",    flag: "🇧🇷" },
  { value: "USA",   label: "USA",   flag: "🇺🇸" },
  { value: "Latam", label: "Latam", flag: "🌎" },
];

export default function AdsLibraryModal({ open, onClose, groups, loading }: AdsLibraryModalProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [country, setCountry]         = useState<Country>("BR");
  const [search, setSearch]           = useState("");

  // Reseta seleção quando fecha
  useEffect(() => {
    if (!open) {
      setSelectedKey(null);
      setSearch("");
    }
  }, [open]);

  const selectableGroups = useMemo(
    () => groups.filter((g) => g.keywords.length > 0),
    [groups],
  );

  const selected = useMemo(() => {
    if (!selectedKey) return null;
    return groups.find((g) => (g.niche?.id ?? "_general") === selectedKey) ?? null;
  }, [selectedKey, groups]);

  const filtered = useMemo(() => {
    if (!selected) return { pt: [], en: [], all: [] };
    const term = search.trim().toLowerCase();
    const list = term
      ? selected.keywords.filter((kw) => kw.keyword.toLowerCase().includes(term))
      : selected.keywords;
    return {
      pt:  list.filter((kw) => kw.language === "pt"),
      en:  list.filter((kw) => kw.language === "en"),
      all: list,
    };
  }, [selected, search]);

  const accent = selected?.niche?.color ?? "#F4C430";
  const emoji  = selected?.niche?.emoji ?? "✦";
  const label  = selected?.niche?.name ?? "gerais";

  return (
    <Modal open={open} onClose={onClose} title="Biblioteca de Anúncios" className="max-w-4xl">
      {/* Step 1 — Niche Picker */}
      {!selected && (
        <div>
          <p className="text-[11px] text-text-muted mb-5 leading-relaxed">
            Selecione o nicho para revelar as keywords curadas. Cada chip abre direto a Meta Ads
            Library com a busca exata, em PT-BR ou Inglês.
          </p>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl bg-bg-3 border border-border animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : selectableGroups.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              Nenhuma keyword cadastrada ainda.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectableGroups.map((g) => {
                const key   = g.niche?.id ?? "_general";
                const color = g.niche?.color ?? "#A1A1AA";
                const em    = g.niche?.emoji ?? "✦";
                const name  = g.niche?.name ?? "gerais";
                const ptCount = g.keywords.filter((kw) => kw.language === "pt").length;
                const enCount = g.keywords.filter((kw) => kw.language === "en").length;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    className="group flex flex-col items-center justify-center gap-3 px-4 py-5 rounded-xl border bg-bg-4/40 hover:scale-[1.02] transition-all duration-150 min-h-[140px]"
                    style={{
                      borderColor: `${color}33`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${color}66`;
                      e.currentTarget.style.backgroundColor = `${color}10`;
                      e.currentTarget.style.boxShadow = `0 0 18px ${color}22`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${color}33`;
                      e.currentTarget.style.backgroundColor = "";
                      e.currentTarget.style.boxShadow = "";
                    }}
                  >
                    <span className="text-[34px] leading-none">{em}</span>
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] capitalize text-center leading-tight"
                      style={{ color }}
                    >
                      {name}
                    </span>
                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.15em] text-text-muted font-mono">
                      {ptCount > 0 && <span>PT · {ptCount}</span>}
                      {ptCount > 0 && enCount > 0 && <span className="opacity-30">/</span>}
                      {enCount > 0 && <span>EN · {enCount}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Keywords View */}
      {selected && (
        <div>
          {/* Top bar: back + niche badge + country selector */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <button
              onClick={() => { setSelectedKey(null); setSearch(""); }}
              className="inline-flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={13} strokeWidth={1.5} />
              Voltar
            </button>

            <div className="w-px h-4 bg-border" />

            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border"
              style={{
                borderColor: `${accent}55`,
                backgroundColor: `${accent}14`,
              }}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.14em] capitalize"
                style={{ color: accent }}
              >
                {label}
              </span>
              <span className="font-mono text-[10px] text-text-muted bg-bg-4/60 px-1.5 py-px rounded">
                {selected.keywords.length}
              </span>
            </div>

            {/* Country selector */}
            <div className="ml-auto flex items-center gap-1 bg-bg-3/60 border border-border rounded-lg p-1">
              <Globe size={11} strokeWidth={1.5} className="text-text-muted ml-1.5" />
              {COUNTRY_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCountry(c.value)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium transition-all",
                    country === c.value
                      ? "bg-amber/15 text-amber"
                      : "text-text-muted hover:text-text-secondary",
                  )}
                  title={c.label}
                >
                  <span className="mr-1">{c.flag}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={12}
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar keywords..."
              className="w-full pl-9 pr-9 py-2 bg-bg-3/60 border border-border rounded-lg text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/40 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-4 transition-colors"
              >
                <X size={11} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Keywords */}
          <div className="max-h-[60vh] overflow-auto pr-1 space-y-5">
            {filtered.all.length === 0 ? (
              <div className="py-10 text-center text-xs text-text-muted">
                Nenhuma keyword bate com &ldquo;{search}&rdquo;.
              </div>
            ) : (
              <>
                {filtered.pt.length > 0 && (
                  <KeywordSection
                    title="Português · Brasil"
                    flag="🇧🇷"
                    keywords={filtered.pt.map((kw) => kw.keyword)}
                    accent={accent}
                    country={country}
                  />
                )}
                {filtered.en.length > 0 && (
                  <KeywordSection
                    title="Inglês · USA"
                    flag="🇺🇸"
                    keywords={filtered.en.map((kw) => kw.keyword)}
                    accent={accent}
                    country={country}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function KeywordSection({
  title,
  flag,
  keywords,
  accent,
  country,
}: {
  title: string;
  flag: string;
  keywords: string[];
  accent: string;
  country: Country;
}) {
  return (
    <section>
      <header className="flex items-center gap-2 mb-2.5">
        <span className="text-base leading-none">{flag}</span>
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-semibold">
          {title}
        </h3>
        <span className="font-mono text-[10px] text-text-muted bg-bg-4/60 px-1.5 py-px rounded">
          {keywords.length}
        </span>
        <span className="flex-1 h-px bg-border ml-2" />
      </header>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((kw) => (
          <a
            key={kw}
            href={buildAdsLibraryUrl(kw, country)}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] border border-border bg-bg-4/50 text-text-secondary transition-all hover:text-text-primary"
            style={{
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${accent}66`;
              e.currentTarget.style.backgroundColor = `${accent}14`;
              e.currentTarget.style.color = accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "";
              e.currentTarget.style.backgroundColor = "";
              e.currentTarget.style.color = "";
            }}
            title={`Abrir Meta Ads Library — "${kw}"`}
          >
            <span className="truncate max-w-[240px]">{kw}</span>
            <ExternalLink size={10} strokeWidth={1.5} className="opacity-40 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </section>
  );
}
