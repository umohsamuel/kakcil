"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { useFlowSSEChat } from "@/hooks/use-sse-chat";
import { FlowCanvas } from "@/components/flow-canvas";
import { MarkdownMessage } from "@/components/markdown-message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Send, X, Copy, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Node } from "reactflow";
import { queryKeys } from "@/lib/query-keys";

function ChatPageContent() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // Callback to invalidate chats when new chat is created
  const handleNewChatCreated = useCallback((chatId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() });
  }, [queryClient]);

  const {
    flowState,
    onNodesChange,
    onEdgesChange,
    startStreaming,
    getRoundFromNodeId,
  } = useFlowSSEChat(undefined, { onNewChatCreated: handleNewChatCreated });
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Open sidebar when streaming starts
  useEffect(() => {
    if (flowState.isStreaming) {
      setSidebarOpen(true);
    }
  }, [flowState.isStreaming]);

  const handleStartChat = async () => {
    if (!input.trim() || flowState.isStreaming) return;

    const message = input.trim();
    setInput("");
    setSidebarOpen(true);

    try {
      await startStreaming(message, flowState.chatId);
    } catch (error) {
      toast.error("Sorry, there was an error starting the chat.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStartChat();
    }
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.type === "modelResponse" || node.type === "finalAnswer" || node.type === "userPrompt") {
      setSelectedNodeId(node.id);
      setSidebarOpen(true);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard");
  };

  // Get context for the selected node based on its round
  const getSelectedContext = () => {
    if (!selectedNodeId) return null;
    
    const round = getRoundFromNodeId(selectedNodeId);
    const roundData = flowState.rounds[round];
    
    if (!roundData) {
      // Fallback to current round data
      return {
        prompt: flowState.userMessage,
        modelNodes: flowState.modelNodes,
        finalResponse: flowState.finalResponse,
        round: flowState.conversationRound,
      };
    }

    return { ...roundData, round };
  };

  // Get the specific model from the selected node
  const getModelFromNodeId = (nodeId: string | null): string | null => {
    if (!nodeId) return null;
    if (nodeId.startsWith("model-")) {
      const parts = nodeId.replace("model-", "").split("-r");
      return parts[0] || null;
    }
    return null;
  };

  const selectedContext = getSelectedContext();
  const selectedModel = getModelFromNodeId(selectedNodeId);
  const selectedModelNode = selectedModel && selectedContext
    ? selectedContext.modelNodes.find((n) => n.model === selectedModel)
    : null;
  const isFinalAnswerSelected = selectedNodeId?.startsWith("final-");

  const showCanvas = flowState.nodes.length > 0;
  const showInitialInput = !showCanvas && !sidebarOpen;

  // Get display content for sidebar
  const getSidebarContent = () => {
    if (!selectedContext) return null;

    if (selectedModel && selectedModelNode) {
      return {
        title: selectedModelNode.model,
        isWinner: selectedModelNode.status === "winner",
        prompt: selectedContext.prompt,
        response: selectedModelNode.response,
      };
    }

    if (isFinalAnswerSelected && selectedContext.finalResponse) {
      return {
        title: `Final Answer (${selectedContext.finalResponse.model})`,
        isWinner: true,
        prompt: selectedContext.prompt,
        response: selectedContext.finalResponse.response,
      };
    }

    if (selectedNodeId?.startsWith("prompt-")) {
      return {
        title: "Your Question",
        isWinner: false,
        prompt: selectedContext.prompt,
        response: null,
      };
    }

    return null;
  };

  const sidebarContent = getSidebarContent();

  return (
    <div className="flex h-full w-full">
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <main className="relative flex h-full flex-1 flex-col">
          {/* Mobile Header */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 px-4 md:hidden">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Kakcil Logo" width={24} height={24} />
              <span className="font-bold">KAKCIL</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logout()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </header>

          {showInitialInput && (
            <div className="flex flex-1 flex-col">
              <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-8 text-center">
                <div className="bg-foreground/5 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                  <Image
                    src="/logo.png"
                    alt="Kakcil Logo"
                    width={40}
                    height={40}
                    className="invert-100 dark:invert-0"
                  />
                </div>
                <h2 className="text-2xl font-bold">Start a Conversation</h2>
                <p className="text-foreground/60 max-w-md">
                  Ask anything to begin. The council will debate and provide you
                  with the best answer.
                </p>
              </div>

              <div className="bg-background border-foreground/10 border-t p-4 md:p-6">
                <div className="relative mx-auto max-w-3xl">
                  <div className="border-background/10 bg-foreground focus-within:border-background/30 flex items-center gap-2 rounded-2xl border-2 p-2 transition-colors">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask the council..."
                      className="placeholder:text-background/50 text-background max-h-[200px] min-h-[50px] w-full resize-none border-0 bg-transparent px-2 py-3 text-base outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      disabled={flowState.isStreaming}
                      rows={1}
                    />
                    <Button
                      onClick={handleStartChat}
                      disabled={!input.trim() || flowState.isStreaming}
                      size="icon"
                      className="bg-background text-foreground hover:bg-background/90 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showCanvas && (
            <div className="h-full flex-1">
              <FlowCanvas
                nodes={flowState.nodes}
                edges={flowState.edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
              />
            </div>
          )}
        </main>
      </div>

      {/* Right Sidebar */}
      {sidebarOpen && (
        <div className="flex h-full w-[450px] flex-col border-l border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-300 p-4 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">
                {sidebarContent?.title || "Council Response"}
              </span>
              {sidebarContent?.isWinner && (
                <span className="text-xs font-semibold text-yellow-600">
                  🏆 Winner
                </span>
              )}
              {flowState.isStreaming && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSidebarOpen(false);
                setSelectedNodeId(null);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
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
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
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
                  {!flowState.isStreaming && (
                    <Button
                      onClick={() => handleCopy(sidebarContent.response!, "sidebar")}
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
              {flowState.isStreaming && !sidebarContent?.response && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Council is deliberating...</span>
                </div>
              )}
            </div>
          </div>

          {/* Input in sidebar */}
          <div className="border-t border-gray-300 p-4 dark:border-gray-700">
            <div className="flex items-end gap-2 rounded-2xl border-2 border-gray-900 bg-gray-900 p-2 focus-within:border-gray-700 dark:border-gray-100 dark:bg-gray-100">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask another question..."
                className="max-h-[200px] min-h-[50px] w-full resize-none border-0 bg-transparent px-2 py-3 text-sm text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-gray-900 dark:placeholder:text-gray-600"
                disabled={flowState.isStreaming}
                rows={1}
              />
              <Button
                onClick={handleStartChat}
                disabled={!input.trim() || flowState.isStreaming}
                size="icon"
                className="h-10 w-10 shrink-0 rounded-lg bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}
