import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Glow Notes",
  description:
    "A simple note app for writing, organizing, and sharing ideas from anywhere.",
  icons: {
    icon: "/logo.webp",
    apple: "/logo.webp",
    shortcut: "/logo.webp",
  },
  openGraph: {
    title: "Glow Notes",
    description:
      "Write notes, keep them organized, and share them when you need to.",
    images: ["/logo.webp"],
  },
  twitter: {
    card: "summary",
    title: "Glow Notes",
    description:
      "Write notes, keep them organized, and share them when you need to.",
    images: ["/logo.webp"],
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
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
