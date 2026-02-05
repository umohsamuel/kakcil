import { AnimatedBackground } from "@/components/backgrounds";
import { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative">
      <AnimatedBackground />

      {children}
    </div>
  );
}
