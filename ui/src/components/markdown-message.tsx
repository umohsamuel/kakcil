"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
}

function CopyButton({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded p-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
      title="Copy code"
    >
      {isCopied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="mt-4 mb-2 text-xl font-bold" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="mt-3 mb-2 text-lg font-bold" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mt-2 mb-1 text-base font-bold" {...props} />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <div className="mb-2 leading-relaxed" {...props} />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul
              className="mb-2 ml-4 list-outside list-disc space-y-1"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="mb-2 ml-4 list-outside list-decimal space-y-1"
              {...props}
            />
          ),
          li: ({ node, ...props }) => <li className="pl-1" {...props} />,

          // Code blocks
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeContent = String(children).replace(/\n$/, "");

            return !inline ? (
              <div className="my-2 -ml-5">
                <div className="bg-foreground text-background overflow-hidden rounded-lg">
                  <div className="bg-foreground border-background flex items-center justify-between border-b px-4 py-1.5">
                    <span className="text-background/40 font-mono text-xs">
                      {match?.[1] || "text"}
                    </span>
                    <CopyButton text={codeContent} />
                  </div>
                  <pre className="overflow-x-auto p-4">
                    <code
                      className={`font-mono text-sm ${className}`}
                      {...props}
                    >
                      {children}
                    </code>
                  </pre>
                </div>
              </div>
            ) : (
              <code
                className="bg-foreground text-background rounded px-1.5 py-0.5 font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-background/30 text-background/40 my-2 border-l-4 pl-4 italic"
              {...props}
            />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 hover:underline dark:text-blue-400"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Strong/Bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold" {...props} />
          ),

          // Emphasis/Italic
          em: ({ node, ...props }) => <em className="italic" {...props} />,

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="border-background/30 my-4 border-t" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
