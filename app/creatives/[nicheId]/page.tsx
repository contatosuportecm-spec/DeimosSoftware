"use client";

import { use } from "react";
import LayoutApp from "@/app/layout-app";
import { useChat } from "@/hooks/useChat";
import Button from "@/components/ui/Button";
import { ArrowUp } from "lucide-react";

export default function NicheChatPage({ params }: { params: Promise<{ nicheId: string }> }) {
  const { nicheId } = use(params);
  const { messages, input, setInput, sendMessage, loading } = useChat(nicheId);

  return (
    <LayoutApp>
      <div className="flex flex-col h-[calc(100vh-48px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                {nicheId}
              </p>
              <p className="text-sm text-text-secondary">
                Inicie uma conversa com a inteligência do nicho
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[72%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gold text-black font-medium"
                      : "bg-bg-3 border border-border text-text-primary"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-bg-3 border border-border rounded-lg px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1 h-1 bg-gold/40 rounded-full animate-pulse" />
                  <span className="w-1 h-1 bg-gold/40 rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                  <span className="w-1 h-1 bg-gold/40 rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-6 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mensagem..."
              disabled={loading}
              className="flex-1 bg-bg-3 border border-border rounded-md px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/10 transition-colors disabled:opacity-40"
            />
            <Button type="submit" size="md" disabled={loading || !input.trim()}>
              <ArrowUp size={15} strokeWidth={2} />
            </Button>
          </form>
        </div>
      </div>
    </LayoutApp>
  );
}
