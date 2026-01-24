"use client";

import { ConversationState, ModelNode } from "@/types/chat";
import { ModelNodeComponent } from "@/components/model-node";
import { ConversationModal } from "@/components/conversation-modal";
import { FinalAnswerPanel } from "@/components/final-answer-panel";
import { useState } from "react";
import { Card } from "@/components/ui/card";

interface ChatCanvasProps {
  conversationState: ConversationState;
}

export function ChatCanvas({ conversationState }: ChatCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<ModelNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNodeClick = (node: ModelNode) => {
    if (node.response) {
      setSelectedNode(node);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNode(null);
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Canvas Area */}
      <Card className="relative flex-1 min-h-[500px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* User Message in Center */}
        {conversationState.userMessage && (
          <div className="absolute left-1/2 top-1/2 z-10 max-w-md -translate-x-1/2 -translate-y-1/2 transform">
            <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-950">
              <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Your Question
              </p>
              <p className="text-center text-base font-medium leading-relaxed">
                {conversationState.userMessage}
              </p>
            </div>
          </div>
        )}

        {/* Model Nodes */}
        {conversationState.modelNodes.map((node, index) => (
          <ModelNodeComponent
            key={node.model}
            node={node}
            onClick={() => handleNodeClick(node)}
            index={index}
            total={conversationState.modelNodes.length}
          />
        ))}

        {/* Loading state */}
        {conversationState.modelNodes.length === 0 &&
          conversationState.isStreaming && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
                <p className="text-sm font-medium text-muted-foreground">
                  Preparing models...
                </p>
              </div>
            </div>
          )}
      </Card>

      {/* Final Answer Panel */}
      {conversationState.finalResponse && (
        <FinalAnswerPanel finalResponse={conversationState.finalResponse} />
      )}

      {/* Error Display */}
      {conversationState.error && (
        <Card className="border-2 border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {conversationState.error}
          </p>
        </Card>
      )}

      {/* Conversation Modal */}
      <ConversationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        node={selectedNode}
        userMessage={conversationState.userMessage}
      />
    </div>
  );
}
