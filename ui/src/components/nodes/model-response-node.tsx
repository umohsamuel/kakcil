"use client";
import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Loader2, Sparkles, Crown, GitBranch } from "lucide-react";
import { ModelNodeStatus } from "@/types/chat";

interface ModelResponseNodeProps {
  data: { model: string; status: ModelNodeStatus; hasResponse: boolean; isBranchPoint?: boolean };
  selected?: boolean;
}

function ModelResponseNodeComponent({ data, selected }: ModelResponseNodeProps) {
  const getStatusStyles = () => {
    if (data.isBranchPoint) return "border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40";
    switch (data.status) {
      case "generating": return "border-blue-500 bg-blue-50 dark:bg-blue-950/30";
      case "completed": return "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800";
      case "voting": return "border-amber-400 bg-amber-50 dark:bg-amber-950/30";
      case "winner": return "border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40";
      default: return "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800";
    }
  };

  const getStatusIcon = () => {
    if (data.isBranchPoint) return <GitBranch className="h-4 w-4 text-purple-600" />;
    switch (data.status) {
      case "generating": return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case "voting": return <Sparkles className="h-4 w-4 animate-pulse text-amber-600" />;
      case "winner": return <Crown className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  return (
    <div className={`relative min-w-[180px] rounded-lg border-2 p-4 shadow-lg transition-all ${getStatusStyles()} ${
      selected ? "ring-2 ring-blue-500 ring-offset-2" : ""
    } ${data.hasResponse ? "cursor-pointer hover:shadow-xl" : ""}`}>
      <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-gray-400 bg-gray-200" />
      {data.isBranchPoint && (
        <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 shadow-md">
          <GitBranch className="h-3 w-3 text-white" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">{data.model}</div>
        {getStatusIcon()}
      </div>
      {data.isBranchPoint && <div className="mt-1 text-xs font-semibold text-purple-700 dark:text-purple-400">Branch Point</div>}
      {data.status === "winner" && !data.isBranchPoint && <div className="mt-1 text-xs font-semibold text-yellow-700 dark:text-yellow-600">Best Answer</div>}
      {data.status === "generating" && <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">Generating...</div>}
      {data.status === "voting" && <div className="mt-1 text-xs text-amber-600 dark:text-amber-500">Voting...</div>}
      <Handle type="source" position={Position.Bottom} id="bottom" className="h-3 w-3 border-2 border-gray-400 bg-gray-200" />
      <Handle type="source" position={Position.Right} id="branch" className="h-3 w-3 border-2 border-purple-400 bg-purple-200" />
    </div>
  );
}

export const ModelResponseNode = memo(ModelResponseNodeComponent);
