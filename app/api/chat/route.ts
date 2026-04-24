import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { streamClaude } from "@/lib/claude";
import { createServerClient } from "@/lib/supabase";
import { ChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, nicheId, messages } = await req.json() as {
      sessionId: string;
      nicheId: string;
      messages: Pick<ChatMessage, "role" | "content">[];
    };

    // Busca o system prompt do nicho
    const supabase = createServerClient();
    const { data: niche } = await supabase
      .from("niches")
      .select("system_prompt, name")
      .eq("id", nicheId)
      .single();

    const systemPrompt = niche?.system_prompt ?? `Você é um especialista em ${niche?.name ?? nicheId} e vai ajudar a criar criativos de alta conversão para esse nicho.`;

    const stream = await streamClaude({ messages, systemPrompt });

    // Streaming SSE response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[api/chat]", error);
    return NextResponse.json({ error: "Erro ao processar mensagem" }, { status: 500 });
  }
}
