import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { pageMetadata } from "@/constants/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Chat",
  description: "A conversation with your AI council.",
  isPrivate: true,
});

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
