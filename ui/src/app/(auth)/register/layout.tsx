import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { pageMetadata } from "@/constants/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Create your account",
  description:
    "Create a free Kakcil account, add your own API keys, and ask a council of AI models at once.",
  path: "/register",
});

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
