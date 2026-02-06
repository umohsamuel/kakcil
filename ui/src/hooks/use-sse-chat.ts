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
  parentPrompt?: string;
  parentResponse?: string;
}

export interface FlowConversationState {
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
    async (message: string, existingChatId?: string, branchId?: string) => {
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
        error: undefined, // Clear any previous error
        conversationRound: currentRound,
        rounds: newRounds,
      }));

      // Use provided chatId, or existing chatId from state
      const chatIdToUse = existingChatId || flowState.chatId;
      const endpoint = chatIdToUse ? "/api/v1/chats" : "/api/v1/chats/new";
      const body = chatIdToUse
        ? { message, chat_id: chatIdToUse, branch_id: branchId }
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
            onLLMPartial: (data: { model: string; partial: string; topic?: string }) => {
              setFlowState((prev) => {
                const existingModelIndex = prev.modelNodes.findIndex(
                  (node) => node.model === data.model
                );

                let updatedModelNodes: ModelNode[];
                if (existingModelIndex >= 0) {
                  // Update existing model with partial response
                  updatedModelNodes = [...prev.modelNodes];
                  updatedModelNodes[existingModelIndex] = {
                    ...updatedModelNodes[existingModelIndex],
                    status: "generating",
                    response: data.partial,
                    topic: data.topic,
                  };
                } else {
                  // Add new model node with partial response
                  updatedModelNodes = [
                    ...prev.modelNodes,
                    {
                      model: data.model,
                      status: "generating",
                      response: data.partial,
                      topic: data.topic,
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

                // Create model nodes for this round
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

                // Create edges from current prompt to models
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
      response: string,
      parentPrompt?: string,
      branchName?: string,
      branchMessage?: string // The message that starts the branch
    ) => {
      setFlowState((prev) => {
        // Find the source model node to get its position
        const sourceNode = prev.nodes.find((n) => n.id === sourceModelNodeId);
        if (!sourceNode) return prev;

        const round = getRoundFromNodeId(sourceModelNodeId);
        
        // Count existing branches from this node to offset vertically
        const existingBranches = prev.branchPoints.filter(bp => 
          bp.nodeId.includes(`from-${sourceModelNodeId}`)
        ).length;
        
        // Position branch to the RIGHT of the source node
        const branchNodeId = `branch-${branchId}-from-${sourceModelNodeId}`;
        const branchNodePosition = {
          x: sourceNode.position.x + 280, // 280px to the right
          y: sourceNode.position.y + (existingBranches * 150), // Stack vertically if multiple
        };

        // Create the branch indicator node
        const branchNode: Node = {
          id: branchNodeId,
          type: "branch",
          position: branchNodePosition,
          data: {
            branchId,
            branchName: branchName || `${model} Branch`,
            model,
            parentPrompt,
            isClickable: true,
          },
        };

        // Create edge from source model's right handle to branch node's left handle
        const branchEdge: Edge = {
          id: `edge-branch-${sourceModelNodeId}-to-${branchNodeId}`,
          source: sourceModelNodeId,
          sourceHandle: "branch", // ModelResponseNode right handle id
          target: branchNodeId,
          targetHandle: "left", // BranchNode left handle id
          type: "smoothstep",
          animated: true,
          style: {
            stroke: "#8b5cf6",
            strokeWidth: 3,
            strokeDasharray: "5,5",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#8b5cf6",
            width: 20,
            height: 20,
          },
        };

        // Create the user prompt node for the branch (connected below the branch node)
        const userPromptNodeId = `branch-prompt-${branchId}`;
        const userPromptPosition = {
          x: branchNodePosition.x,
          y: branchNodePosition.y + 120, // Below the branch node
        };

        const userPromptNode: Node = {
          id: userPromptNodeId,
          type: "userPrompt",
          position: userPromptPosition,
          data: {
            message: branchMessage || "Continue from this response",
            isBranchStart: true,
          },
        };

        // Edge from branch node to user prompt node
        const branchToPromptEdge: Edge = {
          id: `edge-${branchNodeId}-to-${userPromptNodeId}`,
          source: branchNodeId,
          sourceHandle: "bottom", // BranchNode bottom handle id
          target: userPromptNodeId,
          targetHandle: "top", // UserPromptNode top handle id
          type: "smoothstep",
          animated: false,
          style: {
            stroke: "#8b5cf6",
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#8b5cf6",
            width: 16,
            height: 16,
          },
        };

        // Track the branch point with parent context
        const newBranchPoint: BranchPoint = {
          nodeId: branchNodeId,
          model,
          roundIndex: round,
          branchId,
          position: branchNodePosition,
          parentPrompt,
          parentResponse: response,
        };

        return {
          ...prev,
          nodes: [...prev.nodes, branchNode, userPromptNode],
          edges: [...prev.edges, branchEdge, branchToPromptEdge],
          branchPoints: [...prev.branchPoints, newBranchPoint],
        };
      });
    },
    []
  );

  // Build flow nodes/edges from historical messages with council responses
  const buildFlowFromMessages = useCallback(
    (messages: { 
      id: string; 
      role: string; 
      content: string; 
      stored_council_responses?: Array<{
        id: string;
        model: string;
        content: string;
        is_winner: boolean;
        votes_received?: number;
      }>;
    }[]) => {
      const nodes: Node[] = [];
      const edges: Edge[] = [];
      const rounds: RoundData[] = [];
      let roundIndex = 0;

      // Group messages into user-assistant pairs
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        
        if (message.role === "user") {
          const baseY = roundIndex * 500;
          const promptNodeId = `prompt-r${roundIndex}`;
          
          // Create user prompt node
          nodes.push({
            id: promptNodeId,
            type: "userPrompt",
            position: { x: 0, y: baseY + 50 },
            data: { message: message.content },
          });

          // Connect from previous final answer if exists
          if (roundIndex > 0) {
            const prevFinalId = `final-r${roundIndex - 1}`;
            edges.push({
              id: `edge-${prevFinalId}-to-${promptNodeId}`,
              source: prevFinalId,
              target: promptNodeId,
              type: "smoothstep",
              animated: false,
              style: { stroke: "#6366f1", strokeWidth: 2 },
            });
          }

          // Find the next assistant message
          const assistantMsg = messages[i + 1];
          if (assistantMsg?.role === "assistant") {
            const councilResponses = message.stored_council_responses || [];
            const modelNodes: ModelNode[] = [];
            
            if (councilResponses.length > 0) {
              // Create model response nodes from council responses
              const spacing = 300;
              const startX = councilResponses.length > 1 
                ? -((councilResponses.length - 1) * spacing) / 2 
                : 0;

              councilResponses.forEach((council, idx) => {
                const nodeId = `model-${council.model}-r${roundIndex}`;
                const isWinner = council.is_winner;
                
                modelNodes.push({
                  model: council.model,
                  status: isWinner ? "winner" : "completed",
                  response: council.content,
                  votes: council.votes_received,
                });

                nodes.push({
                  id: nodeId,
                  type: "modelResponse",
                  position: { x: startX + idx * spacing, y: baseY + 200 },
                  data: {
                    model: council.model,
                    status: isWinner ? "winner" : "completed",
                    hasResponse: true,
                    votes: council.votes_received,
                  },
                });

                // Edge from prompt to model
                edges.push({
                  id: `edge-${promptNodeId}-to-${nodeId}`,
                  source: promptNodeId,
                  target: nodeId,
                  type: "smoothstep",
                  animated: false,
                });
              });

              // Create final answer node
              const winningModel = councilResponses.find(c => c.is_winner)?.model || councilResponses[0]?.model;
              const finalNodeId = `final-r${roundIndex}`;
              
              nodes.push({
                id: finalNodeId,
                type: "finalAnswer",
                position: { x: 0, y: baseY + 350 },
                data: {
                  model: winningModel,
                  topic: "",
                },
              });

              // Edges from models to final
              councilResponses.forEach((council) => {
                edges.push({
                  id: `edge-model-${council.model}-r${roundIndex}-to-${finalNodeId}`,
                  source: `model-${council.model}-r${roundIndex}`,
                  target: finalNodeId,
                  type: "smoothstep",
                  animated: false,
                  style: {
                    stroke: council.is_winner ? "#eab308" : "#94a3b8",
                    strokeWidth: council.is_winner ? 3 : 2,
                  },
                });
              });

              // Store round data
              rounds.push({
                prompt: message.content,
                modelNodes,
                finalResponse: {
                  prompt: message.content,
                  model: winningModel || "",
                  topic: "",
                  response: assistantMsg.content,
                },
              });
            } else {
              // No council responses - create simple flow
              rounds.push({
                prompt: message.content,
                modelNodes: [],
                finalResponse: {
                  prompt: message.content,
                  model: "assistant",
                  topic: "",
                  response: assistantMsg.content,
                },
              });
            }

            roundIndex++;
            i++; // Skip the assistant message as we've processed it
          }
        }
      }

      return { nodes, edges, rounds };
    },
    []
  );

  // Initialize flow state from historical messages
  // parentContext is used when viewing a branch - shows the parent message/response that started the branch
  const initializeFromMessages = useCallback(
    (messages: { 
      id: string; 
      role: string; 
      content: string; 
      stored_council_responses?: Array<{
        id: string;
        model: string;
        content: string;
        is_winner: boolean;
        votes_received?: number;
      }>;
    }[], chatId: string, parentContext?: {
      parentMessage?: { id: string; content: string };
      parentResponse?: { id: string; model: string; content: string };
    }) => {
      const { nodes, edges, rounds } = buildFlowFromMessages(messages);
      
      // If we have parent context (viewing a branch), prepend parent nodes
      let finalNodes = nodes;
      let finalEdges = edges;
      
      if (parentContext?.parentMessage && parentContext?.parentResponse) {
        // Create parent message node (positioned before the first branch node)
        const parentPromptNode: Node = {
          id: `parent-prompt-${parentContext.parentMessage.id}`,
          type: "userPrompt",
          position: { x: 0, y: -300 }, // Above the branch's first message
          data: {
            message: parentContext.parentMessage.content,
          },
        };

        // Create parent response node (the model response that was branched from)
        const parentResponseNode: Node = {
          id: `parent-response-${parentContext.parentResponse.id}`,
          type: "modelResponse",
          position: { x: 0, y: -180 },
          data: {
            model: parentContext.parentResponse.model,
            status: "completed",
            hasResponse: true,
            isBranchPoint: true,
          },
        };

        // Create branch indicator node
        const branchIndicatorNode: Node = {
          id: `branch-indicator`,
          type: "branch",
          position: { x: 280, y: -180 },
          data: {
            branchId: chatId,
            branchName: `${parentContext.parentResponse.model} Branch`,
            model: parentContext.parentResponse.model,
            parentPrompt: parentContext.parentMessage.content,
            isClickable: false, // Already viewing this branch
          },
        };

        // Edge from parent prompt to parent response
        const parentToResponseEdge: Edge = {
          id: `edge-parent-to-response`,
          source: parentPromptNode.id,
          sourceHandle: "bottom",
          target: parentResponseNode.id,
          type: "smoothstep",
          style: { stroke: "#94a3b8", strokeWidth: 2 },
        };

        // Edge from parent response to branch indicator
        const responseToBranchEdge: Edge = {
          id: `edge-response-to-branch`,
          source: parentResponseNode.id,
          sourceHandle: "branch",
          target: branchIndicatorNode.id,
          targetHandle: "left",
          type: "smoothstep",
          animated: true,
          style: {
            stroke: "#8b5cf6",
            strokeWidth: 3,
            strokeDasharray: "5,5",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#8b5cf6",
            width: 20,
            height: 20,
          },
        };

        // Edge from branch indicator to first branch message (if exists)
        const firstBranchNode = nodes[0];
        let branchToFirstEdge: Edge | null = null;
        if (firstBranchNode) {
          branchToFirstEdge = {
            id: `edge-branch-to-first`,
            source: branchIndicatorNode.id,
            sourceHandle: "bottom",
            target: firstBranchNode.id,
            targetHandle: "top",
            type: "smoothstep",
            style: {
              stroke: "#8b5cf6",
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#8b5cf6",
              width: 16,
              height: 16,
            },
          };
        }

        // Prepend parent nodes and edges
        finalNodes = [parentPromptNode, parentResponseNode, branchIndicatorNode, ...nodes];
        finalEdges = [
          parentToResponseEdge, 
          responseToBranchEdge, 
          ...(branchToFirstEdge ? [branchToFirstEdge] : []),
          ...edges
        ];
      }
      
      if (finalNodes.length > 0) {
        setFlowState({
          nodes: finalNodes,
          edges: finalEdges,
          modelNodes: rounds[rounds.length - 1]?.modelNodes || [],
          userMessage: rounds[rounds.length - 1]?.prompt || "",
          finalResponse: rounds[rounds.length - 1]?.finalResponse,
          isStreaming: false,
          chatId,
          conversationRound: rounds.length - 1,
          rounds,
          branchPoints: [],
        });
      }
    },
    [buildFlowFromMessages]
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
    buildFlowFromMessages,
    initializeFromMessages,
  };
}
