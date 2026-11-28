import type { Metadata } from "next";
import { inter, outfit, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";
import Script from "next/script";


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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="bg-[#ffffff] text-[#1d1d1f] font-sans selection:bg-[#0066cc]/15 selection:text-[#1d1d1f]">
        <Script id="devprep-theme" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem("devprep-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`}
        </Script>
        {children}
      </body>
    </html>
  );
}

