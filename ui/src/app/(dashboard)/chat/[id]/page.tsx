"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { useMessages, useBranchFromResponse, useBranchInfo } from "@/hooks/use-chat";
import { useFlowSSEChat } from "@/hooks/use-sse-chat";
import { useParams, useSearchParams } from "next/navigation";
import { FlowCanvas } from "@/components/flow-canvas";
import { MarkdownMessage } from "@/components/markdown-message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Send, Copy, Check, X, Loader2, GitBranch, PanelRightOpen, PanelRightClose } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Node } from "reactflow";
function ChatDetailPageContent() {
  const { user, logout } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const chatId = params.id as string;
  const branchId = searchParams.get("branch"); // Get branch from URL query
  const { 
    messages, 
    isLoading: isLoadingMessages, 
    isFetchingMore,
    hasMore,
    refetch,
    fetchMore,
  } = useMessages(chatId, branchId || undefined); // Pass branchId to load branch messages
  const {
    flowState,
    onNodesChange,
    onEdgesChange,
    startStreaming,
    getRoundFromNodeId,
    addBranchPoint,
    initializeFromMessages,
  } = useFlowSSEChat(chatId);
  const { branchFromResponseAsync, isBranching } = useBranchFromResponse(chatId);
  const { branchInfo, isLoading: isLoadingBranch } = useBranchInfo(branchId);
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileShowSidebar, setMobileShowSidebar] = useState(false); // On mobile: true = show sidebar, false = show canvas
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousScrollHeight = useRef<number>(0);
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    const handleScroll = () => {
      if (scrollElement.scrollTop < 100 && hasMore && !isFetchingMore) {
        previousScrollHeight.current = scrollElement.scrollHeight;
        fetchMore();
      }
    };
    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [hasMore, isFetchingMore, fetchMore]);
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement && previousScrollHeight.current > 0 && !isFetchingMore) {
      const newScrollHeight = scrollElement.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      if (scrollDiff > 0) {
        scrollElement.scrollTop = scrollDiff;
      }
      previousScrollHeight.current = 0;
    }
  }, [messages, isFetchingMore]);
  useEffect(() => {
    if (scrollRef.current && !previousScrollHeight.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length === 0 ? messages.length : 0]); // Only on initial load
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);
  useEffect(() => {
    if (!flowState.isStreaming && flowState.finalResponse) {
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  }, [flowState.isStreaming, flowState.finalResponse, refetch]);
  useEffect(() => {
    if (flowState.isStreaming) {
      setSidebarOpen(true);
    }
  }, [flowState.isStreaming]);
  useEffect(() => {
    if (
      !isLoadingMessages &&
      !isLoadingBranch &&
      messages.length > 0 &&
      flowState.nodes.length === 0 &&
      !flowState.isStreaming
    ) {
      const hasCouncilData = messages.some(
        (msg) => msg.stored_council_responses && msg.stored_council_responses.length > 0
      );
      if (hasCouncilData) {
        const parentContext = branchInfo ? {
          parentMessage: branchInfo.parentMessage ? {
            id: branchInfo.parentMessage.id,
            content: branchInfo.parentMessage.content,
          } : undefined,
          parentResponse: branchInfo.parentResponse ? {
            id: branchInfo.parentResponse.id,
            model: branchInfo.parentResponse.model,
            content: branchInfo.parentResponse.content,
          } : undefined,
        } : undefined;
        initializeFromMessages(messages, chatId, parentContext);
      }
    }
  }, [messages, isLoadingMessages, isLoadingBranch, flowState.nodes.length, flowState.isStreaming, initializeFromMessages, chatId, branchInfo]);
  const handleSendMessage = async () => {
    if (!input.trim() || flowState.isStreaming) return;
    const message = input.trim();
    setInput("");
    setSidebarOpen(true);
    try {
      await startStreaming(message, chatId, branchId || undefined);
    } catch (error) {
      toast.error("Sorry, there was an error processing your request.");
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const handleCopy = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard");
  };
  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.type === "modelResponse" || node.type === "finalAnswer" || node.type === "userPrompt") {
      setSelectedNodeId(node.id);
      setSidebarOpen(true);
    } else if (node.type === "branch") {
      const branchId = node.data.branchId;
      if (branchId) {
        window.location.href = `/chat/${chatId}?branch=${branchId}`;
      }
    }
  };
  const handleBranchFrom = async (model: string, response: string) => {
    if (!selectedNodeId || !selectedModelNode || isBranching) return;
    const selectedContext = getSelectedContext();
    const parentPrompt = selectedContext?.prompt || flowState.userMessage;
    try {
      const branchResult = await branchFromResponseAsync({
        message: "Continue from this response", // Default message, user can change
        chat_id: chatId,
        response_id: selectedModelNode.model, // This should be the actual response ID from backend
      });
      if (branchResult && branchResult.branch) {
        addBranchPoint(
          selectedNodeId,
          branchResult.branch.id,
          model,
          response,
          parentPrompt,
          branchResult.branch.branch_name || `${model} Branch`,
          "Continue from this response" // The message that starts the branch
        );
        toast.success(`Branch created from ${model} response`);
      }
    } catch (error) {
      toast.error("Failed to create branch");
    }
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
  const getSidebarContent = () => {
    if (!selectedContext) return null;
    const isBranchNode = selectedNodeId?.startsWith("branch-");
    if (isBranchNode) {
      const branchPoint = flowState.branchPoints.find(
        (bp) => bp.nodeId === selectedNodeId
      );
      if (branchPoint) {
        return {
          title: branchPoint.model,
          isWinner: true,
          isBranch: true,
          prompt: selectedContext.prompt,
          response: branchPoint.parentResponse,
          parentMessage: branchPoint.parentPrompt, // Original question that led to this branch
        };
      }
    }
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
  if (isLoadingMessages) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-foreground/60">Loading chat...</div>
      </div>
    );
  }
  const showCanvas = flowState.nodes.length > 0;
  return (
    <div className="h-full w-full">
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
        {/* Chat Area */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* Show canvas when actively streaming a new message */}
          {showCanvas ? (
            <div className="flex h-full">
              {/* Canvas - hidden on mobile when sidebar is open */}
              <div className={`flex-1 ${mobileShowSidebar && sidebarOpen ? 'hidden md:block' : ''}`}>
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
              {/* Sidebar for selected node - fullscreen on mobile when mobileShowSidebar is true */}
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
                      {/* Branch Parent Context - shown when viewing a branched chat */}
                      {branchInfo && (branchInfo.parentMessage || branchInfo.parentResponse) && (
                        <div className="rounded-xl border-2 border-purple-300 bg-purple-50/50 p-4 dark:border-purple-700 dark:bg-purple-950/30">
                          <div className="flex items-center gap-2 mb-3">
                            <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                              Branched From {branchInfo.branch?.branch_name || "Parent Chat"}
                            </span>
                          </div>
                          {/* Original Question */}
                          {branchInfo.parentMessage && (
                            <div className="mb-3">
                              <div className="text-xs text-purple-600/80 dark:text-purple-400/80 mb-1">Original Question:</div>
                              <div className="rounded-lg bg-white/80 px-3 py-2 text-sm dark:bg-gray-800/80">
                                {branchInfo.parentMessage.content}
                              </div>
                            </div>
                          )}
                          {/* Response that was branched from */}
                          {branchInfo.parentResponse && (
                            <div>
                              <div className="text-xs text-purple-600/80 dark:text-purple-400/80 mb-1">
                                Branched from {branchInfo.parentResponse.model}&apos;s response:
                              </div>
                              <div className="rounded-lg bg-white/80 px-3 py-2 text-sm dark:bg-gray-800/80 max-h-32 overflow-y-auto">
                                <MarkdownMessage content={branchInfo.parentResponse.content} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Parent Message - shown for branched nodes (existing) */}
                      {sidebarContent?.parentMessage && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                              Original Question (Branched From)
                            </span>
                          </div>
                          <div className="flex items-start justify-end gap-3">
                            <div className="max-w-[85%] rounded-2xl rounded-tr-sm border-2 border-purple-300 bg-purple-50 px-6 py-4 dark:border-purple-700 dark:bg-purple-950/40">
                              <div className="whitespace-pre-wrap text-sm leading-relaxed text-purple-900 dark:text-purple-100">
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
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                onClick={() => handleCopy(sidebarContent.response!, "sidebar")}
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
                              {/* Branch button - only show for model responses, not final answers */}
                              {selectedModel && selectedModelNode && !isFinalAnswerSelected && (
                                <Button
                                  onClick={() => handleBranchFrom(selectedModel, sidebarContent.response!)}
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
                        onClick={handleSendMessage}
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
          ) : (
            <>
              {/* Historical Messages - Traditional Chat Format */}
              {messages.length > 0 ? (
                <div
                  className="mx-auto w-full flex-1 overflow-y-auto scroll-smooth px-4 py-6 md:px-8"
                  ref={scrollRef}
                >
                  <div className="mx-auto flex max-w-[720px] flex-col gap-12">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`relative ${
                            message.role === "user"
                              ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-black px-6 py-4 text-white sm:max-w-[75%]"
                              : "group w-full font-mono text-base"
                          }`}
                        >
                          {message.role === "user" ? (
                            <div className="whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </div>
                          ) : (
                            <>
                              <MarkdownMessage content={message.content} />
                              <button
                                onClick={() => handleCopy(message.content, message.id)}
                                className="cursor-pointer rounded-sm border border-black/10 bg-white p-1.5 hover:bg-gray-50"
                                title="Copy message"
                              >
                                {copiedId === message.id ? (
                                  <Check className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-gray-600" />
                                )}
                              </button>
                            </>
                          )}
                          {message.role === "user" && message.timestamp && (
                            <span className="mt-2 block text-[10px] opacity-60">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        {message.role === "user" && (
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 text-xs font-bold text-white">
                            {user?.name?.[0] || "U"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
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
                  <h2 className="text-2xl font-bold">No Messages Yet</h2>
                  <p className="text-foreground/60 max-w-md">
                    Start the conversation by sending a message below.
                  </p>
                </div>
              )}
            </>
          )}
          {/* Input Area - Always at bottom when canvas not showing */}
          {!showCanvas && (
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
                    onClick={handleSendMessage}
                    disabled={!input.trim() || flowState.isStreaming}
                    size="icon"
                    className="bg-background text-foreground hover:bg-background/90 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
export default function ChatDetailPage() {
  return (
    <ProtectedRoute>
      <ChatDetailPageContent />
    </ProtectedRoute>
  );
}
