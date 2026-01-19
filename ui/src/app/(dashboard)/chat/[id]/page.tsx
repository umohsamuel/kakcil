"use client";

import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { useChat, useMessages } from "@/hooks/use-chat";
import { useParams } from "next/navigation";
import { ChatMessage } from "@/types/chat";
import { CouncilDebateModal } from "@/components/council-debate-modal";
import { MarkdownMessage } from "@/components/markdown-message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Send, Copy, Check } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

function ChatDetailPageContent() {
  const { user, logout } = useAuth();
  const params = useParams();
  const chatId = params.id as string;
  const { sendMessageAsync, isSending } = useChat(chatId);
  const { messages, isLoading: isLoadingMessages } = useMessages(chatId);
  const [input, setInput] = useState("");
  const [debatingMessageId, setDebatingMessageId] = useState<string | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setInput("");

    const assistantMessageId = (Date.now() + 1).toString();
    setDebatingMessageId(assistantMessageId);

    try {
      await sendMessageAsync({ 
        message: userMessage.content,
        chat_id: chatId 
      });
    } catch (error) {
      toast.error("Sorry, there was an error processing your request.");
    } finally {
      setDebatingMessageId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard");
  };

  if (isLoadingMessages) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-foreground/60">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className={"h-full w-full"}>
      <CouncilDebateModal isOpen={debatingMessageId !== null} />

      <main className="relative flex h-full flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Kakcil Logo" width={24} height={24} />
            <span className="font-bold">KAKCIL</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()}>
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Chat Area */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-8 text-center">
              <div className="bg-foreground/5 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <Image
                  src="/logo.png"
                  alt="Kakcil Logo"
                  width={40}
                  height={40}
                  className={"invert-100 dark:invert-0"}
                />
              </div>
              <h2 className="text-2xl font-bold">No Messages Yet</h2>
              <p className="text-foreground/60 max-w-md">
                Start the conversation by sending a message below.
              </p>
            </div>
          )}

          {messages.length > 0 && (
            <div
              className="mx-auto w-full flex-1 overflow-y-auto scroll-smooth px-4 py-6 md:px-8"
              ref={scrollRef}
            >
              <div className={"mx-auto flex max-w-[720px] flex-col gap-12"}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`relative ${
                        message.role === "user"
                          ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-black px-6 py-4 text-white sm:max-w-[75%]"
                          : "group w-full font-mono text-base"
                      }`}
                    >
                      {message.role === "user" ? (
                        <div className="leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      ) : (
                        <>
                          <MarkdownMessage content={message.content} />
                          <button
                            onClick={() =>
                              handleCopy(message.content, message.id)
                            }
                            className="cursor-pointer rounded-sm border border-black/10 bg-white p-1.5 hover:bg-gray-50"
                            title="Copy message"
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-gray-600" />
                            )}
                          </button>
                        </>
                      )}
                      {message.role === "user" && message.timestamp && (
                        <span className="mt-2 block text-[10px] opacity-60">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 text-xs font-bold text-white">
                        {user?.name?.[0] || "U"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-background border-foreground/10 border-t p-4 md:p-6">
            <div className="relative mx-auto max-w-3xl">
              <div className="border-background/10 bg-foreground focus-within:border-background/30 flex items-center gap-2 rounded-2xl border-2 p-2 transition-colors">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the council..."
                  className="placeholder:text-background/50 text-background max-h-[200px] min-h-[50px] w-full resize-none border-0 bg-transparent px-2 py-3 text-base ring-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isSending}
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isSending}
                  size="icon"
                  className="bg-background text-foreground hover:bg-background/90 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChatDetailPage() {
  return (
    <ProtectedRoute>
      <ChatDetailPageContent />
    </ProtectedRoute>
  );
}
