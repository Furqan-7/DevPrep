"use client";

/**
 * FAQ section: a sticky heading + CTA column beside a numbered accordion.
 * Opening a question expands it smoothly, morphs + into −, lights a lavender rail
 * and fades the answer in. One question is open at a time.
 * Answers stay in the DOM (good for search engines); closed ones are inert.
 */

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ROLES } from "@/data/roles";
import { serif } from "@/lib/fonts";

const ease = [0.16, 1, 0.3, 1] as const;
const mono = { fontFamily: "var(--font-jbmono, 'JetBrains Mono'), ui-monospace, monospace" };

const FAQ_ITEMS = [
  {
    q: "Can I choose my role, or does DevPrep assign one?",
    a: `You choose. Pick from ${ROLES.length} roles including Frontend Engineer, Backend, DSA, ML Engineer, Product Manager, Behavioral, and more. Resume-tailored question sets are coming with Pro.`,
  },
  {
    q: "What does a session actually look like?",
    a: "You'll review the top questions for your role, then Zara asks you questions one by one by voice. You answer out loud, the session transcribes your responses, and Zara follows up in real time. When you finish, you get a report: a score for every answer, what was missing, a stronger answer to learn from, and the option to retry any question out loud.",
  },
  {
    q: "Do I need a microphone?",
    a: "Yes. Interviews happen out loud, so you'll need a microphone and to allow microphone access in your browser. Everything runs in the browser, with nothing to install.",
  },
  {
    q: "Does it support coding or technical rounds?",
    a: "You can practice DSA, System Design and engineering rounds by voice today. Live code execution, where you write and run real code during the interview, is coming with Pro.",
  },
  {
    q: "Is my data private?",
    a: "Your session data and transcripts are used only to run your practice sessions. We never share or sell your personal information to third parties.",
  },
  {
    q: "Is DevPrep free?",
    a: "Yes, while we're in early access. You get real-time voice interviews with Zara across every role, a feedback report after each one, no session limit and no card required. Pro ($10/month) will add resume-tailored questions and live code execution. It isn't available to buy yet, and we'll tell you well before anything changes.",
  },
];

export function FAQSection() {
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState<number | null>(0);
  // read after mount so server and client render the same HTML
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const motionCls = reduce ? "" : "transition-all duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]";

  return (
    <section id="faq" aria-labelledby="faq-title" className="relative scroll-mt-16 bg-[#0a0a0a] px-5 pb-24 pt-20 font-sans text-[#f0f0f0] sm:px-6 sm:pb-32 sm:pt-28">
      <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,380px)_1fr] md:gap-[72px]">
        {/* sticky heading + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease }}
          className="md:sticky md:top-[110px]"
        >
          <div className="mb-5 inline-flex items-center gap-2.5 text-[13px] tracking-[-0.03em] text-white/45 sm:mb-[22px] sm:text-[14px]">
            <i className="block h-1.5 w-1.5 rounded-full bg-[#bec8ff] shadow-[0_0_12px_#bec8ff]" />
            FAQ
          </div>
          <h2 id="faq-title" className="m-0 text-[34px] font-medium leading-[1.06] tracking-[-0.05em] sm:text-[52px]">
            Questions,
            <br />
            <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>answered.</em>
          </h2>
          <p className="mt-4 max-w-[320px] text-[15.5px] leading-[1.55] tracking-[-0.03em] text-white/56">Everything you might want to know before your first mock interview.</p>
          <div className="mt-8 rounded-[14px] bg-[#0d0d0f] p-[18px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] md:mt-[34px]">
            <b className="block text-[14.5px] font-medium tracking-[-0.03em]">Still curious?</b>
            <p className="mb-3.5 mt-1.5 text-[13.5px] leading-[1.5] text-white/50">The quickest way to find out is to try a session. It&rsquo;s free while we&rsquo;re in early access.</p>
            <button
              type="button"
              onClick={() => router.push("/auth/signup")}
              className="inline-flex h-[46px] cursor-pointer items-center justify-center rounded-[9px] bg-[#f0f0f0] px-5 text-[14px] font-medium tracking-[-0.04em] text-[#0a0a0a] transition-colors hover:bg-white"
            >
              Start a mock interview
            </button>
          </div>
        </motion.div>

        {/* accordion */}
        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          className="m-0 flex list-none flex-col gap-2.5 p-0"
        >
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            const btnId = `${id}-q${i}`;
            const panelId = `${id}-a${i}`;
            return (
              <motion.li
                key={item.q}
                variants={{ hidden: { opacity: 0, y: 18, filter: "blur(6px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease } } }}
                className={`relative overflow-hidden rounded-[14px] ${motionCls} ${isOpen ? "bg-[#101014] shadow-[inset_0_0_0_1px_rgba(190,200,255,0.22)]" : "bg-[#0d0d0f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute bottom-3.5 left-0 top-3.5 w-0.5 origin-center rounded-full bg-[linear-gradient(#fff,#bec8ff)] shadow-[0_0_12px_rgba(190,200,255,0.7)] ${motionCls} ${isOpen ? "scale-y-100" : "scale-y-0"}`}
                />
                <h3 className="m-0">
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full cursor-pointer items-center gap-4 px-[18px] py-5 text-left sm:px-[22px]"
                  >
                    <span style={mono} className={`w-5 shrink-0 text-[11.5px] transition-colors duration-300 ${isOpen ? "text-[#bec8ff]" : "text-white/30"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-[15px] font-medium tracking-[-0.035em] sm:text-[16px]">{item.q}</span>
                    <span
                      aria-hidden="true"
                      className={`relative h-7 w-7 shrink-0 rounded-full transition-[background-color,box-shadow] duration-300 ${isOpen ? "bg-[#f0f0f0]" : "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"}`}
                    >
                      <span className={`absolute left-1/2 top-1/2 h-[1.5px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full ${isOpen ? "bg-[#0a0a0a]" : "bg-[#f0f0f0]"}`} />
                      <span className={`absolute left-1/2 top-1/2 h-[1.5px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full ${motionCls} ${isOpen ? "rotate-0 bg-[#0a0a0a]" : "rotate-90 bg-[#f0f0f0]"}`} />
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  inert={!isOpen}
                  className={`grid ${reduce ? "" : "transition-[grid-template-rows] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]"} ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p
                      className={`m-0 px-[18px] pb-[22px] text-[14.5px] leading-[1.6] tracking-[-0.02em] text-white/60 sm:pl-[58px] sm:pr-[22px] ${reduce ? "" : "transition-[opacity,transform] duration-[450ms]"} ${isOpen ? "translate-y-0 opacity-100 delay-75" : "-translate-y-1.5 opacity-0"}`}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}

export default FAQSection;
