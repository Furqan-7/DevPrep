import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "DevPrep — Master DSA, Jobs, AI Mock Interviews & CS Core",
  description:
    "Reverent preparation platform for engineering placements. Master DSA practice, live job listings, real-time AI mock interviews, and structured CS core notes.",
  icons: {
    icon: "/devprep-logo.png",
    shortcut: "/devprep-logo.png",
    apple: "/devprep-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} antialiased`}>
      <body className="bg-[#ffffff] text-[#1d1d1f] font-sans selection:bg-[#0066cc]/15 selection:text-[#1d1d1f]">
        {children}
      </body>
    </html>
  );
}
