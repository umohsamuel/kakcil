import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { pageMetadata } from "@/constants/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Check your inbox",
  description: "Verify your email to start using Kakcil.",
  isPrivate: true,
});

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
