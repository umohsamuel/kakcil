"use client";

import { useParams } from "next/navigation";
import { ChatWorkspace } from "@/components/chat/chat-workspace";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  return <ChatWorkspace key={id} chatId={id} />;
}
