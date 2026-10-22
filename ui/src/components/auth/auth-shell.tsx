import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

interface AuthShellProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="bg-background relative flex min-h-dvh flex-col">
      <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <header className="relative flex items-center justify-between px-4 py-4 md:px-6">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Home
        </Link>
        <ThemeToggle />
      </header>
      <main className="relative flex flex-1 items-center justify-center px-4 pb-16">
        <div className="animate-fade-up w-full max-w-sm">
          <div className="mb-8 space-y-3 text-center">
            <LogoMark size={40} className="mx-auto" />
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>
          <div className="bg-surface shadow-float rounded-2xl border p-6">
            {children}
          </div>
          {footer && (
            <div className="text-muted-foreground mt-6 text-center text-sm">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-3 py-2 text-sm"
    >
      {message}
    </p>
  );
}

export function StatusIcon({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted mx-auto flex size-14 items-center justify-center rounded-full">
      {children}
    </div>
  );
}
