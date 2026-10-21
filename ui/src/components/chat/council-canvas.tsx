"use client";

import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import type { CouncilNodeData } from "@/lib/chat-graph-layout";
import { PromptNode } from "./nodes/prompt-node";
import { ResponseNode } from "./nodes/response-node";
import { AnswerNode } from "./nodes/answer-node";

const nodeTypes: NodeTypes = {
  prompt: PromptNode,
  response: ResponseNode,
  answer: AnswerNode,
};

const FIT_OPTIONS = { padding: 0.25, maxZoom: 1, duration: 450 };

interface CouncilCanvasProps {
  nodes: Node<CouncilNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  onSelect: (node: Node<CouncilNodeData> | null) => void;
  focusNodeIds: string[];
  showMinimap?: boolean;
}

function minimapClass(node: Node) {
  return `minimap-node minimap-node-${node.type}`;
}

function CanvasInner({
  nodes,
  edges,
  selectedNodeId,
  onSelect,
  focusNodeIds,
  showMinimap = true,
}: CouncilCanvasProps) {
  const { fitView } = useReactFlow();

  const renderedNodes = useMemo(
    () =>
      selectedNodeId
        ? nodes.map((node) =>
            node.id === selectedNodeId ? { ...node, selected: true } : node
          )
        : nodes,
    [nodes, selectedNodeId]
  );

  const focusSignature = focusNodeIds.join("|");

  useEffect(() => {
    if (!focusSignature) return;
    const handle = window.setTimeout(() => {
      fitView({
        ...FIT_OPTIONS,
        nodes: focusSignature.split("|").map((id) => ({ id })),
      });
    }, 60);
    return () => window.clearTimeout(handle);
  }, [focusSignature, fitView]);

  return (
    <ReactFlow
      nodes={renderedNodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => onSelect(node)}
      onPaneClick={() => onSelect(null)}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      onlyRenderVisibleElements
      minZoom={0.15}
      maxZoom={1.75}
      fitView
      fitViewOptions={{
        ...FIT_OPTIONS,
        duration: 0,
        nodes: focusNodeIds.length
          ? focusNodeIds.map((id) => ({ id }))
          : undefined,
      }}
      className="bg-canvas"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={22}
        size={1}
        color="var(--canvas-dot)"
      />
      <Controls
        showInteractive={false}
        position="bottom-left"
        className="hidden! md:flex!"
      />
      {showMinimap && (
        <MiniMap
          pannable
          zoomable
          nodeClassName={minimapClass}
          maskColor="transparent"
          className="hidden! lg:block!"
        />
      )}
    </ReactFlow>
  );
}

export function CouncilCanvas(props: CouncilCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
