"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";

interface UserPromptNodeProps {
  data: {
    message: string;
  };
}

function UserPromptNodeComponent({ data }: UserPromptNodeProps) {
  return (
    <div className="min-w-[300px] max-w-[400px] rounded-lg border-2 border-gray-700 bg-gray-900 p-4 shadow-lg">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Your Question
      </div>
      <div className="text-sm leading-relaxed text-white">
        {data.message}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-3 w-3 border-2 border-gray-700 bg-gray-500"
      />
    </div>
  );
}

export const UserPromptNode = memo(UserPromptNodeComponent);
