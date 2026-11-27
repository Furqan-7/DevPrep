"use client";

/**
 * DevPrep landing page. Always dark, with its own aurora palette (blue, violet, pink);
 * the signed-in app uses the calmer tokens from globals.css.
 */

import { MotionConfig } from "motion/react";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { RoleMarquee } from "@/components/landing/RoleMarquee";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Realtime } from "@/components/landing/Realtime";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA, Footer } from "@/components/landing/Closing";

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip bg-[#050506] text-white">
        <LandingNav />
        <main>
          <Hero />
          <RoleMarquee />
          <Features />
          <HowItWorks />
          <Realtime />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
