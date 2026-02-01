"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownMessage } from "@/components/markdown-message";
import { ChatInput } from "./chat-input";
import {
  X,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
  PanelRightClose,
} from "lucide-react";
import { toast } from "sonner";

interface SidebarContent {
  title: string;
  isWinner: boolean;
  prompt: string;
  response: string | null;
}

interface ChatResponseSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sidebarContent: SidebarContent | null;
  selectedContext: {
    round: number;
  } | null;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  error?: string;
  onRetry: () => void;
  mobileShowSidebar: boolean;
  onMobileBack: () => void;
}

export function ChatResponseSidebar({
  isOpen,
  onClose,
  sidebarContent,
  selectedContext,
  input,
  onInputChange,
  onSend,
  isStreaming,
  error,
  onRetry,
  mobileShowSidebar,
  onMobileBack,
}: ChatResponseSidebarProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard");
  };

  if (!isOpen) return null;

  return (
    <div
      className={`flex h-full flex-col border-l border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 ${mobileShowSidebar ? "fixed inset-0 z-50 w-full md:relative md:w-[450px]" : "hidden md:flex md:w-[450px]"}`}
    >
      <div className="flex items-center justify-between border-b border-gray-300 p-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-wide text-gray-900 uppercase dark:text-gray-100">
            {sidebarContent?.title || "Council Response"}
          </span>
          {sidebarContent?.isWinner && (
            <span className="text-xs font-semibold text-yellow-600">
              🏆 Winner
            </span>
          )}
          {isStreaming && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile back button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileBack}
            className="md:hidden"
          >
            <PanelRightClose className="h-5 w-5" />
          </Button>
          {/* Close button */}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Round indicator */}
          {selectedContext && selectedContext.round > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Round {selectedContext.round + 1}
            </div>
          )}
          {/* User Message */}
          {sidebarContent?.prompt && (
            <div className="flex items-start justify-end gap-3">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-black px-6 py-4 text-white dark:bg-gray-800">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {sidebarContent.prompt}
                </div>
              </div>
            </div>
          )}
          {/* Response */}
          {sidebarContent?.response && (
            <div className="group w-full">
              <div className="font-mono text-sm">
                <MarkdownMessage content={sidebarContent.response} />
              </div>
              {!isStreaming && (
                <Button
                  onClick={() =>
                    handleCopy(sidebarContent.response!, "sidebar")
                  }
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  {copiedId === "sidebar" ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Response
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
          {/* Loading indicator */}
          {isStreaming && !sidebarContent?.response && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Council is deliberating...</span>
            </div>
          )}
          {/* Error Display */}
          {error && (
            <div className="rounded-xl border-2 border-red-500/50 bg-red-50 p-4 dark:bg-red-950/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {error}
                  </p>
                  <p className="text-xs text-red-500/80 dark:text-red-400/80">
                    This could be due to:
                  </p>
                  <ul className="list-inside list-disc text-xs text-red-500/80 dark:text-red-400/80">
                    <li>Models not being available</li>
                    <li>API key issues</li>
                    <li>Network connectivity problems</li>
                  </ul>
                  <Button
                    onClick={onRetry}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-red-500/50 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/50"
                    disabled={isStreaming}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input in sidebar */}
      <div className="border-t border-gray-300 p-4 dark:border-gray-700">
        <ChatInput
          value={input}
          onChange={onInputChange}
          onSend={onSend}
          disabled={isStreaming}
          placeholder="Ask another question..."
          variant="dark"
        />
      </div>
    </div>
  );
}
