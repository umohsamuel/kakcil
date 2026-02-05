"use client";

import { GitBranch } from "lucide-react";
import { MarkdownMessage } from "@/components/markdown-message";

interface BranchInfo {
  branch?: {
    id: string;
    branch_name?: string | null;
  };
  parentMessage?: {
    id: string;
    content: string;
  };
  parentResponse?: {
    id: string;
    model: string;
    content: string;
  };
}

interface BranchContextPanelProps {
  branchInfo: BranchInfo;
}

export function BranchContextPanel({ branchInfo }: BranchContextPanelProps) {
  if (!branchInfo.parentMessage && !branchInfo.parentResponse) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-purple-300 bg-purple-50/50 p-4 dark:border-purple-700 dark:bg-purple-950/30">
      <div className="mb-3 flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <span className="text-xs font-semibold tracking-wide text-purple-600 uppercase dark:text-purple-400">
          Branched From {branchInfo.branch?.branch_name || "Parent Chat"}
        </span>
      </div>
      
      {/* Original Question */}
      {branchInfo.parentMessage && (
        <div className="mb-3">
          <div className="mb-1 text-xs text-purple-600/80 dark:text-purple-400/80">
            Original Question:
          </div>
          <div className="rounded-lg bg-white/80 px-3 py-2 text-sm dark:bg-gray-800/80">
            {branchInfo.parentMessage.content}
          </div>
        </div>
      )}
      
      {/* Response that was branched from */}
      {branchInfo.parentResponse && (
        <div>
          <div className="mb-1 text-xs text-purple-600/80 dark:text-purple-400/80">
            Branched from {branchInfo.parentResponse.model}&apos;s response:
          </div>
          <div className="max-h-32 overflow-y-auto rounded-lg bg-white/80 px-3 py-2 text-sm dark:bg-gray-800/80">
            <MarkdownMessage content={branchInfo.parentResponse.content} />
          </div>
        </div>
      )}
    </div>
  );
}
