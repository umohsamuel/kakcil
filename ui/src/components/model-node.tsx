"use client";

import { ModelNode } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Sparkles, Crown, Loader2 } from "lucide-react";

interface ModelNodeComponentProps {
  node: ModelNode;
  onClick: () => void;
  index: number;
  total: number;
}

export function ModelNodeComponent({
  node,
  onClick,
  index,
  total,
}: ModelNodeComponentProps) {
  // Calculate position in a circle
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 35; // percentage
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);

  const getStatusColor = () => {
    switch (node.status) {
      case "generating":
        return "bg-blue-500 border-blue-400 shadow-blue-500/50";
      case "completed":
        return "bg-purple-500 border-purple-400 shadow-purple-500/50";
      case "voting":
        return "bg-amber-500 border-amber-400 shadow-amber-500/50";
      case "winner":
        return "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 shadow-yellow-500/70";
      default:
        return "bg-gray-500 border-gray-400 shadow-gray-500/30";
    }
  };

  const getStatusIcon = () => {
    switch (node.status) {
      case "generating":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "voting":
        return <Sparkles className="h-4 w-4 animate-pulse" />;
      case "winner":
        return <Crown className="h-5 w-5 text-yellow-100" />;
      default:
        return null;
    }
  };

  const shouldAnimate = node.status === "generating" || node.status === "voting";

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      <button
        onClick={onClick}
        disabled={!node.response}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all duration-300 hover:scale-110 disabled:cursor-default disabled:hover:scale-100",
          getStatusColor(),
          shouldAnimate && "animate-pulse shadow-2xl",
          node.response && "cursor-pointer hover:shadow-2xl"
        )}
        style={{
          minWidth: "120px",
          minHeight: "120px",
        }}
      >
        {/* Status icon */}
        <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg">
          {getStatusIcon()}
        </div>

        {/* Model name */}
        <div className="text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            {node.model}
          </p>
          
          {node.status === "winner" && (
            <p className="mt-1 text-[10px] font-semibold text-yellow-100">
              Best Answer
            </p>
          )}
          
          {node.status === "generating" && (
            <p className="mt-1 text-[10px] text-white/80">
              Generating...
            </p>
          )}
          
          {node.status === "voting" && (
            <p className="mt-1 text-[10px] text-white/80">
              Voting...
            </p>
          )}
        </div>
      </button>
    </div>
  );
}
