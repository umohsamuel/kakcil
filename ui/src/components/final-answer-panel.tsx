"use client";
import { VoteResponseEvent } from "@/types/chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownMessage } from "@/components/markdown-message";
import { Button } from "@/components/ui/button";
import { Copy, Check, Crown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
interface FinalAnswerPanelProps {
  finalResponse: VoteResponseEvent;
}
export function FinalAnswerPanel({ finalResponse }: FinalAnswerPanelProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(finalResponse.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };
  return (
    <Card className="border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Crown className="h-6 w-6 text-yellow-600" />
          <span>Final Answer</span>
          <span className="text-sm font-normal text-muted-foreground">
            by {finalResponse.model}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-white dark:bg-gray-900 p-4 font-mono text-base">
          <MarkdownMessage content={finalResponse.response} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Topic:</span> {finalResponse.topic}
          </p>
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Answer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
