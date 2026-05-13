"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LayoutApp from "@/app/layout-app";
import Card from "@/components/ui/Card";
import { WikiPage } from "@/types";
import { ArrowLeft, Pencil } from "lucide-react";
import WikiPageEditor from "@/components/knowledge/WikiPageEditor";

export default function LibraryPageDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [page, setPage] = useState<WikiPage | null>(null);
  const [related, setRelated] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch(`/api/wiki/pages/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) return;
        setPage(data);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!page?.links_to?.length) return;
    Promise.all(
      page.links_to.map((s) =>
        fetch(`/api/wiki/pages/${s}`).then((r) => r.ok ? r.json() : null),
      ),
    ).then((results) => {
      setRelated(results.filter((r): r is WikiPage => r && !r.error));
    });
  }, [page]);

  if (loading) {
    return (
      <LayoutApp>
        <div className="max-w-4xl mx-auto px-6 py-10 text-xs text-text-muted">Carregando...</div>
      </LayoutApp>
    );
  }

  if (!page) {
    return (
      <LayoutApp>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link href="/library" className="text-xs text-text-muted hover:text-gold flex items-center gap-1.5 mb-4">
            <ArrowLeft size={12} strokeWidth={1.5} /> Biblioteca
          </Link>
          <Card padding="lg">
            <p className="text-sm text-text-secondary">Página não encontrada.</p>
          </Card>
        </div>
      </LayoutApp>
    );
  }

  return (
    <LayoutApp>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/library"
            className="text-xs text-text-muted hover:text-gold flex items-center gap-1.5"
          >
            <ArrowLeft size={12} strokeWidth={1.5} /> Biblioteca
          </Link>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-text-muted hover:text-gold flex items-center gap-1.5"
          >
            <Pencil size={12} strokeWidth={1.5} /> Editar
          </button>
        </div>

        {editing && (
          <WikiPageEditor
            page={page}
            onClose={() => setEditing(false)}
            onSaved={(updated) => setPage(updated)}
            onDeleted={() => router.push("/library")}
          />
        )}

        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">
            {page.kind}
          </p>
          <h1 className="text-2xl font-display text-text-primary mb-2">{page.title}</h1>
          <p className="text-sm text-text-secondary leading-relaxed">{page.summary}</p>
        </div>

        {/* meta */}
        <Card padding="md" className="mb-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
            <Meta label="Confiança" value={`${(page.confidence * 100).toFixed(0)}%`} />
            <Meta label="Usada" value={`${page.usage_count}×`} />
            <Meta label="Nichos" value={page.niches.join(", ") || "—"} />
            <Meta label="Tags" value={page.tags.join(", ") || "—"} />
          </div>
        </Card>

        {/* body markdown — renderiza como texto preservando whitespace */}
        <Card padding="lg" className="mb-5">
          <div className="prose-deimos text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {page.body_md}
          </div>
        </Card>

        {/* related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-3">
              Páginas relacionadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {related.map((r) => (
                <Link key={r.id} href={`/library/${r.slug}`}>
                  <Card padding="sm" className="hover:border-gold/30 cursor-pointer">
                    <p className="text-[9px] uppercase tracking-wider text-text-muted mb-1">{r.kind}</p>
                    <p className="text-xs text-text-primary font-medium">{r.title}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </LayoutApp>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-text-secondary">{value}</p>
    </div>
  );
}
