import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "A bilingual (FR/EN) reference for meat-production vocabulary — market, breed, slaughtering, culinary preparation — from AgroPortal's MEAT-T thesaurus.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Meatsaurus — Meat Thesaurus Explorer",
    template: "%s — Meatsaurus",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "Meatsaurus",
    title: "Meatsaurus — Meat Thesaurus Explorer",
    description,
    locale: "en",
    alternateLocale: "fr",
  },
  twitter: {
    card: "summary",
    title: "Meatsaurus — Meat Thesaurus Explorer",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
