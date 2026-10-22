"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, GitBranch, MessagesSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_HEIGHT = 200;

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  busy?: boolean;
  placeholder?: string;
  targetLabel?: string;
  targetKind?: "thread" | "branch";
  onResetTarget?: () => void;
  autoFocus?: boolean;
  className?: string;
  initialValue?: string;
}

export function ChatComposer({
  onSend,
  disabled = false,
  busy = false,
  placeholder = "Ask the council…",
  targetLabel,
  targetKind = "thread",
  onResetTarget,
  autoFocus,
  className,
  initialValue = "",
}: ChatComposerProps) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
  };

  const canSend = !disabled && !busy && value.trim().length > 0;

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
    window.requestAnimationFrame(resize);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "bg-surface shadow-float focus-within:border-border-strong w-full rounded-2xl border transition-colors",
        className
      )}
    >
      {targetLabel && (
        <div className="flex items-center gap-2 border-b px-3 py-2">
          {targetKind === "branch" ? (
            <GitBranch className="text-muted-foreground size-3.5 shrink-0" />
          ) : (
            <MessagesSquare className="text-muted-foreground size-3.5 shrink-0" />
          )}
          <span className="text-muted-foreground min-w-0 truncate text-xs">
            {targetLabel}
          </span>
          {onResetTarget && (
            <button
              type="button"
              onClick={onResetTarget}
              aria-label="Reset reply target"
              className="text-muted-foreground hover:text-foreground ml-auto rounded p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-end gap-2 p-2 pl-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onInput={resize}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          rows={1}
          className="placeholder:text-muted-foreground scrollbar-thin max-h-[200px] min-h-10 flex-1 resize-none bg-transparent py-2.5 text-[0.95rem] leading-relaxed outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          aria-label="Send"
          className="size-9 shrink-0 rounded-xl"
        >
          <ArrowUp className="size-4" />
        </Button>
      </div>
    </form>
  );
}
