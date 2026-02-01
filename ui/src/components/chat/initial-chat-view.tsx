"use client";

import Image from "next/image";
import { ChatInput } from "./chat-input";

interface InitialChatViewProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function InitialChatView({
  input,
  onInputChange,
  onSend,
  disabled = false,
}: InitialChatViewProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="bg-foreground/5 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
          <Image
            src="/logo.png"
            alt="Kakcil Logo"
            width={40}
            height={40}
            className="invert-100 dark:invert-0"
          />
        </div>
        <h2 className="text-2xl font-bold">Start a Conversation</h2>
        <p className="text-foreground/60 max-w-md">
          Ask anything to begin. The council will debate and provide you with
          the best answer.
        </p>
      </div>
      <div className="bg-background border-foreground/10 border-t p-4 md:p-6">
        <div className="relative mx-auto max-w-3xl">
          <ChatInput
            value={input}
            onChange={onInputChange}
            onSend={onSend}
            disabled={disabled}
            placeholder="Ask the council..."
            variant="light"
          />
        </div>
      </div>
    </div>
  );
}

