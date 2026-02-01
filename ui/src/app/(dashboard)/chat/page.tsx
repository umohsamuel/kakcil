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
import { LogOut, Send, X, Copy, Check, Loader2, AlertTriangle, RefreshCw, PanelRightOpen, PanelRightClose } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Node } from "reactflow";
import { queryKeys } from "@/lib/query-keys";
function ChatPageContent() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
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
  const [mobileShowSidebar, setMobileShowSidebar] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);
  useEffect(() => {
    if (flowState.isStreaming) {
      setSidebarOpen(true);
    }
  }, [flowState.isStreaming]);
  useEffect(() => {
    if (flowState.error) {
      toast.error(flowState.error, {
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => handleRetry(),
        },
      });
    }
  }, [flowState.error]);
  const handleRetry = () => {
    if (flowState.userMessage) {
      startStreaming(flowState.userMessage, flowState.chatId);
    }
  };
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
  const getSelectedContext = () => {
    if (!selectedNodeId) return null;
    const round = getRoundFromNodeId(selectedNodeId);
    const roundData = flowState.rounds[round];
    if (!roundData) {
      return {
        prompt: flowState.userMessage,
        modelNodes: flowState.modelNodes,
        finalResponse: flowState.finalResponse,
        round: flowState.conversationRound,
      };
    }
    return { ...roundData, round };
  };
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
            <div className={`h-full flex-1 ${mobileShowSidebar && sidebarOpen ? 'hidden md:block' : ''}`}>
              <FlowCanvas
                nodes={flowState.nodes}
                edges={flowState.edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
              />
              {/* Mobile toggle button to show sidebar when a node is selected */}
              {sidebarOpen && !mobileShowSidebar && (
                <button
                  onClick={() => setMobileShowSidebar(true)}
                  className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-lg md:hidden"
                >
                  <PanelRightOpen className="h-4 w-4" />
                  <span className="text-sm font-medium">View Details</span>
                </button>
              )}
            </div>
          )}
        </main>
      </div>
      {/* Right Sidebar - fullscreen on mobile when open */}
      {sidebarOpen && (
        <div className={`flex h-full flex-col border-l border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 ${mobileShowSidebar ? 'fixed inset-0 z-50 w-full md:relative md:w-[450px]' : 'hidden md:flex md:w-[450px]'}`}>
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
            <div className="flex items-center gap-2">
              {/* Mobile back button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileShowSidebar(false)}
                className="md:hidden"
              >
                <PanelRightClose className="h-5 w-5" />
              </Button>
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSidebarOpen(false);
                  setSelectedNodeId(null);
                  setMobileShowSidebar(false);
                }}
              >
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
              {/* Error Display */}
              {flowState.error && (
                <div className="rounded-xl border-2 border-red-500/50 bg-red-50 p-4 dark:bg-red-950/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {flowState.error}
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
                        onClick={handleRetry}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-red-500/50 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/50"
                        disabled={flowState.isStreaming}
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
