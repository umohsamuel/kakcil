import type { MetadataRoute } from "next";
import { webUrl } from "@/constants/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/chat",
        "/settings",
        "/reset-password",
        "/verify-email",
        "/verify-email-prompt",
      ],
    },
    sitemap: `${webUrl}/sitemap.xml`,
    host: webUrl,
  };
}
