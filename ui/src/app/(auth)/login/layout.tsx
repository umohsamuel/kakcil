import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { pageMetadata } from "@/constants/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description:
    "Sign in to Kakcil and pick up your conversations with the council.",
  path: "/login",
});

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
