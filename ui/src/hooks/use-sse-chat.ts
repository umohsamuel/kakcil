import { useState, useCallback, useRef } from "react";
import { Node, Edge, applyNodeChanges, applyEdgeChanges, OnNodesChange, OnEdgesChange, MarkerType } from "reactflow";
import { sseService } from "@/services/sse.service";
import {
  ModelNode,
  LLMResponseEvent,
  LLMVoteEvent,
  VoteResponseEvent,
  CouncilResponseData,
} from "@/types/chat";

interface RoundData {
  prompt: string;
  modelNodes: ModelNode[];
  finalResponse?: VoteResponseEvent;
  branchId?: string; // Track which branch this round belongs to
}

interface BranchPoint {
  nodeId: string;
  model: string;
  roundIndex: number;
  branchId: string;
  position: { x: number; y: number };
}

interface FlowConversationState {
  nodes: Node[];
  edges: Edge[];
  modelNodes: ModelNode[];
  userMessage: string;
  finalResponse?: VoteResponseEvent;
  isStreaming: boolean;
  error?: string;
  chatId?: string;
  conversationRound: number;
  rounds: RoundData[]; // Store data for each round
  branchPoints: BranchPoint[]; // Track all branch points
}

interface UseFlowSSEChatOptions {
  onNewChatCreated?: (chatId: string) => void;
}

