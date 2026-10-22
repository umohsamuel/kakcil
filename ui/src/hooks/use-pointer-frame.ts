import { useCallback, useEffect, useRef, type PointerEvent } from "react";

export type PointerFrameHandler<T extends HTMLElement> = (
  element: T,
  x: number,
  y: number,
  rect: DOMRect
) => void;

interface PendingPointer<T extends HTMLElement> {
  element: T;
  clientX: number;
  clientY: number;
}

export function usePointerFrame<T extends HTMLElement>(
  onFrame: PointerFrameHandler<T>
) {
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef<PendingPointer<T> | null>(null);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return useCallback(
    (event: PointerEvent<T>) => {
      pointerRef.current = {
        element: event.currentTarget,
        clientX: event.clientX,
        clientY: event.clientY,
      };
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const pointer = pointerRef.current;
        if (!pointer) return;
        const rect = pointer.element.getBoundingClientRect();
        onFrame(
          pointer.element,
          pointer.clientX - rect.left,
          pointer.clientY - rect.top,
          rect
        );
      });
    },
    [onFrame]
  );
}
