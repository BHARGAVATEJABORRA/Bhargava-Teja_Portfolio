import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

import { AnalyticsBootstrap } from "@/components/analytics/analytics-bootstrap";
import { PageBeacon } from "@/components/analytics/page-beacon";
import { LiquidGlassFilterDefs } from "@/components/layout/liquid-glass-filter-defs";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { siteConfig } from "@/lib/site";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: "%s | Bhargava Teja Borra",
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    type: "website",
    url: siteConfig.url,
    siteName: "Bhargava Teja Borra Portfolio",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "Bhargava Teja Borra portfolio preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} bg-[var(--color-bg)] antialiased`}>
        <SmoothScrollProvider>
          <LiquidGlassFilterDefs />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--color-card)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--color-ink)]"
          >
            Skip to main content
          </a>
          <AnalyticsBootstrap />
          <PageBeacon />
          <div className="relative min-h-screen">{children}</div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
