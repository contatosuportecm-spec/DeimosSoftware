import { GoogleGenerativeAI, Content, GenerateContentStreamResult, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ChatMessage } from "@/types";

/**
 * Camada LLM unificada. Hoje usa Gemini 2.5 Pro.
 * Toda chamada de copy/análise passa por aqui.
 */

export const COPY_MODEL = "gemini-2.5-pro";
export const FAST_MODEL = "gemini-2.5-flash";

export interface LLMOptions {
  messages: Pick<ChatMessage, "role" | "content">[];
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Adicione em .env.local: GEMINI_API_KEY=...",
    );
  }
  return new GoogleGenerativeAI(key);
}

/** Converte mensagens estilo Anthropic/OpenAI para o formato Gemini. */
function toGeminiContents(messages: Pick<ChatMessage, "role" | "content">[]): {
  history: Content[];
  lastUserMessage: string;
} {
  if (messages.length === 0) {
    return { history: [], lastUserMessage: "" };
  }

  // Gemini não aceita "system" no history — vai como systemInstruction separado.
  const filtered = messages.filter((m) => m.role !== "system");
  if (filtered.length === 0) {
    return { history: [], lastUserMessage: messages[messages.length - 1].content };
  }

  const last = filtered[filtered.length - 1];
  const historyMsgs = filtered.slice(0, -1);

  const history: Content[] = historyMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  return { history, lastUserMessage: last.content };
}

/** Chamada síncrona — retorna texto completo. */
export async function callLLM(options: LLMOptions): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: options.model ?? COPY_MODEL,
    systemInstruction: options.systemPrompt,
    generationConfig: {
      maxOutputTokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.8,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  });

  const { history, lastUserMessage } = toGeminiContents(options.messages);

  if (history.length === 0) {
    const result = await model.generateContent(lastUserMessage);
    const text = result.response.text();
    if (!text) {
      const candidates = result.response.candidates;
      const feedback = result.response.promptFeedback;
      console.error("[llm] Empty response. finishReason:", candidates?.[0]?.finishReason, "feedback:", JSON.stringify(feedback), "safetyRatings:", JSON.stringify(candidates?.[0]?.safetyRatings));
    }
    return text;
  }

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastUserMessage);
  const text = result.response.text();
  if (!text) {
    const candidates = result.response.candidates;
    console.error("[llm] Empty chat response. finishReason:", candidates?.[0]?.finishReason);
  }
  return text;
}

/** Stream raw do Gemini — devolve o iterator direto. */
export async function streamLLMRaw(options: LLMOptions): Promise<GenerateContentStreamResult> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: options.model ?? COPY_MODEL,
    systemInstruction: options.systemPrompt,
    generationConfig: {
      maxOutputTokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.8,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  });

  const { history, lastUserMessage } = toGeminiContents(options.messages);

  if (history.length === 0) {
    return await model.generateContentStream(lastUserMessage);
  }

  const chat = model.startChat({ history });
  return await chat.sendMessageStream(lastUserMessage);
}
