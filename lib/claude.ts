import Anthropic from "@anthropic-ai/sdk";
import { ChatMessage } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClaudeStreamOptions {
  messages: Pick<ChatMessage, "role" | "content">[];
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
}

export async function streamClaude(options: ClaudeStreamOptions) {
  const { messages, systemPrompt, model = "claude-opus-4-6", maxTokens = 4096 } = options;

  const stream = await anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role === "system" ? "user" : m.role,
      content: m.content,
    })),
  });

  return stream;
}

export async function callClaude(options: ClaudeStreamOptions): Promise<string> {
  const stream = await streamClaude(options);
  const message = await stream.finalMessage();
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}
