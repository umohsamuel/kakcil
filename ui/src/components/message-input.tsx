"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
     if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
     }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-end gap-2 bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-2xl transition-all focus-within:border-white/20 focus-within:bg-white/10 ring-0 ring-offset-0">
        <div className="pl-3 pb-3 text-muted-foreground hidden sm:block">
             <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the council a question..."
          className="min-h-[50px] max-h-[200px] w-full resize-none border-0 bg-transparent py-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 scrollbar-hide text-white"
          disabled={disabled}
          rows={1}
        />
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-50 mb-1 mr-1 transition-all hover:scale-105"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
