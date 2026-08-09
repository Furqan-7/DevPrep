import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
  weight: ["400", "500"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="bg-[#ffffff] text-[#1d1d1f] font-sans selection:bg-[#0066cc]/15 selection:text-[#1d1d1f]">
        {children}
      </body>
    </html>
  );
}

