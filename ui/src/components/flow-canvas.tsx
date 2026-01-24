"use client";

import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

import { UserPromptNode } from "@/components/nodes/user-prompt-node";
import { ModelResponseNode } from "@/components/nodes/model-response-node";
import { FinalAnswerNode } from "@/components/nodes/final-answer-node";
import { ContinuationNode } from "@/components/nodes/continuation-node";

const nodeTypes: NodeTypes = {
  userPrompt: UserPromptNode,
  modelResponse: ModelResponseNode,
  finalAnswer: FinalAnswerNode,
  continuation: ContinuationNode,
};

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
}: FlowCanvasProps) {
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
          style: { strokeWidth: 2, stroke: "#94a3b8" },
        }}
        className="bg-gray-50 dark:bg-gray-950"
      >
        <Background
          gap={20}
          size={2}
          color="#94a3b8"
          className="opacity-60 dark:opacity-40"
        />
        <Controls
          className="rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
          showInteractive={false}
        />
        <MiniMap
          className="rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
          nodeColor={(node) => {
            if (node.type === "userPrompt") return "#1f2937";
            if (node.type === "finalAnswer") return "#fbbf24";
            return "#ffffff";
          }}
        />
      </ReactFlow>
    </div>
  );
}
