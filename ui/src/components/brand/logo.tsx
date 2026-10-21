import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  showWordmark?: boolean;
  size?: number;
  className?: string;
}

export function LogoMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        d="M5 6.5 12 17.5M12 6.5v11M19 6.5 12 17.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="5" cy="5.5" r="2.25" fill="currentColor" />
      <circle cx="12" cy="5.5" r="2.25" fill="currentColor" />
      <circle cx="19" cy="5.5" r="2.25" fill="currentColor" />
      <circle
        cx="12"
        cy="18"
        r="3.6"
        fill="var(--background, #fff)"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  href = "/",
  showWordmark = true,
  size = 24,
  className,
}: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="Kakcil home"
      className={cn("flex items-center gap-2.5", className)}
    >
      <LogoMark size={size} />
      {showWordmark && (
        <span className="font-display pt-0.5 text-xl leading-none tracking-wide">
          KAKCIL
        </span>
      )}
    </Link>
  );
}
