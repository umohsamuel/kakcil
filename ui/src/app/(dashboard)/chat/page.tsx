"use client";

import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { useStartChat } from "@/hooks/use-chat";
import { useRouter } from "next/navigation";
import { CouncilDebateModal } from "@/components/council-debate-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Send } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

function ChatPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { startChatAsync, isStarting } = useStartChat();
  const [input, setInput] = useState("");
  const [isDebating, setIsDebating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleStartChat = async () => {
    if (!input.trim() || isStarting) return;

    const message = input.trim();
    setInput("");
    setIsDebating(true);

    try {
      const response = await startChatAsync({ message });
      
      // Redirect to the new chat page
      router.push(`/chat/${response.chat_id}`);
    } catch (error) {
      toast.error("Sorry, there was an error starting the chat.");
      setIsDebating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStartChat();
    }
  };

  return (
    <div className={"h-full w-full"}>
      <CouncilDebateModal isOpen={isDebating} />

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
            <h2 className="text-2xl font-bold">Start a Conversation</h2>
            <p className="text-foreground/60 max-w-md">
              Ask anything to begin. The council will debate and provide you
              with the best answer.
            </p>
          </div>

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
                  disabled={isStarting}
                  rows={1}
                />
                <Button
                  onClick={handleStartChat}
                  disabled={!input.trim() || isStarting}
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

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}
