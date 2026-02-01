"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  variant?: "light" | "dark";
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Ask the council...",
  variant = "light",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  if (variant === "dark") {
    return (
      <div className="flex items-end gap-2 rounded-2xl border-2 border-gray-900 bg-gray-900 p-2 focus-within:border-gray-700 dark:border-gray-100 dark:bg-gray-100">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="max-h-[200px] min-h-[50px] w-full resize-none border-0 bg-transparent px-2 py-3 text-sm text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-gray-900 dark:placeholder:text-gray-600"
          disabled={disabled}
          rows={1}
        />
        <Button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-lg bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="border-background/10 bg-foreground focus-within:border-background/30 flex items-center gap-2 rounded-2xl border-2 p-2 transition-colors">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="placeholder:text-background/50 text-background max-h-[200px] min-h-[50px] w-full resize-none border-0 bg-transparent px-2 py-3 text-base ring-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={disabled}
        rows={1}
      />
      <Button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        size="icon"
        className="bg-background text-foreground hover:bg-background/90 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}

