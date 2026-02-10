"use client";

import type { RateLimitError } from "@/types/subscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown, Key } from "lucide-react";
import Link from "next/link";

interface RateLimitModalProps {
  open: boolean;
  onClose: () => void;
  rateLimitData?: RateLimitError | null;
}

export function RateLimitModal({
  open,
  onClose,
  rateLimitData,
}: RateLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Message Limit Reached
          </DialogTitle>
          <DialogDescription>
            {rateLimitData?.message ||
              "You've reached your message limit for this period."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Usage info */}
          {rateLimitData?.usage && rateLimitData?.limits && (
            <div className="bg-muted/50 grid grid-cols-2 gap-3 rounded-lg p-3">
              <div>
                <p className="text-muted-foreground text-xs">Daily Usage</p>
                <p className="text-sm font-semibold">
                  {rateLimitData.usage.daily} /{" "}
                  {rateLimitData.limits.messagesPerDay}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Monthly Usage</p>
                <p className="text-sm font-semibold">
                  {rateLimitData.usage.monthly} /{" "}
                  {rateLimitData.limits.messagesPerMonth}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/subscription" onClick={onClose}>
                <Crown className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/settings" onClick={onClose}>
                <Key className="mr-2 h-4 w-4" />
                Add Your Own API Key
              </Link>
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
