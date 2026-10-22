import { Metadata } from "next";

export const webUrl =
  process.env.NEXT_PUBLIC_WEB_URL || "https://kakcil.umohsg.com";

export const siteName = "Kakcil";

export const siteTitle = `${siteName} | Multi-model AI council`;

export const siteDescription =
  "Kakcil sends your question to several AI models at once. They vote on each other's answers, and you get the one they agree on, on a canvas you can branch from.";

export const owner = {
  name: "Samuel Umoh",
  url: "https://www.umohsg.com/",
  twitter: "@umohsg",
};

export const shareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: siteName,
};

export const appMetadata: Metadata = {
  metadataBase: new URL(webUrl),
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "Kakcil",
    "AI council",
    "multi-model AI",
    "LLM comparison",
    "AI voting",
    "bring your own key",
    "Claude",
    "GPT",
    "Gemini",
    "DeepSeek",
    "Grok",
    "Kimi",
  ],
  authors: [{ name: owner.name, url: owner.url }],
  creator: owner.name,
  publisher: owner.name,
  category: "technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/images/logo-with-bg.jpg",
    apple: "/images/logo-with-bg.jpg",
  },
  openGraph: {
    type: "website",
    siteName,
    locale: "en_US",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    creator: owner.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const privateRouteMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export function pageMetadata({
  title,
  description,
  path,
  isPrivate = false,
}: {
  title: string;
  description: string;
  path?: string;
  isPrivate?: boolean;
}): Metadata {
  const fullTitle = `${title} | ${siteName}`;

  return {
    ...(isPrivate ? privateRouteMetadata : {}),
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: "website",
      siteName,
      locale: "en_US",
      title: fullTitle,
      description,
      images: [shareImage],
      ...(path ? { url: path } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      creator: owner.twitter,
      images: ["/twitter-image"],
    },
  };
}
