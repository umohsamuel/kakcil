"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Crown } from "lucide-react";

interface FinalAnswerNodeProps {
  data: {
    model: string;
    topic?: string;
  };
}

function FinalAnswerNodeComponent({ data }: FinalAnswerNodeProps) {
  return (
    <div className="min-w-[300px] rounded-lg border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 p-4 shadow-xl dark:from-yellow-950/40 dark:to-amber-950/40">
      <Handle
        type="target"
        position={Position.Top}
        className="h-3 w-3 border-2 border-yellow-500 bg-yellow-400"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <Crown className="h-5 w-5 text-yellow-600" />
        <div className="text-base font-bold text-gray-900 dark:text-gray-100">
          Final Answer
        </div>
      </div>
      
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Winner: <span className="font-semibold">{data.model}</span>
      </div>
      
      {data.topic && (
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          Topic: {data.topic}
        </div>
      )}
    </div>
  );
}

export const FinalAnswerNode = memo(FinalAnswerNodeComponent);
