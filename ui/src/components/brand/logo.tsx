import Image from "next/image";
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
    <Image
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      priority
      className={cn("shrink-0 invert dark:invert-0", className)}
    />
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
