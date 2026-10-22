import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { pageMetadata } from "@/constants/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Verify your email",
  description: "Confirm your email address to finish setting up Kakcil.",
  isPrivate: true,
});

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
