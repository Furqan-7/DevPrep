import type { Metadata, Viewport } from "next";
import { inter, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevPrep — AI Mock Interviews for Placement Prep",
  description:
    "Practice real interview questions with Zara, your AI interviewer. Get instant feedback tailored to your role and walk into your next interview prepared.",
  icons: {
    icon: "/devprep-logo.png",
    shortcut: "/devprep-logo.png",
    apple: "/devprep-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The product is dark only; data-theme keeps older components that read it in sync.
    <html lang="en" data-theme="dark" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="bg-background font-sans text-foreground">{children}</body>
    </html>
  );
}
