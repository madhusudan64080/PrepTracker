// frontend/app/layout.tsx
// This is a Server Component - no hooks allowed here

import "./globals.css";
import { ReactNode } from "react";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import ClientProviders from "./ClientProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono"
});

export const metadata = {
  title: "PrepTrack - Placement Preparation OS",
  description: "Your all-in-one placement preparation platform",
  manifest: "/manifest.json"
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${space.variable} ${mono.variable} antialiased bg-[#08080f] text-[#f1f5f9]`}
      >
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
