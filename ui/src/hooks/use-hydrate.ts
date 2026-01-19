import { useSyncExternalStore } from "react";

export function useHydration() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
