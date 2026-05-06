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

export const metadata: Metadata = {
  title: "StackTrim — Find Wasted AI Spend Before Your Next Invoice",
  description:
    "StackTrim audits your AI tool subscriptions and finds savings opportunities. No signup required. Deterministic, trustworthy results in 60 seconds.",
  keywords: [
    "AI spend audit",
    "AI tool savings",
    "SaaS cost optimization",
    "startup AI budget",
    "infrastructure cost reduction",
  ],
  openGraph: {
    title: "StackTrim — Find Wasted AI Spend",
    description:
      "Audit your AI tool subscriptions. Find savings in 60 seconds.",
    type: "website",
    siteName: "StackTrim",
  },
  twitter: {
    card: "summary_large_image",
    title: "StackTrim — Find Wasted AI Spend",
    description:
      "Audit your AI tool subscriptions. Find savings in 60 seconds.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
