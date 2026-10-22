"use client";

import { memo, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const { copied: isCopied, copy } = useCopy();

  const handleCopy = () => copy(text);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors"
    >
      {isCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {isCopied ? "Copied" : "Copy"}
    </button>
  );
}

function Pre({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const child = children as {
    props?: { className?: string; children?: unknown };
  };
  const language = /language-(\w+)/.exec(child?.props?.className ?? "")?.[1];
  const code = String(child?.props?.children ?? "").replace(/\n$/, "");

  return (
    <div className="bg-surface-muted my-4 overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-muted-foreground font-mono text-[11px]">
          {language ?? "text"}
        </span>
        <CopyButton text={code} />
      </div>
      <pre
        {...props}
        className="scrollbar-thin overflow-x-auto p-3.5 font-mono text-[0.8rem] leading-relaxed"
      >
        {children}
      </pre>
    </div>
  );
}

const components: Components = {
  pre: Pre,
  a: ({ node: _node, ...props }) => (
    <a target="_blank" rel="noopener noreferrer" {...props} />
  ),
  table: ({ node: _node, ...props }) => (
    <div className="scrollbar-thin overflow-x-auto">
      <table {...props} />
    </div>
  ),
};

function MarkdownMessageComponent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("markdown", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const MarkdownMessage = memo(MarkdownMessageComponent);
