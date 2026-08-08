import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PlumbTrack – Plumbing Project Program",
  description:
    "Project control, document records, approvals and programme dates for plumbing contractors.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "PlumbTrack",
    description: "Plumbing project control from submission to completion.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "PlumbTrack project control dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PlumbTrack",
    description: "Plumbing project control from submission to completion.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
