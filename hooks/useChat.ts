"use client";

import { useState, useCallback } from "react";
import { ChatMessage } from "@/types";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useChat(nicheId: string) {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: LocalMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const history: Pick<ChatMessage, "role" | "content">[] = [
        ...messages.map((m) => ({ role: m.role as ChatMessage["role"], content: m.content })),
        { role: "user", content: text },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nicheId, sessionId: null, messages: history }),
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
            const { text } = JSON.parse(data) as { text: string };
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + text } : m
              )
            );
          } catch {
            // linha inválida, ignora
          }
        }
      }
    } catch (err) {
      console.error("[useChat]", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Erro ao processar resposta. Tente novamente." }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, nicheId]);

  return { messages, input, setInput, sendMessage, loading };
}
