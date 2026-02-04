"use client";

import { useState, useEffect, useCallback, useEffectEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { useFlowSSEChat } from "@/hooks/use-sse-chat";
import { FlowCanvas } from "@/components/flow-canvas";
import { PanelRightOpen } from "lucide-react";
import { toast } from "sonner";
import { Node } from "reactflow";
import { queryKeys } from "@/lib/query-keys";
import { ChatHeader } from "@/components/chat/chat-header";
import { InitialChatView } from "@/components/chat/initial-chat-view";
import { ChatResponseSidebar } from "@/components/chat/chat-response-sidebar";

type SidebarContent = {
  title: string;
  isWinner: boolean;
  prompt: string;
  response: string | null;
};

function ChatPageContent() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const handleNewChatCreated = useCallback(
    (_chatId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() });
    },
    [queryClient]
  );

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

  const toggleSidebar = useEffectEvent((value: boolean) => {
    setSidebarOpen(value);
  });

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
      console.log(`error in handleStartChat: ${error} `);
    }
  };

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (
      node.type === "modelResponse" ||
      node.type === "finalAnswer" ||
      node.type === "userPrompt"
    ) {
      setSelectedNodeId(node.id);
      setSidebarOpen(true);
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
  const selectedModelNode =
    selectedModel && selectedContext
      ? selectedContext.modelNodes.find((n) => n.model === selectedModel)
      : null;
  const isFinalAnswerSelected = selectedNodeId?.startsWith("final-");
  const showCanvas = flowState.nodes.length > 0;
  const showInitialInput = !showCanvas && !sidebarOpen;

  const getSidebarContent = (): SidebarContent | null => {
    if (!selectedContext) return null;
    if (selectedModel && selectedModelNode) {
      return {
        title: selectedModelNode.model,
        isWinner: selectedModelNode.status === "winner",
        prompt: selectedContext.prompt,
        response: selectedModelNode.response || null,
      };
    }

    if (isFinalAnswerSelected && selectedContext.finalResponse) {
      return {
        title: `Final Answer (${selectedContext.finalResponse.model})`,
        isWinner: true,
        prompt: selectedContext.prompt,
        response: selectedContext.finalResponse.response || null,
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

  useEffect(() => {
    if (flowState.isStreaming) {
      toggleSidebar(true);
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

  return (
    <div className="bg-background text-foreground flex h-full w-full overflow-hidden lg:rounded-tl-4xl">
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <main className="relative flex h-full flex-1 flex-col">
          {/* Mobile Header */}
          {showInitialInput && (
            <InitialChatView
              input={input}
              onInputChange={setInput}
              onSend={handleStartChat}
              disabled={flowState.isStreaming}
            />
          )}
          {showCanvas && (
            <div
              className={`h-full flex-1 ${mobileShowSidebar && sidebarOpen ? "hidden md:block" : ""}`}
            >
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
                  className="bg-foreground text-background absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-sm px-4 py-2 shadow-lg md:hidden"
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
      <ChatResponseSidebar
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
          setSelectedNodeId(null);
          setMobileShowSidebar(false);
        }}
        sidebarContent={sidebarContent}
        selectedContext={selectedContext}
        input={input}
        onInputChange={setInput}
        onSend={handleStartChat}
        isStreaming={flowState.isStreaming}
        error={flowState.error}
        onRetry={handleRetry}
        mobileShowSidebar={mobileShowSidebar}
        onMobileBack={() => setMobileShowSidebar(false)}
      />
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
