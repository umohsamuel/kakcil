import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { pageMetadata } from "@/constants/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Reset your password",
  description: "Get a link to reset your Kakcil password.",
  isPrivate: true,
});

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
