import { Metadata } from "next";

export const webUrl =
  process.env.NEXT_PUBLIC_WEB_URL || "https://kakcil.umohsg.com";

export const appMetadata: Metadata = {
  metadataBase: new URL(webUrl),
  title: "Kakcil | The AI Council - Multi-Model Consensus Platform",
  description:
    "Don't settle for one answer. Kakcil prompts multiple top-tier AI models, lets them vote on the responses, and delivers the absolute best result via consensus.",
  keywords: [
    "Kakcil",
    "AI Council",
    "Multi-model AI",
    "AI Voting",
    "LLM Aggregator",
    "Best AI Response",
    "Artificial Intelligence",
    "Prompt Engineering",
    "Consensus Engine",
    "Samuel Umoh",
    "Full Stack Developer",
    "Software Engineer",
    "AI-powered government council chatbot",
    "AI-powered chatbot",
    "AI-powered council",
    "AI-powered voting",
    "AI-powered consensus",
    "AI-powered aggregation",
    "AI-powered response",
    "AI-powered platform",
    "AI-powered chat",
  ],
  authors: [{ name: "Samuel Umoh", url: webUrl }],
  creator: "Samuel Umoh",
  publisher: "Kakcil Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/logo-with-bg.png",
    apple: "/logo-with-bg.png",
  },
  openGraph: {
    title: "Kakcil | The AI Council & Voting Platform",
    description:
      "Why rely on a single model? Kakcil aggregates answers from multiple AIs and uses a voting council to select the absolute best response for you.",
    url: "/",
    siteName: "Kakcil",
    locale: "en_US",
    images: [
      {
        url: "/cover-photo.png",
        width: 1200,
        height: 630,
        alt: "Kakcil AI Council Platform - Multi-model Voting",
        type: "image/png",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kakcil | The AI Council & Voting Platform",
    description:
      "Ask once, get the consensus. Kakcil uses a council of AI models to vote on and deliver the best possible answer.",
    images: [
      {
        url: "/cover-photo.png",
        width: 1200,
        height: 630,
        alt: "Kakcil AI Council Platform",
        type: "image/png",
      },
    ],
    creator: "@umohsg",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};
