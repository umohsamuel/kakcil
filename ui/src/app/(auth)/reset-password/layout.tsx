import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { pageMetadata } from "@/constants/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Choose a new password",
  description: "Set a new password for your Kakcil account.",
  isPrivate: true,
});

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
