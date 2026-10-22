import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { pageMetadata } from "@/constants/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Settings",
  description: "Manage your API keys, council, appearance and account.",
  isPrivate: true,
});

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
