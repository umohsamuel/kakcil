"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useHydration } from "@/hooks/use-hydrate";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const isHydrated = useHydration();

  if (!isAuthenticated && isHydrated) {
    router.replace("/login");
  }

  if (isAuthenticated && isHydrated && user && !user.is_verified) {
    router.replace("/verify-email-prompt");
  }

  if (!isAuthenticated || !isHydrated) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-foreground mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
        </div>
      </div>
    );
  }

  if (user && !user.is_verified) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-foreground mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

