"use client";
import { useState, useEffect, useEffectEvent } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { useSSEStoreSync } from "@/hooks/use-sse-store-sync";
import {
  useMessages,
  useBranchFromResponse,
  useBranchInfo,
} from "@/hooks/use-chat";
import { useFlowSSEChat } from "@/hooks/use-sse-chat";
import { useParams, useSearchParams } from "next/navigation";
import { FlowCanvas } from "@/components/flow-canvas";
import { PanelRightOpen } from "lucide-react";
import { toast } from "sonner";
import { Node } from "reactflow";
import {
  ChatDetailSidebar,
  ChatInput,
  MessageHistoryView,
} from "@/components/chat";

function ChatDetailPageContent() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const chatId = params.id as string;
  const branchId = searchParams.get("branch");
  // Track current message for sync - use state so it triggers re-render for sync
  const [currentMessage, setCurrentMessage] = useState("");

  const {
    messages,
    isLoading: isLoadingMessages,
    isFetchingMore,
    hasMore,
    refetch,
    fetchMore,
  } = useMessages(chatId, branchId || undefined);

  const {
    flowState,
    onNodesChange,
    onEdgesChange,
    startStreaming,
    getRoundFromNodeId,
    addBranchPoint,
    initializeFromMessages,
  } = useFlowSSEChat(chatId);

  // Sync with global store for toast notifications
  useSSEStoreSync({
    streamId: chatId,
    flowState,
    message: currentMessage,
  });

  const { branchFromResponseAsync, isBranching } =
    useBranchFromResponse(chatId);

  const { branchInfo, isLoading: isLoadingBranch } = useBranchInfo(branchId);
  const [input, setInput] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileShowSidebar, setMobileShowSidebar] = useState(false);

  const updateSidebarState = useEffectEvent((value: boolean) => {
    setSidebarOpen(value);
  });

  useEffect(() => {
    if (!flowState.isStreaming && flowState.finalResponse) {
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  }, [flowState.isStreaming, flowState.finalResponse, refetch]);

  useEffect(() => {
    if (flowState.isStreaming) {
      updateSidebarState(true);
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
        (msg) =>
          msg.stored_council_responses &&
          msg.stored_council_responses.length > 0
      );
      if (hasCouncilData) {
        const parentContext = branchInfo
          ? {
              parentMessage: branchInfo.parentMessage
                ? {
                    id: branchInfo.parentMessage.id,
                    content: branchInfo.parentMessage.content,
                  }
                : undefined,
              parentResponse: branchInfo.parentResponse
                ? {
                    id: branchInfo.parentResponse.id,
                    model: branchInfo.parentResponse.model,
                    content: branchInfo.parentResponse.content,
                  }
                : undefined,
            }
          : undefined;
        initializeFromMessages(messages, chatId, parentContext);
      }
    }
  }, [
    messages,
    isLoadingMessages,
    isLoadingBranch,
    flowState.nodes.length,
    flowState.isStreaming,
    initializeFromMessages,
    chatId,
    branchInfo,
  ]);

  const handleSendMessage = async () => {
    if (!input.trim() || flowState.isStreaming) return;
    const message = input.trim();
    setCurrentMessage(message);
    setInput("");
    setSidebarOpen(true);
    try {
      await startStreaming(message, chatId, branchId || undefined);
    } catch (error) {
      toast.error("Sorry, there was an error processing your request.");
      console.log(`error in handleSendMessage: ${error}`);
    }
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (
      node.type === "modelResponse" ||
      node.type === "finalAnswer" ||
      node.type === "userPrompt"
    ) {
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
    
    // Find the council response ID by looking up in messages' stored_council_responses
    // We need to match the model name to get the actual UUID
    const councilResponseId = messages
      .flatMap((msg) => msg.stored_council_responses || [])
      .find((cr) => cr.model === selectedModelNode.model)?.id;

    if (!councilResponseId) {
      toast.error("Could not find council response to branch from");
      console.error("No council response found for model:", selectedModelNode.model);
      return;
    }

    try {
      const branchResult = await branchFromResponseAsync({
        message: "Continue from this response",
        chat_id: chatId,
        response_id: councilResponseId,
      });
      if (branchResult && branchResult.branch) {
        addBranchPoint(
          selectedNodeId,
          branchResult.branch.id,
          model,
          response,
          parentPrompt,
          branchResult.branch.branch_name || `${model} Branch`,
          "Continue from this response"
        );
        toast.success(`Branch created from ${model} response`);
      }
    } catch (error) {
      toast.error("Failed to create branch");
      console.log(`error in handleBranchFrom: ${error}`);
    }
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedNodeId(null);
    setMobileShowSidebar(false);
  };

  // Helper functions for sidebar content
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
  const selectedModelNode =
    selectedModel && selectedContext
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
          parentMessage: branchPoint.parentPrompt,
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
      <div className="bg-background flex h-full items-center justify-center overflow-hidden lg:rounded-tl-4xl">
        <div className="text-foreground/60">Loading chat...</div>
      </div>
    );
  }

  const showCanvas = flowState.nodes.length > 0;

  return (
    <div className="bg-background text-foreground h-full w-full overflow-hidden overflow-y-auto lg:h-[calc(100dvh-1.5rem)] lg:rounded-tl-4xl">
      <main className="relative flex h-full flex-1 flex-col">
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {showCanvas ? (
            <div className="flex h-full">
              {/* Canvas */}
              <div
                className={`flex-1 ${mobileShowSidebar && sidebarOpen ? "hidden md:block" : ""}`}
              >
                <FlowCanvas
                  nodes={flowState.nodes}
                  edges={flowState.edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={handleNodeClick}
                />
                {/* Mobile toggle button */}
                {sidebarOpen && !mobileShowSidebar && (
                  <button
                    onClick={() => setMobileShowSidebar(true)}
                    className="bg-primary text-primary-foreground absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg md:hidden"
                  >
                    <PanelRightOpen className="h-4 w-4" />
                    <span className="text-sm font-medium">View Details</span>
                  </button>
                )}
              </div>
              {/* Sidebar */}
              <ChatDetailSidebar
                isOpen={sidebarOpen}
                onClose={handleCloseSidebar}
                sidebarContent={sidebarContent}
                selectedContext={selectedContext}
                branchInfo={branchInfo}
                input={input}
                onInputChange={setInput}
                onSend={handleSendMessage}
                isStreaming={flowState.isStreaming}
                mobileShowSidebar={mobileShowSidebar}
                onMobileBack={() => setMobileShowSidebar(false)}
                selectedModel={selectedModel}
                selectedModelNode={selectedModelNode}
                isFinalAnswerSelected={isFinalAnswerSelected}
                isBranching={isBranching}
                onBranchFrom={handleBranchFrom}
              />
            </div>
          ) : (
            <>
              {/* Historical Messages View */}
              <MessageHistoryView
                messages={messages}
                userName={user?.name}
                hasMore={hasMore}
                isFetchingMore={isFetchingMore}
                onFetchMore={fetchMore}
              />
              {/* Input Area */}
              <div className="bg-background border-foreground/10 border-t p-4 md:p-6">
                <div className="relative mx-auto max-w-3xl">
                  <ChatInput
                    value={input}
                    onChange={setInput}
                    onSend={handleSendMessage}
                    disabled={flowState.isStreaming}
                    placeholder="Ask the council..."
                    variant="light"
                  />
                </div>
              </div>
            </>
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