export function useFlowSSEChat(initialChatId?: string, options?: UseFlowSSEChatOptions) {
  const [flowState, setFlowState] = useState<FlowConversationState>({
    nodes: [],
    edges: [],
    modelNodes: [],
    userMessage: "",
    isStreaming: false,
    chatId: initialChatId,
    conversationRound: 0,
    rounds: [],
    branchPoints: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate horizontal offset for branching (alternate left/right)
  const getBranchOffset = (round: number) => {
    if (round === 0) return 0;
    const direction = round % 2 === 0 ? 1 : -1; // Even = right, odd = left
    return direction * 150; // 150px offset
  };

  // Calculate node positions for a given round
  const calculateNodePositions = (modelCount: number, round: number) => {
    const spacing = 300;
    const branchOffset = getBranchOffset(round);
    const startX = modelCount > 1 ? -((modelCount - 1) * spacing) / 2 : 0;
    const baseY = round * 500;
    
    return Array.from({ length: modelCount }, (_, i) => ({
      x: startX + i * spacing + branchOffset,
      y: baseY + 200,
    }));
  };

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setFlowState((state) => ({
        ...state,
        nodes: applyNodeChanges(changes, state.nodes),
      }));
    },
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setFlowState((state) => ({
        ...state,
        edges: applyEdgeChanges(changes, state.edges),
      }));
    },
    []
  );

  const startStreaming = useCallback(
    async (message: string, existingChatId?: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Determine if this is a continuation (has previous nodes)
      const isContinuation = flowState.nodes.length > 0;
      const previousFinalNode = flowState.nodes.find(n => n.type === "finalAnswer");
      const currentRound = isContinuation ? flowState.conversationRound + 1 : 0;
      const baseY = currentRound * 500;
      const branchOffset = getBranchOffset(currentRound);

      // Create new prompt node
      const promptNodeId = `prompt-r${currentRound}`;
      const promptNode: Node = {
        id: promptNodeId,
        type: "userPrompt",
        position: { x: branchOffset, y: baseY + 50 },
        data: { message },
      };

      // Build new nodes and edges
      let newNodes: Node[] = [promptNode];
      let newEdges: Edge[] = [];

      if (isContinuation && previousFinalNode) {
        // Create edge from previous final answer to new prompt (same style as other edges)
        newEdges = [{
          id: `edge-${previousFinalNode.id}-to-${promptNodeId}`,
          source: previousFinalNode.id,
          target: promptNodeId,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#6366f1", strokeWidth: 2 },
        }];
      }

      // Keep existing nodes/edges and add new ones
      const existingNodes = isContinuation ? flowState.nodes : [];
      const existingEdges = isContinuation ? flowState.edges : [];

      // Add new round data
      const newRounds = [...flowState.rounds, { prompt: message, modelNodes: [], finalResponse: undefined }];

      setFlowState(prev => ({
        ...prev,
        nodes: [...existingNodes, ...newNodes],
        edges: [...existingEdges, ...newEdges],
        modelNodes: [], // Reset model nodes for new round
        userMessage: message,
        isStreaming: true,
        conversationRound: currentRound,
        rounds: newRounds,
      }));

      // Use provided chatId, or existing chatId from state
      const chatIdToUse = existingChatId || flowState.chatId;
      const endpoint = chatIdToUse ? "/api/v1/chats" : "/api/v1/chats/new";
      const body = chatIdToUse
        ? { message, chat_id: chatIdToUse }
        : { message };

      try {
        await sseService.createStream(
          endpoint,
          body,
          {
            onLLMResponse: (data: LLMResponseEvent) => {
              setFlowState((prev) => {
                const existingModelIndex = prev.modelNodes.findIndex(
                  (node) => node.model === data.model
                );

                let updatedModelNodes: ModelNode[];
                if (existingModelIndex >= 0) {
                  updatedModelNodes = [...prev.modelNodes];
                  updatedModelNodes[existingModelIndex] = {
                    ...updatedModelNodes[existingModelIndex],
                    status: "completed",
                    response: data.response,
                    topic: data.topic,
                    prompt: data.prompt,
                  };
                } else {
                  updatedModelNodes = [
                    ...prev.modelNodes,
                    {
                      model: data.model,
                      status: "completed",
                      response: data.response,
                      topic: data.topic,
                      prompt: data.prompt,
                    },
                  ];
                }

                // Update round data
                const updatedRounds = [...prev.rounds];
                if (updatedRounds[prev.conversationRound]) {
                  updatedRounds[prev.conversationRound] = {
                    ...updatedRounds[prev.conversationRound],
                    modelNodes: updatedModelNodes,
                  };
                }

                // Calculate positions for model nodes in current round
                const positions = calculateNodePositions(updatedModelNodes.length, prev.conversationRound);
                const currentPromptId = `prompt-r${prev.conversationRound}`;

                // Create new model nodes for this round with unique IDs
                const modelFlowNodes: Node[] = updatedModelNodes.map((node, idx) => ({
                  id: `model-${node.model}-r${prev.conversationRound}`,
                  type: "modelResponse",
                  position: positions[idx],
                  data: {
                    model: node.model,
                    status: node.status,
                    hasResponse: !!node.response,
                  },
                }));

                // Create edges from current prompt to models with unique IDs
                const modelEdges: Edge[] = updatedModelNodes.map((node) => ({
                  id: `edge-${currentPromptId}-to-model-${node.model}-r${prev.conversationRound}`,
                  source: currentPromptId,
                  target: `model-${node.model}-r${prev.conversationRound}`,
                  type: "smoothstep",
                  animated: node.status === "generating",
                }));

                // Keep nodes that are NOT model nodes from this round
                const nonModelNodes = prev.nodes.filter(n => 
                  !n.id.startsWith(`model-`) || !n.id.endsWith(`-r${prev.conversationRound}`)
                );
                
                // Keep edges that are NOT prompt-to-model edges from this round
                const nonModelEdges = prev.edges.filter(e => 
                  !e.id.startsWith(`edge-${currentPromptId}-to-model-`)
                );

                return {
                  ...prev,
                  modelNodes: updatedModelNodes,
                  nodes: [...nonModelNodes, ...modelFlowNodes],
                  edges: [...nonModelEdges, ...modelEdges],
                  rounds: updatedRounds,
                };
              });
            },
            onLLMVote: (data: LLMVoteEvent) => {
              setFlowState((prev) => {
                const updatedModelNodes = prev.modelNodes.map((node) => ({
                  ...node,
                  status: node.status === "completed" ? ("voting" as const) : node.status,
                }));

                const branchOffset = getBranchOffset(prev.conversationRound);
                const modelFlowNodes: Node[] = updatedModelNodes.map((node) => {
                  const nodeId = `model-${node.model}-r${prev.conversationRound}`;
                  const existingNode = prev.nodes.find((n) => n.id === nodeId);
                  return {
                    id: nodeId,
                    type: "modelResponse",
                    position: existingNode?.position || { x: branchOffset, y: prev.conversationRound * 500 + 200 },
                    data: {
                      model: node.model,
                      status: node.status,
                      hasResponse: !!node.response,
                    },
                  };
                });

                // Update round data
                const updatedRounds = [...prev.rounds];
                if (updatedRounds[prev.conversationRound]) {
                  updatedRounds[prev.conversationRound] = {
                    ...updatedRounds[prev.conversationRound],
                    modelNodes: updatedModelNodes,
                  };
                }

                // Keep all non-model nodes for this round
                const otherNodes = prev.nodes.filter(n => 
                  !n.id.startsWith(`model-`) || !n.id.endsWith(`-r${prev.conversationRound}`)
                );

                return {
                  ...prev,
                  modelNodes: updatedModelNodes,
                  nodes: [...otherNodes, ...modelFlowNodes],
                  rounds: updatedRounds,
                };
              });
            },
            onVoteResponse: (data: VoteResponseEvent) => {
              setFlowState((prev) => {
                const updatedModelNodes = prev.modelNodes.map((node) => ({
                  ...node,
                  status:
                    node.model === data.model
                      ? ("winner" as const)
                      : ("completed" as const),
                }));

                const branchOffset = getBranchOffset(prev.conversationRound);
                const modelFlowNodes: Node[] = updatedModelNodes.map((node) => {
                  const nodeId = `model-${node.model}-r${prev.conversationRound}`;
                  const existingNode = prev.nodes.find((n) => n.id === nodeId);
                  return {
                    id: nodeId,
                    type: "modelResponse",
                    position: existingNode?.position || { x: branchOffset, y: prev.conversationRound * 500 + 200 },
                    data: {
                      model: node.model,
                      status: node.status,
                      hasResponse: !!node.response,
                    },
                  };
                });

                // Create final answer node for this round
                const finalNodeId = `final-r${prev.conversationRound}`;
                const finalNode: Node = {
                  id: finalNodeId,
                  type: "finalAnswer",
                  position: { x: branchOffset, y: prev.conversationRound * 500 + 350 },
                  data: {
                    model: data.model,
                    topic: data.topic,
                  },
                };

                // Create edges from models to final with unique IDs
                const finalEdges: Edge[] = updatedModelNodes.map((node) => ({
                  id: `edge-model-${node.model}-r${prev.conversationRound}-to-${finalNodeId}`,
                  source: `model-${node.model}-r${prev.conversationRound}`,
                  target: finalNodeId,
                  type: "smoothstep",
                  animated: false,
                  style: {
                    stroke: node.status === "winner" ? "#eab308" : "#94a3b8",
                    strokeWidth: node.status === "winner" ? 3 : 2,
                  },
                }));

                // Update round data with final response
                const updatedRounds = [...prev.rounds];
                if (updatedRounds[prev.conversationRound]) {
                  updatedRounds[prev.conversationRound] = {
                    ...updatedRounds[prev.conversationRound],
                    modelNodes: updatedModelNodes,
                    finalResponse: data,
                  };
                }

                // Keep all non-model nodes for this round
                const otherNodes = prev.nodes.filter(n => 
                  !n.id.startsWith(`model-`) || !n.id.endsWith(`-r${prev.conversationRound}`)
                );

                return {
                  ...prev,
                  modelNodes: updatedModelNodes,
                  finalResponse: data,
                  isStreaming: false,
                  nodes: [...otherNodes, ...modelFlowNodes, finalNode],
                  edges: [...prev.edges, ...finalEdges],
                  rounds: updatedRounds,
                };
              });
            },
            onChatId: (data: { chat_id: string }) => {
              // Capture the chat_id from the backend
              setFlowState((prev) => ({
                ...prev,
                chatId: data.chat_id,
              }));
              // Call the callback to notify that a new chat was created
              options?.onNewChatCreated?.(data.chat_id);
            },
            onError: (data: { error: string }) => {
              setFlowState((prev) => ({
                ...prev,
                error: data.error,
                isStreaming: false,
              }));
            },
            onComplete: () => {
              setFlowState((prev) => ({
                ...prev,
                isStreaming: false,
              }));
            },
          },
          abortControllerRef.current.signal
        );
      } catch (error: any) {
        setFlowState((prev) => ({
          ...prev,
          error: error.message || "Failed to start stream",
          isStreaming: false,
        }));
      }
    },
    [flowState.nodes, flowState.edges, flowState.chatId, flowState.conversationRound, flowState.rounds]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setFlowState((prev) => ({
        ...prev,
        isStreaming: false,
      }));
    }
  }, []);

  const resetConversation = useCallback(() => {
    cancelStream();
    setFlowState({
      nodes: [],
      edges: [],
      modelNodes: [],
      userMessage: "",
      isStreaming: false,
      conversationRound: 0,
      rounds: [],
      branchPoints: [],
    });
  }, [cancelStream]);

  // Helper to get round data from a node ID
  const getRoundFromNodeId = (nodeId: string): number => {
    const match = nodeId.match(/-r(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Add a branch point visualization when branching from a model response
  const addBranchPoint = useCallback(
    (
      sourceModelNodeId: string,
      branchId: string,
      model: string,
      response: string
    ) => {
      setFlowState((prev) => {
        // Find the source model node to get its position
        const sourceNode = prev.nodes.find((n) => n.id === sourceModelNodeId);
        if (!sourceNode) return prev;

        const round = getRoundFromNodeId(sourceModelNodeId);
        const branchCount = prev.branchPoints.length;
        
        // Calculate offset for new branch - alternate left/right with increasing distance
        const direction = branchCount % 2 === 0 ? -1 : 1;
        const offsetMultiplier = Math.floor(branchCount / 2) + 1;
        const branchOffset = direction * 350 * offsetMultiplier;

        // Create a branch node (visual indicator of the branch point)
        const branchNodeId = `branch-${branchId}-from-${sourceModelNodeId}`;
        const branchNodePosition = {
          x: sourceNode.position.x + branchOffset,
          y: sourceNode.position.y + 100,
        };

        const branchNode: Node = {
          id: branchNodeId,
          type: "modelResponse",
          position: branchNodePosition,
          data: {
            model: model,
            status: "winner",
            hasResponse: true,
            isBranchPoint: true,
          },
        };

        // Create edge from source model to branch node with distinct styling
        const branchEdge: Edge = {
          id: `edge-branch-${sourceModelNodeId}-to-${branchNodeId}`,
          source: sourceModelNodeId,
          target: branchNodeId,
          type: "smoothstep",
          animated: true,
          style: {
            stroke: "#8b5cf6", // Purple for branches
            strokeWidth: 2,
            strokeDasharray: "5,5",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#8b5cf6",
          },
        };

        // Track the branch point
        const newBranchPoint: BranchPoint = {
          nodeId: branchNodeId,
          model,
          roundIndex: round,
          branchId,
          position: branchNodePosition,
        };

        return {
          ...prev,
          nodes: [...prev.nodes, branchNode],
          edges: [...prev.edges, branchEdge],
          branchPoints: [...prev.branchPoints, newBranchPoint],
        };
      });
    },
    []
  );

  return {
    flowState,
    onNodesChange,
    onEdgesChange,
    startStreaming,
    cancelStream,
    resetConversation,
    getRoundFromNodeId,
    addBranchPoint,
  };
}
