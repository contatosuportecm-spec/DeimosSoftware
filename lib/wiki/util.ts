import { createHash } from "crypto";
import { slugify } from "@/lib/utils";

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** Slug determinístico: kind + título — evita colisão entre kinds */
export function wikiSlug(kind: string, title: string): string {
  return `${kind}--${slugify(title).slice(0, 60)}`;
}

/** Extrai JSON entre ```json ... ``` ou bloco {} solto */
export function extractJson<T>(text: string): T | null {
  // bloco markdown ```json
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    try { return JSON.parse(fenced[1]) as T; } catch { /* fall */ }
  }
  // primeiro { ... } com balanceamento
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(start, i + 1)) as T; } catch { return null; }
      }
    }
  }
  return null;
}

export function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + "…";
}
