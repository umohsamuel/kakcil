import { useEffect, useRef, useState } from "react";

const RESET_MS = 1500;

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    },
    []
  );

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setCopied(false);
    }, RESET_MS);
  };

  return { copied, copy };
}
