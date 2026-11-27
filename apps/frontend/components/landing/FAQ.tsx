"use client";

import Link from "next/link";
import { ROLES } from "@/data/roles";
import { MAX_ATTEMPTS } from "@/lib/interview/report";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Eyebrow, Reveal } from "./primitives";

const FAQS = [
  {
    q: "Can I choose my role, or does DevPrep assign one?",
    a: `You choose. There are ${ROLES.length} roles across Engineering, Data, Design, Product and Behavioral, each at Fresher, Mid-level or Senior. You can also tailor the questions to your resume, a job description, or both.`,
  },
  {
    q: "What does an interview actually look like?",
    a: "Zara opens by asking you to introduce yourself, then asks ten questions by voice and follows up on what you said. You answer out loud with a live transcript on screen. When you finish, you get a report with a score for every answer, what was missing and a stronger answer to learn from.",
  },
  {
    q: "Do I need a microphone?",
    a: "Yes. Interviews happen out loud, so you'll need a microphone and to allow microphone access in your browser. Everything runs in the browser, with nothing to install.",
  },
  {
    q: "Does it cover coding rounds?",
    a: "Yes. The coding round has problems from Easy to Hard that you solve in a browser editor. Your code runs against the tests in a sandboxed worker, and every submission gets an AI review with a score, its time and space complexity and what to improve.",
  },
  {
    q: "Can I practise a weak answer again?",
    a: `Yes. From the report you can retry any question by voice, up to ${MAX_ATTEMPTS} times, and each retry is scored so you can see the improvement.`,
  },
  {
    q: "Is my data private?",
    a: "Your answers and transcripts are used only to run your practice and build your reports. Shared report links show scores and feedback, never your answers, and you can turn a link off any time.",
  },
  {
    q: "Is DevPrep free?",
    a: "Yes, while we're in early access: every feature, no session limit and no card required. If that ever changes, we'll tell you well before it does.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative scroll-mt-20 bg-[#050506] px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-[1080px] gap-10 md:grid-cols-[minmax(0,360px)_1fr] md:gap-16">
        <div>
          <Reveal>
            <Eyebrow>FAQ</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="fx-text-fade m-0 mt-5 text-[38px] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-[50px]">Questions, answered</h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="m-0 mt-4 max-w-[320px] text-[15.5px] leading-[1.6] text-white/55">Everything you might want to know before your first mock interview.</p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="fx-border mt-8 rounded-2xl bg-[#0b0b0e] p-5">
              <div className="text-[14.5px] font-medium tracking-[-0.02em] text-white">Still deciding?</div>
              <p className="m-0 mt-1.5 text-[13.5px] leading-[1.55] text-white/50">The quickest way to find out is one interview. It&rsquo;s free.</p>
              <Link href="/auth/signup" className="mt-4 inline-flex h-10 items-center rounded-lg bg-white px-4 text-[13.5px] font-semibold text-black">
                Try a session
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <Accordion type="single" collapsible defaultValue="item-0" className="border-t border-white/[0.08]">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-white/[0.08]">
                <AccordionTrigger className="text-white/90">{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
