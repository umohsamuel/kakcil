import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  id: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  id,
  title,
  description,
  action,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      id={id}
      className={cn("bg-surface scroll-mt-6 rounded-2xl border", className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 md:px-6">
        <div className="space-y-1">
          <h2 className="font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground max-w-xl text-sm">
              {description}
            </p>
          )}
        </div>
        {action}
      </header>
      <div className="px-5 py-5 md:px-6">{children}</div>
    </section>
  );
}
