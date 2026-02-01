"use client";
import { MarkdownMessage } from "@/components/markdown-message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Copy, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { ModelNode } from "@/types/chat";
interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: ModelNode | null;
  userMessage: string;
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isStreaming: boolean;
  finalResponse?: {
    model: string;
    response: string;
    topic?: string;
  };
}
export function ChatSidebar({
  isOpen,
  onClose,
  selectedNode,
  userMessage,
  input,
  onInputChange,
  onSendMessage,
  isStreaming,
  finalResponse,
}: ChatSidebarProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };
  if (!isOpen) return null;
  const displayContent = selectedNode || finalResponse;
  return (
    <div className="flex h-full w-[450px] flex-col border-l border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 p-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {selectedNode && (
            <>
              <span className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">
                {selectedNode.model}
              </span>
              {selectedNode.status === "winner" && (
                <span className="text-xs font-semibold text-yellow-600">
                  🏆 Winner
                </span>
              )}
            </>
          )}
          {!selectedNode && finalResponse && (
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Final Answer
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayContent && (
          <div className="space-y-6">
            {/* User Message */}
            <div className="flex items-start justify-end gap-3">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-black px-6 py-4 text-white dark:bg-gray-800">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {userMessage}
                </div>
              </div>
            </div>
            {/* Model/Final Response */}
            {((selectedNode && selectedNode.response) || finalResponse) && (
              <div className="group w-full">
                <div className="font-mono text-sm">
                  <MarkdownMessage
                    content={
                      selectedNode?.response || finalResponse?.response || ""
                    }
                  />
                </div>
                <Button
                  onClick={() =>
                    handleCopy(
                      selectedNode?.response || finalResponse?.response || ""
                    )
                  }
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  {copied ? (
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
              </div>
            )}
            {/* Metadata */}
            {(selectedNode?.topic || finalResponse?.topic) && (
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Topic:</span>{" "}
                  {selectedNode?.topic || finalResponse?.topic}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Input Area */}
      <div className="border-t border-gray-300 p-4 dark:border-gray-700">
        <div className="flex items-end gap-2 rounded-2xl border-2 border-gray-900 bg-gray-900 p-2 focus-within:border-gray-700 dark:border-gray-100 dark:bg-gray-100">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask another question..."
            className="max-h-[200px] min-h-[50px] w-full resize-none border-0 bg-transparent px-2 py-3 text-sm text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-gray-900 dark:placeholder:text-gray-600"
            disabled={isStreaming}
            rows={1}
          />
          <Button
            onClick={onSendMessage}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-lg bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
