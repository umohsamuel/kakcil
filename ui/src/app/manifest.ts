import type { MetadataRoute } from "next";
import { siteDescription, siteName } from "@/constants/metadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description: siteDescription,
    start_url: "/chat",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#111111",
    icons: [
      {
        src: "/images/logo-with-bg.png",
        sizes: "1024x1024",
        type: "image/jpeg",
      },
    ],
  };
}
