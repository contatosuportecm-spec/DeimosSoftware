/** Split text into overlapping chunks for RAG retrieval. */
export function chunkText(text: string, size = 1500, overlap = 300): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    chunks.push(text.slice(i, end));
    if (end >= text.length) break;
    i += size - overlap;
  }
  return chunks;
}

// Common Portuguese stop words to ignore in scoring
const STOP_WORDS = new Set([
  "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas",
  "um", "uma", "uns", "que", "se", "os", "as", "ao", "ou", "por",
  "com", "para", "ele", "ela", "nao", "mais", "mas", "isso", "este",
  "esta", "esse", "essa", "the", "and", "for", "are", "but", "not",
  "you", "all", "can", "was", "her", "his", "has", "had", "its",
]);

/** Normalize text for matching: lowercase, remove accents, strip punctuation. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract meaningful keywords from a query. Min 2 chars, no stop words. */
function extractKeywords(query: string): string[] {
  return normalize(query)
    .split(" ")
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

/** Score a chunk by keyword overlap with a query using word-boundary matching. */
export function scoreChunk(chunk: string, query: string): number {
  const keywords = extractKeywords(query);
  if (keywords.length === 0) return 0;

  const normalizedChunk = normalize(chunk);
  const chunkWordsArr = normalizedChunk.split(" ");
  const chunkWordsSet = new Set(chunkWordsArr);

  let score = 0;
  for (let ki = 0; ki < keywords.length; ki++) {
    const kw = keywords[ki];
    // Exact word match (highest value)
    if (chunkWordsSet.has(kw)) {
      score += 3;
      continue;
    }
    // Partial match — keyword is prefix of a word in chunk
    let partial = false;
    for (let wi = 0; wi < chunkWordsArr.length; wi++) {
      if (chunkWordsArr[wi].startsWith(kw) || kw.startsWith(chunkWordsArr[wi])) {
        score += 1;
        partial = true;
        break;
      }
    }
    // Substring match as last resort (low score)
    if (!partial && normalizedChunk.includes(kw)) {
      score += 0.5;
    }
  }

  // Bonus: consecutive keyword matches indicate a highly relevant section
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length > 8 && normalizedChunk.includes(normalizedQuery.slice(0, 30))) {
    score += 5;
  }

  return score;
}

/** Get the most relevant chunks for a query. */
export function getRelevantChunks(
  chunks: { chunk_index: number; content: string }[],
  query: string,
  topK = 20
): string[] {
  if (chunks.length === 0) return [];

  // If document is small enough, return everything
  const totalChars = chunks.reduce((sum, c) => sum + c.content.length, 0);
  if (totalChars < 30000 || chunks.length <= topK) {
    return chunks
      .sort((a, b) => a.chunk_index - b.chunk_index)
      .map((c) => c.content);
  }

  // Score all chunks
  const scored = chunks.map((c) => ({
    ...c,
    score: scoreChunk(c.content, query),
  }));

  const maxScore = Math.max(...scored.map((c) => c.score));

  if (maxScore > 0) {
    // Sort by score, take top K
    scored.sort((a, b) => b.score - a.score);
    const topChunks = scored.slice(0, topK);

    // Re-sort by index for coherent reading order
    topChunks.sort((a, b) => a.chunk_index - b.chunk_index);

    // Also include adjacent chunks for context continuity
    const selectedIndices = new Set(topChunks.map((c) => c.chunk_index));
    const withContext: typeof topChunks = [];
    for (const chunk of topChunks) {
      // Add previous chunk if not already included
      if (!selectedIndices.has(chunk.chunk_index - 1)) {
        const prev = chunks.find((c) => c.chunk_index === chunk.chunk_index - 1);
        if (prev) {
          withContext.push({ ...prev, score: 0 });
          selectedIndices.add(prev.chunk_index);
        }
      }
      withContext.push(chunk);
    }

    // Sort by index and dedupe
    withContext.sort((a, b) => a.chunk_index - b.chunk_index);
    const seen = new Set<number>();
    return withContext
      .filter((c) => { if (seen.has(c.chunk_index)) return false; seen.add(c.chunk_index); return true; })
      .map((c) => c.content);
  }

  // Fallback: spread chunks evenly across the document
  const step = Math.max(1, Math.floor(chunks.length / topK));
  const sorted = [...chunks].sort((a, b) => a.chunk_index - b.chunk_index);
  const sampled: string[] = [];
  for (let i = 0; i < sorted.length && sampled.length < topK; i += step) {
    sampled.push(sorted[i].content);
  }
  return sampled;
}
