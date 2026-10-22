import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageLoader({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "bg-background text-muted-foreground flex min-h-dvh w-full flex-col items-center justify-center gap-3",
        className
      )}
    >
      <Loader2 className="size-5 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
