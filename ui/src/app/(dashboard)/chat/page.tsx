import type { Metadata } from "next";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { pageMetadata } from "@/constants/metadata";

export const metadata: Metadata = pageMetadata({
  title: "New chat",
  description: "Ask your AI council a new question.",
  isPrivate: true,
});

export default function NewChatPage() {
  return <ChatWorkspace />;
}
