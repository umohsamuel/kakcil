import type { MetadataRoute } from "next";
import { webUrl } from "@/constants/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${webUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${webUrl}/register`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${webUrl}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
