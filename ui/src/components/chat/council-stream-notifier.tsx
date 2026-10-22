"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useCouncilStreamStore,
  type StreamPhase,
} from "@/store/council-stream";

export function CouncilStreamNotifier() {
  const router = useRouter();

  useEffect(() => {
    const phases = new Map<string, StreamPhase>();

    return useCouncilStreamStore.subscribe((state) => {
      for (const stream of Object.values(state.streams)) {
        const previous = phases.get(stream.key);
        phases.set(stream.key, stream.phase);

        if (previous === stream.phase || state.viewingKey === stream.key) {
          continue;
        }

        const title = stream.topic || stream.prompt;
        const chatId = stream.chatId;

        if (stream.phase === "done") {
          toast.success("The council has answered", {
            description: title.length > 70 ? `${title.slice(0, 70)}…` : title,
            action: chatId
              ? { label: "Open", onClick: () => router.push(`/chat/${chatId}`) }
              : undefined,
          });
        } else if (stream.phase === "error") {
          toast.error("The council could not answer", {
            description: stream.error,
            action: chatId
              ? { label: "Open", onClick: () => router.push(`/chat/${chatId}`) }
              : undefined,
          });
        }
      }

      for (const key of phases.keys()) {
        if (!state.streams[key]) phases.delete(key);
      }
    });
  }, [router]);

  return null;
}
