"use client";

import { Check, Copy } from "lucide-react";
import { MarkdownMessage } from "@/components/markdown-message";

interface MessageItemProps {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp?: Date | string;
  userName?: string;
  copiedId: string | null;
  onCopy: (content: string, id: string) => void;
}

export function MessageItem({
  id,
  role,
  content,
  timestamp,
  userName,
  copiedId,
  onCopy,
}: MessageItemProps) {
  return (
    <div
      className={`flex items-start gap-3 ${
        role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`relative ${
          role === "user"
            ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-black px-6 py-4 text-white sm:max-w-[75%]"
            : "group w-full font-mono text-base"
        }`}
      >
        {role === "user" ? (
          <div className="leading-relaxed whitespace-pre-wrap">{content}</div>
        ) : (
          <>
            <MarkdownMessage content={content} />
            <button
              onClick={() => onCopy(content, id)}
              className="cursor-pointer rounded-sm border border-black/10 bg-white p-1.5 hover:bg-gray-50"
              title="Copy message"
            >
              {copiedId === id ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-gray-600" />
              )}
            </button>
          </>
        )}
        {role === "user" && timestamp && (
          <span className="mt-2 block text-[10px] opacity-60">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
      {role === "user" && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 text-xs font-bold text-white">
          {userName?.[0] || "U"}
        </div>
      )}
    </div>
  );
}
