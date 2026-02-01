"use client";
import { memo } from "react";
import { Handle, Position } from "reactflow";

interface UserPromptNodeProps {
  data: { message: string; isBranchStart?: boolean };
}

function UserPromptNodeComponent({ data }: UserPromptNodeProps) {
  return (
    <div className={`min-w-[300px] max-w-[400px] rounded-lg border-2 p-4 shadow-lg ${
      data.isBranchStart ? "border-purple-600 bg-purple-950" : "border-gray-700 bg-gray-900"
    }`}>
      <Handle type="target" position={Position.Top} id="top" className="h-3 w-3 border-2 border-gray-700 bg-gray-500" />
      <Handle type="target" position={Position.Left} id="branch" className="h-3 w-3 border-2 border-purple-500 bg-purple-300" />
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {data.isBranchStart ? "Branch Question" : "Your Question"}
      </div>
      <div className="text-sm leading-relaxed text-white">{data.message}</div>
      <Handle type="source" position={Position.Bottom} id="bottom" className="h-3 w-3 border-2 border-gray-700 bg-gray-500" />
    </div>
  );
}

export const UserPromptNode = memo(UserPromptNodeComponent);
