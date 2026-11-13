/**
 * Self-hosted fonts (files in app/fonts). Using next/font/local means the build never
 * downloads fonts from Google, so a failed or rate-limited download can't break it.
 * Each font is defined once here and imported wherever it's needed.
 */

import localFont from "next/font/local";

export const inter = localFont({
  src: "../app/fonts/InterLatinVar.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const outfit = localFont({
  src: "../app/fonts/OutfitLatinVar.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-display",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const jetbrainsMono = localFont({
  src: "../app/fonts/JetBrainsMonoLatinVar.woff2",
  weight: "100 800",
  style: "normal",
  variable: "--font-jbmono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

/**
 * Italic display serif used for accent words in landing headlines. next/font names the
 * family after this variable, so it must not be called `serif` (a CSS generic family).
 */
export const instrumentSerif = localFont({
  src: "../app/fonts/InstrumentSerifLatinItalic.woff2",
  weight: "400",
  style: "italic",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const serif = instrumentSerif;
