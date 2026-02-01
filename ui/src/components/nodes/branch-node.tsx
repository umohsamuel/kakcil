"use client";
import { memo } from "react";
import { Handle, Position } from "reactflow";
import { GitBranch, ArrowRight } from "lucide-react";

interface BranchNodeProps {
  data: { branchId: string; branchName: string; model: string; parentPrompt?: string; isClickable?: boolean };
  selected?: boolean;
}

function BranchNodeComponent({ data, selected }: BranchNodeProps) {
  return (
    <div className={`relative min-w-[200px] rounded-xl border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 p-4 shadow-lg transition-all dark:from-purple-950/40 dark:to-violet-950/40 ${
      selected ? "ring-2 ring-purple-500 ring-offset-2" : ""
    } cursor-pointer hover:shadow-xl`}>
      <Handle type="target" position={Position.Left} id="left" className="h-3 w-3 border-2 border-purple-500 bg-purple-300" />
      <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 shadow-md">
        <GitBranch className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-purple-600" />
        <span className="text-xs font-bold uppercase tracking-wide text-purple-700 dark:text-purple-400">Branch</span>
      </div>
      <div className="mt-2 font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
        {data.branchName || `From ${data.model}`}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
        <span>Click to view</span>
        <ArrowRight className="h-3 w-3" />
      </div>
      <Handle type="source" position={Position.Bottom} id="bottom" className="h-3 w-3 border-2 border-purple-500 bg-purple-300" />
    </div>
  );
}

export const BranchNode = memo(BranchNodeComponent);
