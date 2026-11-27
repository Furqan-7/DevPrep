"use client";

/**
 * Floating top nav. Transparent over the hero; once the page scrolls it tightens into a
 * blurred pill. Signed-in visitors get "Open dashboard" instead of the sign-up button.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowRight, Menu } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSignedIn } from "@/hooks/useSignedIn";
import { cn } from "@/lib/utils";
import { ease } from "./primitives";

const LINKS = [
  { label: "Features", id: "features" },
  { label: "How it works", id: "how-it-works" },
  { label: "Pricing", id: "pricing" },
  { label: "FAQ", id: "faq" },
];

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export function LandingNav() {
  const signedIn = useSignedIn();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));
  useEffect(() => setScrolled(window.scrollY > 24), []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-5"
    >
      <nav
        aria-label="Primary"
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border px-3 py-2 transition-[max-width,background-color,border-color,box-shadow,padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-4",
          scrolled
            ? "max-w-[880px] border-white/[0.08] bg-[#0a0a0c]/70 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            : "max-w-[1200px] border-transparent bg-transparent",
        )}
      >
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => scrollTo(l.id)}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-[13.5px] font-medium tracking-[-0.01em] text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {signedIn ? (
            <Button asChild size="sm" className="h-8 rounded-lg px-3.5 text-[13px]">
              <Link href="/dashboard">
                Open dashboard <ArrowRight />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden h-8 rounded-lg px-3 text-[13px] text-white/70 hover:text-white sm:inline-flex">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="h-8 rounded-lg px-3.5 text-[13px] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_24px_-8px_rgba(255,255,255,0.35)]">
                <Link href="/auth/signup">Get started</Link>
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Open menu" className="md:hidden">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="border-white/[0.08] bg-[#0a0a0c]/95 px-4 pb-6 pt-5 backdrop-blur-xl">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo />
              <div className="mt-4 grid gap-1">
                {LINKS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setTimeout(() => scrollTo(l.id), 250);
                    }}
                    className="rounded-lg px-3 py-2.5 text-left text-[15px] text-white/75 hover:bg-white/[0.05] hover:text-white"
                  >
                    {l.label}
                  </button>
                ))}
                {!signedIn ? (
                  <Link href="/auth/signin" className="rounded-lg px-3 py-2.5 text-[15px] text-white/75 hover:bg-white/[0.05] hover:text-white">
                    Sign in
                  </Link>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
