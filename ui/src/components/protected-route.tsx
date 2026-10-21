"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useHydration } from "@/hooks/use-hydrate";
import { PageLoader } from "@/components/page-loader";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const isHydrated = useHydration();

  const redirectTo = !isHydrated
    ? null
    : !isAuthenticated
      ? "/login"
      : user && !user.is_verified
        ? "/verify-email-prompt"
        : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (!isHydrated || redirectTo) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
