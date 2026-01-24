"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Loader2, Sparkles, Crown } from "lucide-react";
import { ModelNodeStatus } from "@/types/chat";

interface ModelResponseNodeProps {
  data: {
    model: string;
    status: ModelNodeStatus;
    hasResponse: boolean;
  };
  selected?: boolean;
}

function ModelResponseNodeComponent({ data, selected }: ModelResponseNodeProps) {
  const getStatusStyles = () => {
    switch (data.status) {
      case "generating":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950/30";
      case "completed":
        return "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800";
      case "voting":
        return "border-amber-400 bg-amber-50 dark:bg-amber-950/30";
      case "winner":
        return "border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40";
      default:
        return "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800";
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case "generating":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case "voting":
        return <Sparkles className="h-4 w-4 animate-pulse text-amber-600" />;
      case "winner":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 p-4 shadow-lg transition-all ${getStatusStyles()} ${
        selected ? "ring-2 ring-blue-500 ring-offset-2" : ""
      } ${data.hasResponse ? "cursor-pointer hover:shadow-xl" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-3 w-3 border-2 border-gray-400 bg-gray-200"
      />
      
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">
          {data.model}
        </div>
        {getStatusIcon()}
      </div>
      
      {data.status === "winner" && (
        <div className="mt-1 text-xs font-semibold text-yellow-700 dark:text-yellow-600">
          Best Answer
        </div>
      )}
      
      {data.status === "generating" && (
        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
          Generating...
        </div>
      )}
      
      {data.status === "voting" && (
        <div className="mt-1 text-xs text-amber-600 dark:text-amber-500">
          Voting...
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-3 w-3 border-2 border-gray-400 bg-gray-200"
      />
    </div>
  );
}

export const ModelResponseNode = memo(ModelResponseNodeComponent);
