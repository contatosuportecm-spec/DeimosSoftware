// ═══════════════════════════════════════════════════════════════════
// Wrapper de compatibilidade: a API segue chamando "callClaude" mas
// internamente roteia para Gemini (gemini-2.5-pro). Mantido pra evitar
// refatorar 20 imports espalhados.
// ═══════════════════════════════════════════════════════════════════

import { callLLM, streamLLMRaw } from "./llm";
import { ChatMessage } from "@/types";

export interface ClaudeStreamOptions {
  messages: Pick<ChatMessage, "role" | "content">[];
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/** Chunk no formato Anthropic — consumido pelo app/api/chat/route.ts */
type AnthropicChunk =
  | { type: "content_block_delta"; delta: { type: "text_delta"; text: string } }
  | { type: "message_stop" };

/**
 * Devolve um async iterable de chunks no formato Anthropic.
 * Por trás, consome o stream do Gemini e re-emite no shape esperado.
 */
export async function streamClaude(options: ClaudeStreamOptions): Promise<AsyncIterable<AnthropicChunk>> {
  const stream = await streamLLMRaw(options);

  async function* adapt(): AsyncIterable<AnthropicChunk> {
    for await (const chunk of stream.stream) {
      const text = chunk.text();
      if (text) {
        yield {
          type: "content_block_delta",
          delta: { type: "text_delta", text },
        };
      }
    }
    yield { type: "message_stop" };
  }

  return adapt();
}

/** Chamada síncrona retornando o texto completo. */
export async function callClaude(options: ClaudeStreamOptions): Promise<string> {
  return callLLM(options);
}
