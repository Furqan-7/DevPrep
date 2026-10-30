import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono, Outfit } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600", "700"],
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
  weight: ["400", "500"],
  fallback: ["ui-monospace", "monospace"],
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="bg-[#ffffff] text-[#1d1d1f] font-sans selection:bg-[#0066cc]/15 selection:text-[#1d1d1f]">
        <Script id="devprep-theme" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem("devprep-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`}
        </Script>
        {children}
      </body>
    </html>
  );
}

