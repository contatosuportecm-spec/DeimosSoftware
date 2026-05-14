"use client";

import { useState, useCallback, useRef } from "react";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseStreamChatOptions {
  endpoint: string;
  buildBody: (text: string, history: LocalMessage[]) => Record<string, unknown>;
  initialMessages?: LocalMessage[];
}

export function useStreamChat({ endpoint, buildBody, initialMessages }: UseStreamChatOptions) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: LocalMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(text, [...messages, userMsg])),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Erro na API");
      if (!res.body) throw new Error("Sem stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const { text: chunk } = JSON.parse(data) as { text: string };
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
            );
          } catch { /* invalid line */ }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("[useStreamChat]", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: "Erro ao processar resposta. Tente novamente." } : m
        )
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, loading, messages, endpoint, buildBody]);

  return { messages, setMessages, input, setInput, sendMessage, loading };
}
