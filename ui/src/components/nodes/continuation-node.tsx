"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";

function ContinuationNodeComponent() {
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-400 shadow-md">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-0 !bg-transparent"
        style={{ top: -4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-0 !bg-transparent"
        style={{ bottom: -4 }}
      />
    </div>
  );
}

export const ContinuationNode = memo(ContinuationNodeComponent);
