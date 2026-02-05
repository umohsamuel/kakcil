"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownMessage } from "@/components/markdown-message";
import { ChatInput } from "./chat-input";
import { BranchContextPanel } from "./branch-context-panel";
import {
  X,
  Copy,
  Check,
  Loader2,
  GitBranch,
  PanelRightClose,
} from "lucide-react";
import { toast } from "sonner";

interface BranchInfo {
  branch?: {
    id: string;
    branch_name?: string | null;
  };
  parentMessage?: {
    id: string;
    content: string;
  };
  parentResponse?: {
    id: string;
    model: string;
    content: string;
  };
}

interface SidebarContent {
  title: string;
  isWinner: boolean;
  isBranch?: boolean;
  prompt: string;
  response?: string | null;
  parentMessage?: string;
}

interface SelectedContext {
  round: number;
  prompt: string;
  modelNodes: Array<{
    model: string;
    response?: string;
    status: string;
  }>;
  finalResponse?: {
    model: string;
    response: string;
  };
}

interface ChatDetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sidebarContent: SidebarContent | null;
  selectedContext: SelectedContext | null;
  branchInfo?: BranchInfo | null;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  mobileShowSidebar: boolean;
  onMobileBack: () => void;
  // Branch functionality
  selectedModel?: string | null;
  selectedModelNode?: { model: string; response?: string; status: string } | null;
  isFinalAnswerSelected?: boolean;
  isBranching?: boolean;
  onBranchFrom?: (model: string, response: string) => void;
}

export function ChatDetailSidebar({
  isOpen,
  onClose,
  sidebarContent,
  selectedContext,
  branchInfo,
  input,
  onInputChange,
  onSend,
  isStreaming,
  mobileShowSidebar,
  onMobileBack,
  selectedModel,
  selectedModelNode,
  isFinalAnswerSelected,
  isBranching = false,
  onBranchFrom,
}: ChatDetailSidebarProps) {
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
      className={`flex h-full flex-col border-l border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 ${
        mobileShowSidebar
          ? "fixed inset-0 z-50 w-full md:relative md:w-[450px]"
          : "hidden md:flex md:w-[450px]"
      }`}
    >
      {/* Header */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Round indicator */}
          {selectedContext && selectedContext.round > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Round {selectedContext.round + 1}
            </div>
          )}

          {/* Branch Context - when viewing a branched chat */}
          {branchInfo && <BranchContextPanel branchInfo={branchInfo} />}

          {/* Parent Message - for branched nodes */}
          {sidebarContent?.parentMessage && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wide text-purple-600 uppercase dark:text-purple-400">
                  Original Question (Branched From)
                </span>
              </div>
              <div className="flex items-start justify-end gap-3">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm border-2 border-purple-300 bg-purple-50 px-6 py-4 dark:border-purple-700 dark:bg-purple-950/40">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-purple-900 dark:text-purple-100">
                    {sidebarContent.parentMessage}
                  </div>
                </div>
              </div>
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
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    onClick={() =>
                      handleCopy(sidebarContent.response!, "sidebar")
                    }
                    variant="outline"
                    size="sm"
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
                  {/* Branch button - only for model responses */}
                  {selectedModel &&
                    selectedModelNode &&
                    !isFinalAnswerSelected &&
                    onBranchFrom && (
                      <Button
                        onClick={() =>
                          onBranchFrom(selectedModel, sidebarContent.response!)
                        }
                        variant="outline"
                        size="sm"
                        disabled={isBranching}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-950"
                      >
                        {isBranching ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Branching...
                          </>
                        ) : (
                          <>
                            <GitBranch className="mr-2 h-4 w-4" />
                            Branch From Here
                          </>
                        )}
                      </Button>
                    )}
                </div>
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
        </div>
      </div>

      {/* Input */}
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
