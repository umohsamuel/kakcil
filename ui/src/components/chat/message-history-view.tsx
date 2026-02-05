"use client";

import { useRef, useEffect, useState } from "react";
import { MessageItem } from "./message-item";
import { EmptyStateView } from "./empty-state-view";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp?: Date | string;
  stored_council_responses?: unknown[];
}

interface MessageHistoryViewProps {
  messages: Message[];
  userName?: string;
  hasMore: boolean;
  isFetchingMore: boolean;
  onFetchMore: () => void;
}

export function MessageHistoryView({
  messages,
  userName,
  hasMore,
  isFetchingMore,
  onFetchMore,
}: MessageHistoryViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const hasScrolledToBottom = useRef(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Handle infinite scroll
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      if (scrollElement.scrollTop < 100 && hasMore && !isFetchingMore) {
        previousScrollHeight.current = scrollElement.scrollHeight;
        onFetchMore();
      }
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [hasMore, isFetchingMore, onFetchMore]);

  // Maintain scroll position after fetching more
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement && previousScrollHeight.current > 0 && !isFetchingMore) {
      const newScrollHeight = scrollElement.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      if (scrollDiff > 0) {
        scrollElement.scrollTop = scrollDiff;
      }
      previousScrollHeight.current = 0;
    }
  }, [messages, isFetchingMore]);

  // Scroll to bottom on initial load
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (
      scrollElement &&
      messages.length > 0 &&
      !hasScrolledToBottom.current &&
      !previousScrollHeight.current
    ) {
      const timeoutId = setTimeout(() => {
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
          hasScrolledToBottom.current = true;
        }
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length]);

  const handleCopy = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard");
  };

  if (messages.length === 0) {
    return <EmptyStateView />;
  }

  return (
    <div
      className="mx-auto w-full flex-1 overflow-y-auto scroll-smooth px-4 py-6 md:px-8"
      ref={scrollRef}
    >
      <div className="mx-auto flex max-w-[720px] flex-col gap-12">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            id={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            userName={userName}
            copiedId={copiedId}
            onCopy={handleCopy}
          />
        ))}
        {/* Scroll anchor */}
        <div id="messages-bottom" className="h-0" />
      </div>
    </div>
  );
}
