import { streamClaude, ClaudeStreamOptions } from "./claude";

export async function createSSEStream(options: ClaudeStreamOptions): Promise<ReadableStream> {
  const stream = await streamClaude(options);
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("[SSE stream error]", err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: "\n\n[Erro ao gerar resposta]" })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });
}

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;
