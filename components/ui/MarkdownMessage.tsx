"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";

const components: Components = {
  // Paragraphs
  p: ({ children }) => (
    <p className="leading-relaxed mb-2 last:mb-0">{children}</p>
  ),

  // Headings
  h1: ({ children }) => (
    <h1 className="text-[15px] font-semibold text-white mt-3 mb-1 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[14px] font-semibold text-white mt-3 mb-1 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[13px] font-semibold text-white mt-2 mb-0.5 first:mt-0">{children}</h3>
  ),

  // Inline formatting
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-text-secondary">{children}</em>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="ml-4 space-y-0.5 mb-2 list-disc">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="ml-4 space-y-0.5 mb-2 list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),

  // Code
  code: ({ children, className }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <code className="block bg-[#0d1117] border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] font-mono text-[#c0c0cc] overflow-x-auto">
          {children}
        </code>
      );
    }
    return (
      <code className="font-mono text-[#F4C430] bg-[#F4C430]/10 px-1.5 py-0.5 rounded text-[0.85em]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2 last:mb-0">{children}</pre>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#F4C430]/30 pl-3 text-text-muted italic my-2">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => <hr className="border-white/[0.08] my-3" />,

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#F4C430] underline underline-offset-2 hover:text-[#E0B020] transition-colors"
    >
      {children}
    </a>
  ),
};

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export default function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn("text-[inherit] leading-relaxed", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
