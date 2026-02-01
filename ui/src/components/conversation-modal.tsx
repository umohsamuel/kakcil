"use client";
import { ModelNode } from "@/types/chat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarkdownMessage } from "@/components/markdown-message";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: ModelNode | null;
  userMessage: string;
}
export function ConversationModal({
  isOpen,
  onClose,
  node,
  userMessage,
}: ConversationModalProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (node?.response) {
      await navigator.clipboard.writeText(node.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    }
  };
  if (!node) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">
            {node.model}{" "}
            {node.status === "winner" && (
              <span className="ml-2 text-sm font-semibold text-yellow-600">
                🏆 Winner
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {/* User Message */}
          <div className="flex items-start gap-3 justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-black px-6 py-4 text-white">
              <div className="leading-relaxed whitespace-pre-wrap">
                {userMessage}
              </div>
            </div>
          </div>
          {/* Model Response */}
          {node.response && (
            <div className="group w-full">
              <div className="font-mono text-base">
                <MarkdownMessage content={node.response} />
              </div>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Response
                  </>
                )}
              </Button>
            </div>
          )}
          {/* Metadata */}
          {node.topic && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Topic:</span> {node.topic}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
