import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stacktrim.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "StackTrim — Find Wasted AI Spend Before Your Next Invoice",
    template: "%s — StackTrim",
  },
  description:
    "StackTrim audits your AI tool subscriptions and finds savings opportunities. No signup required. Deterministic, trustworthy results in 60 seconds.",
  keywords: [
    "AI spend audit",
    "AI tool savings",
    "SaaS cost optimization",
    "startup AI budget",
    "infrastructure cost reduction",
    "AI subscription management",
  ],
  openGraph: {
    title: "StackTrim — Find Wasted AI Spend",
    description:
      "Audit your AI tool subscriptions. Find savings in 60 seconds.",
    type: "website",
    siteName: "StackTrim",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "StackTrim — Find Wasted AI Spend",
    description:
      "Audit your AI tool subscriptions. Find savings in 60 seconds.",
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "StackTrim",
              url: siteUrl,
              description:
                "AI spend audit platform. Find wasted AI subscriptions and optimize your stack.",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
