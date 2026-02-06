"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSSEStreamStore, type ActiveStream, type StreamPhase } from "@/store/sse-stream";
import { SSEProgressToast } from "@/components/sse-progress-toast";

/**
 * Provider that manages toast notifications for all active SSE streams.
 * 
 * This component subscribes to the SSE stream store and shows/updates
 * toast notifications based on stream state changes.
 */
export function SSEStreamProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const streams = useSSEStreamStore((state) => state.streams);
  const removeStream = useSSEStreamStore((state) => state.removeStream);
  
  // Track toast IDs for each stream
  const toastIdsRef = useRef<Record<string, string | number>>({});
  // Track previous phases to detect changes
  const prevPhasesRef = useRef<Record<string, StreamPhase>>({});

  const handleNavigate = useCallback((chatId: string) => {
    router.push(`/chat/${chatId}`);
  }, [router]);

  const handleDismiss = useCallback((streamId: string) => {
    const toastId = toastIdsRef.current[streamId];
    if (toastId) {
      toast.dismiss(toastId);
      delete toastIdsRef.current[streamId];
    }
  }, []);

  // Manage toasts based on stream state
  useEffect(() => {
    const streamEntries = Object.entries(streams);

    for (const [streamId, stream] of streamEntries) {
      const prevPhase = prevPhasesRef.current[streamId];
      const currentPhase = stream.phaseInfo.phase;
      const existingToastId = toastIdsRef.current[streamId];

      // New stream or phase changed - update/create toast
      if (!existingToastId || prevPhase !== currentPhase) {
        // Dismiss old toast if exists
        if (existingToastId) {
          toast.dismiss(existingToastId);
        }

        // Create appropriate toast based on phase
        if (currentPhase === "complete") {
          // Success toast - auto-dismisses
          const id = toast.success("Council response ready", {
            description: `"${stream.displayName}"`,
            duration: 4000,
            action: stream.chatId ? {
              label: "View",
              onClick: () => handleNavigate(stream.chatId!),
            } : undefined,
          });
          toastIdsRef.current[streamId] = id;
          
          // Clean up after toast dismisses
          setTimeout(() => {
            removeStream(streamId);
            delete toastIdsRef.current[streamId];
            delete prevPhasesRef.current[streamId];
          }, 5000);
        } else if (currentPhase === "error") {
          // Error toast
          const id = toast.error("Council processing failed", {
            description: stream.phaseInfo.errorMessage || stream.displayName,
            duration: 6000,
          });
          toastIdsRef.current[streamId] = id;
          
          // Clean up after toast dismisses
          setTimeout(() => {
            removeStream(streamId);
            delete toastIdsRef.current[streamId];
            delete prevPhasesRef.current[streamId];
          }, 7000);
        } else if (stream.isStreaming) {
          // Progress toast - persistent while streaming
          const id = toast.custom(
            (t) => (
              <SSEProgressToast
                stream={stream}
                onDismiss={() => handleDismiss(streamId)}
                onNavigate={handleNavigate}
              />
            ),
            {
              duration: Infinity,
              id: `sse-${streamId}`,
            }
          );
          toastIdsRef.current[streamId] = id;
        }

        prevPhasesRef.current[streamId] = currentPhase;
      } else if (stream.isStreaming && existingToastId) {
        // Update existing toast with new stream data (model counts, etc.)
        toast.custom(
          (t) => (
            <SSEProgressToast
              stream={stream}
              onDismiss={() => handleDismiss(streamId)}
              onNavigate={handleNavigate}
            />
          ),
          {
            id: existingToastId,
            duration: Infinity,
          }
        );
      }
    }

    // Clean up toasts for removed streams
    const currentStreamIds = new Set(Object.keys(streams));
    for (const streamId of Object.keys(toastIdsRef.current)) {
      if (!currentStreamIds.has(streamId)) {
        toast.dismiss(toastIdsRef.current[streamId]);
        delete toastIdsRef.current[streamId];
        delete prevPhasesRef.current[streamId];
      }
    }
  }, [streams, handleNavigate, handleDismiss, removeStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Dismiss all toasts when provider unmounts (shouldn't happen normally)
      for (const toastId of Object.values(toastIdsRef.current)) {
        toast.dismiss(toastId);
      }
    };
  }, []);

  return <>{children}</>;
}

export default SSEStreamProvider;
