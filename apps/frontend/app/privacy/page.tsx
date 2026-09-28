



// TODO: have this reviewed by a lawyer before public launch

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X as CloseIcon, ExternalLink } from "lucide-react";

const monoStyle = {
    fontFamily: "var(--font-jbmono, 'JetBrains Mono', ui-monospace, monospace)",
};

const ROUTES = {
    home: "/",
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    dashboard: "/dashboard",
    allRoles: "/roles",
    about: "/about",
    blog: "/blog",
    privacy: "/privacy",
    terms: "/terms",
    contact: "/contact",
    twitter: "#",
    linkedin: "#",
    github: "#",
};

const LAST_UPDATED = "September 11, 2026";
const CONTACT_EMAIL = "bodarnifurqan07@gmail.com";
const SITE_URL = "https://dev-prep-frontend.vercel.app";

const NAV_LINKS = [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
];

function GlobalNav() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-colors duration-300 ${scrolled
                    ? "bg-[#f5f5f7]/90 backdrop-blur-md border-b border-[#e5e5e5]"
                    : "bg-[#f5f5f7] border-b border-transparent"
                }`}
        >
            <div className="max-w-[1200px] w-full mx-auto px-6 sm:px-10 flex items-center justify-between">
                <button
                    onClick={() => router.push("/")}
                    style={monoStyle}
                    className="flex items-center gap-2.5 text-[15px] font-bold tracking-[0.02em] text-[#1a1a1a] cursor-pointer"
                >
                    <Image src="/devprep-logo.png" alt="DevPrep logo" width={26} height={26} unoptimized className="rounded-sm shrink-0" />
                    <span>DevPrep</span>
                </button>
                <div className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map((l) => (
                        <a key={l.href} href={l.href} style={monoStyle} className="text-[13px] font-bold tracking-[0.08em] text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors cursor-pointer no-underline">
                            {l.label.toUpperCase()}
                        </a>
                    ))}
                </div>
                <div className="hidden md:block">
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.push(ROUTES.signUp)} style={monoStyle} className="bg-[#1a1a1a] hover:bg-black text-white text-[13px] font-bold tracking-[0.08em] px-5 py-2.5 rounded-full cursor-pointer transition-colors">
                        START PRACTICING
                    </motion.button>
                </div>
                <button onClick={() => setDrawerOpen((v) => !v)} className="md:hidden text-[#1a1a1a] p-2 -mr-2" aria-label="Toggle menu">
                    {drawerOpen ? <CloseIcon size={22} /> : <Menu size={22} />}
                </button>
            </div>
            <AnimatePresence>
                {drawerOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="md:hidden absolute top-16 left-0 right-0 bg-[#f5f5f7] border-b border-[#e5e5e5] overflow-hidden">
                        <div className="px-6 py-6 flex flex-col gap-5">
                            {NAV_LINKS.map((l) => (
                                <a key={l.href} href={l.href} onClick={() => setDrawerOpen(false)} style={monoStyle} className="text-left text-[13px] font-bold tracking-[0.08em] text-[#1a1a1a]/80 no-underline">
                                    {l.label.toUpperCase()}
                                </a>
                            ))}
                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.push(ROUTES.signUp)} style={monoStyle} className="bg-[#1a1a1a] text-white text-[13px] font-bold tracking-[0.08em] px-5 py-3 rounded-full mt-1">
                                START PRACTICING
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

function Footer() {
    return (
        <footer className="bg-white pt-16 sm:pt-20 pb-10 px-6 border-t border-[#e5e5e5]">
            <div className="max-w-[1200px] mx-auto">
                <div className="flex flex-col md:flex-row gap-12 pb-12">
                    <div className="md:max-w-[300px]">
                        <div style={monoStyle} className="flex items-center gap-2.5 text-[15px] font-bold text-[#1a1a1a] mb-4">
                            <Image src="/devprep-logo.png" alt="DevPrep logo" width={26} height={26} unoptimized className="rounded-sm shrink-0" />
                            <span>DevPrep</span>
                        </div>
                        <p className="text-[14px] text-[#666] leading-relaxed mb-5">AI-powered mock interviews for the roles that matter. Practice with Zara, get real feedback, walk in confident.</p>
                        <div style={monoStyle} className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white text-[12px] font-medium px-4 py-2.5 rounded-md">
                            <span className="text-[#eb3a14]">&#10148;</span>
                            devprep --start
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col sm:flex-row gap-10 sm:gap-16">
                        <div>
                            <div style={monoStyle} className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-4">Product</div>
                            <ul className="space-y-3 text-[14px] text-[#1a1a1a]/75">
                                <li><Link href="/#features" className="hover:text-[#eb3a14] transition-colors">Features</Link></li>
                                <li><Link href="/#pricing" className="hover:text-[#eb3a14] transition-colors">Pricing</Link></li>
                                <li><Link href="/#how-it-works" className="hover:text-[#eb3a14] transition-colors">How It Works</Link></li>
                                <li><a href={ROUTES.allRoles} className="hover:text-[#eb3a14] transition-colors">All Roles</a></li>
                            </ul>
                        </div>
                        <div>
                            <div style={monoStyle} className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-4">Company</div>
                            <ul className="space-y-3 text-[14px] text-[#1a1a1a]/75">
                                <li><a href={ROUTES.about} className="hover:text-[#eb3a14] transition-colors">About</a></li>
                                <li><a href={ROUTES.blog} className="hover:text-[#eb3a14] transition-colors">Blog</a></li>
                                <li><a href={ROUTES.privacy} className="hover:text-[#eb3a14] transition-colors font-semibold text-[#1a1a1a]">Privacy Policy</a></li>
                                <li><a href={ROUTES.terms} className="hover:text-[#eb3a14] transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                        <div>
                            <div style={monoStyle} className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-4">Follow</div>
                            <ul className="space-y-3 text-[14px] text-[#1a1a1a]/75">
                                <li><a href={ROUTES.twitter} className="hover:text-[#eb3a14] transition-colors">Twitter / X</a></li>
                                <li><a href={ROUTES.linkedin} className="hover:text-[#eb3a14] transition-colors">LinkedIn</a></li>
                                <li><a href={ROUTES.github} className="hover:text-[#eb3a14] transition-colors">GitHub</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="pt-8 border-t border-[#e5e5e5] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#999]">
                    <span>&#169; 2026 DevPrep. All rights reserved.</span>
                    <span style={monoStyle}>Built with Groq Whisper &#183; Judge0 &#183; Gemini</span>
                </div>
            </div>
        </footer>
    );
}

function SectionHeading({ n, title }: { n: string; title: string }) {
    return (
        <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1a1a1a] tracking-[-0.02em] mb-4">
            <span style={monoStyle} className="text-[#eb3a14] mr-1.5 text-[15px]">{n}.</span>
            {title}
        </h2>
    );
}

function Body({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-[15px] text-[#555] leading-[1.8] [&_strong]:text-[#1a1a1a] [&_strong]:font-semibold">
            {children}
        </div>
    );
}

function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <p className={`mb-0 ${className}`}>{children}</p>;
}

function SubHeading({ children }: { children: React.ReactNode }) {
    return <p className="mt-4 font-semibold text-[#1a1a1a]">{children}</p>;
}

function BulletList({ items }: { items: React.ReactNode[] }) {
    return (
        <ul className="mt-2 space-y-1.5 pl-0">
            {items.map((item, i) => (
                <li key={i} className="flex gap-2">
                    <span className="text-[#eb3a14] shrink-0 mt-[0.35em] text-[10px]">&#9658;</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function A({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
    return (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-[#eb3a14] hover:underline inline-flex items-center gap-0.5">
            {children}
            {external && <ExternalLink size={12} className="shrink-0" />}
        </a>
    );
}

function Divider() {
    return <div className="my-10 border-t border-[#f0f0f0]" />;
}

const SECTION_META = [
    { number: "1", title: "Introduction" },
    { number: "2", title: "Information We Collect" },
    { number: "3", title: "How We Use Your Information" },
    { number: "4", title: "Third-Party Service Providers" },
    { number: "5", title: "Data Storage & Retention" },
    { number: "6", title: "We Do Not Sell Your Data" },
    { number: "7", title: "Cookies and Tracking" },
    { number: "8", title: "Data Security" },
    { number: "9", title: "Your Rights" },
    { number: "10", title: "Children's Privacy" },
    { number: "11", title: "International Users & Legal Basis" },
    { number: "12", title: "Changes to This Policy" },
    { number: "13", title: "Contact Us" },
];

export default function PrivacyPage() {
    const providers = [
        {
            name: "Groq",
            role: "Voice Transcription",
            detail: "Your audio from interview sessions is sent to Groq's Whisper API for real-time speech-to-text transcription. Groq processes audio in-stream to return a text transcript and does not retain audio beyond what is required for that immediate request. Groq's API terms prohibit using API input data for model training.",
            link: "https://groq.com/privacy-policy/",
            linkLabel: "Groq Privacy Policy",
        },
        {
            name: "Google Gemini API",
            role: "AI Interview & Feedback",
            detail: "Transcripts of your interview responses are sent to Google's Gemini API, which powers Zara (DevPrep's AI interviewer) and generates your structured feedback reports. Google's API usage terms stipulate that data submitted via the API is not used to train Google's public AI models.",
            link: "https://ai.google.dev/gemini-api/terms",
            linkLabel: "Google Gemini API Terms",
        },
        {
            name: "Neon",
            role: "Database Hosting",
            detail: "DevPrep's user accounts, interview transcripts, session metadata, and feedback reports are stored in a PostgreSQL database hosted by Neon. Neon is a managed serverless Postgres provider and acts as a data processor on our behalf under standard data processing terms.",
            link: "https://neon.tech/privacy-policy",
            linkLabel: "Neon Privacy Policy",
        },
        {
            name: "Google OAuth",
            role: "Authentication",
            detail: "When you sign in with Google, Google authenticates your identity and returns your name, email address, and profile picture to DevPrep. We do not receive your Google password. Google OAuth data is used solely for authentication and basic profile setup.",
            link: "https://policies.google.com/privacy",
            linkLabel: "Google Privacy Policy",
        },
    ];

    return (
        <>
            <title>Privacy Policy &mdash; DevPrep</title>
            <meta name="description" content="DevPrep's Privacy Policy: how we collect, use, and protect your data when you use our AI mock interview platform." />
            <div className="min-h-screen bg-[#f5f5f7] text-[#1a1a1a] overflow-x-hidden selection:bg-[#eb3a14]/20">
                <GlobalNav />

                <section className="pt-[112px] px-6">
                    <div className="max-w-[780px] mx-auto text-center pt-12 pb-10">
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                            <div style={monoStyle} className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#666] mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#eb3a14]" />
                                legal
                            </div>
                            <h1 className="text-[40px] sm:text-[52px] font-bold text-[#1a1a1a] tracking-[-0.03em] leading-[1.05] mb-4">
                                Privacy Policy
                            </h1>
                            <p style={monoStyle} className="text-[13px] text-[#999] tracking-[0.02em]">
                                Last updated: {LAST_UPDATED}
                            </p>
                        </motion.div>
                    </div>
                </section>

                <section className="pb-24 px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="max-w-[780px] mx-auto bg-white rounded-[20px] shadow-[0_4px_40px_rgba(0,0,0,0.07),0_1px_4px_rgba(0,0,0,0.04)] border border-[#e5e5e5]/60 px-8 sm:px-12 py-12"
                    >
                        <nav aria-label="Table of contents" className="mb-10 p-5 bg-[#f5f5f7] rounded-xl border border-[#e5e5e5]">
                            <p style={monoStyle} className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#999] mb-3">Contents</p>
                            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] text-[#555] list-none m-0 p-0">
                                {SECTION_META.map((s) => (
                                    <li key={s.number}>
                                        <a href={`#s${s.number}`} className="hover:text-[#eb3a14] transition-colors">
                                            {s.number}. {s.title}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </nav>

                        {/* Section 1 */}
                        <section id="s1" className="scroll-mt-24">
                            <SectionHeading n="1" title="Introduction" />
                            <Body>
                                <P>Welcome to DevPrep. DevPrep is an AI-powered mock interview platform that helps software engineers and developers prepare for technical and behavioral interviews. The platform is operated by the DevPrep team and is accessible at <A href={SITE_URL} external>dev-prep-frontend.vercel.app</A>.</P>
                                <P className="mt-3">This Privacy Policy explains what information we collect when you use DevPrep, how we use it, who we share it with, and what rights you have over your data. By creating an account or using any part of the DevPrep platform, you agree to the practices described in this policy. If you do not agree, please do not use the service.</P>
                                <P className="mt-3">We have written this policy to be straightforward and human-readable &mdash; because our users are developers, and developers deserve to actually understand what they are agreeing to.</P>
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 2 */}
                        <section id="s2" className="scroll-mt-24">
                            <SectionHeading n="2" title="Information We Collect" />
                            <Body>
                                <P>We collect the following categories of information:</P>
                                <SubHeading>Account &amp; Profile Information</SubHeading>
                                <BulletList items={["Your name and email address", "OAuth profile data provided by Google Sign-In (profile picture, Google account ID)", "Account preferences and settings you configure within DevPrep"]} />
                                <SubHeading>Voice &amp; Audio Data</SubHeading>
                                <BulletList items={[<>Audio captured through your microphone during mock interview sessions, which is sent to <strong>Groq&apos;s Whisper API</strong> for real-time speech-to-text transcription</>, "Audio is processed in transit and is not retained by DevPrep beyond what is necessary to produce the transcription (see Section 5 for retention details)"]} />
                                <SubHeading>Interview Content</SubHeading>
                                <BulletList items={["Your spoken and typed responses during interview sessions, after transcription", <>Conversation history between you and Zara, DevPrep&apos;s AI interviewer, which is processed by <strong>Google&apos;s Gemini API</strong> to generate questions, follow-ups, and feedback</>, "Session metadata: role chosen, difficulty level, interview duration, score breakdowns, and AI-generated feedback reports"]} />
                                <SubHeading>Technical &amp; Usage Data</SubHeading>
                                <BulletList items={["IP address", "Browser type and version, operating system, device type", "Pages visited within DevPrep and session timestamps", "Referring URLs (how you arrived at DevPrep), if applicable"]} />
                                <SubHeading>Cookies</SubHeading>
                                <BulletList items={["Session and authentication cookies used to keep you logged in (see Section 7)"]} />
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 3 */}
                        <section id="s3" className="scroll-mt-24">
                            <SectionHeading n="3" title="How We Use Your Information" />
                            <Body>
                                <P>We use the information we collect to:</P>
                                <BulletList items={[
                                    <><strong>Run your interview sessions</strong> &mdash; transcribing your voice responses and feeding your answers to the AI interviewer (Zara) to produce realistic, context-aware follow-up questions</>,
                                    <><strong>Generate AI feedback</strong> &mdash; analyzing your performance and producing structured feedback reports (communication, technical depth, problem-solving, etc.)</>,
                                    <><strong>Maintain your account</strong> &mdash; authenticating you, storing your interview history, and personalizing your experience</>,
                                    <><strong>Improve DevPrep</strong> &mdash; understanding usage patterns so we can fix bugs, improve features, and build a better product</>,
                                    <><strong>Communicate with you</strong> &mdash; sending account-related emails (sign-up confirmation, password changes, significant policy updates) and, if you opt in, product announcements</>,
                                    <><strong>Maintain security</strong> &mdash; detecting and preventing fraud, abuse, or unauthorized access to your account</>,
                                ]} />
                                <div className="mt-5 p-4 bg-[#f5f5f7] rounded-lg border border-[#e5e5e5]">
                                    <p className="font-semibold text-[#1a1a1a] text-[15px]">We do not use your data to train third-party AI models.</p>
                                    <p className="mt-1 text-[13px] text-[#666] leading-relaxed">Your interview content, voice data, and responses are used solely to operate DevPrep&apos;s features. They are passed to third-party APIs (Groq, Gemini) for processing, but we do not grant those providers rights to use your data for model training, and their API terms explicitly restrict this for API usage (see Section 4).</p>
                                </div>
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 4 */}
                        <section id="s4" className="scroll-mt-24">
                            <SectionHeading n="4" title="Third-Party Service Providers" />
                            <Body>
                                <P>DevPrep relies on a small number of trusted third-party providers to deliver its core functionality. Each provider receives only the minimum data required to perform its specific function. Their own privacy policies also govern how they handle any data they process on our behalf.</P>
                                <div className="mt-5 space-y-4">
                                    {providers.map((p) => (
                                        <div key={p.name} className="p-4 rounded-xl border border-[#e5e5e5] bg-[#fafafa]">
                                            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-[#1a1a1a]">{p.name}</span>
                                                    <span style={monoStyle} className="text-[10px] uppercase tracking-[0.06em] text-[#eb3a14] bg-[#eb3a14]/[0.08] px-2 py-0.5 rounded-full">{p.role}</span>
                                                </div>
                                                <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#999] hover:text-[#eb3a14] transition-colors inline-flex items-center gap-1 shrink-0">
                                                    {p.linkLabel} <ExternalLink size={11} />
                                                </a>
                                            </div>
                                            <p className="text-[14px] text-[#666] leading-relaxed">{p.detail}</p>
                                        </div>
                                    ))}
                                </div>
                                <P className="mt-5">We do not sell, rent, or share your personal data with advertisers, data brokers, or any other third parties not listed above.</P>
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 5 */}
                        <section id="s5" className="scroll-mt-24">
                            <SectionHeading n="5" title="Data Storage & Retention" />
                            <Body>
                                <P>Your data is stored in a Neon-hosted PostgreSQL database. Here is how long we retain different categories of data:</P>
                                <BulletList items={[
                                    <><strong>Account information</strong> (name, email, preferences) is retained for as long as your account is active, or until you request deletion.</>,
                                    <><strong>Interview transcripts and feedback reports</strong> are retained for as long as your account is active, so you can review your history and track progress. You can delete individual sessions from your dashboard at any time.</>,
                                    <><strong>Voice audio</strong> is used only for the purpose of transcription via the Groq Whisper API. Audio is processed in-stream and is not stored by DevPrep beyond what is necessary for that transcription request. We do not maintain a long-term audio archive.</>,
                                    <><strong>Technical and usage logs</strong> (IP addresses, session timestamps) may be retained for up to 90 days for security and debugging purposes, after which they are purged.</>,
                                ]} />
                                <P className="mt-3">When you delete your account, your personal data (account info, interview transcripts, and associated session data) is removed from our primary database within 30 days of your deletion request. Residual data in backups may persist for up to an additional 30 days before being overwritten.</P>
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 6 */}
                        <section id="s6" className="scroll-mt-24">
                            <SectionHeading n="6" title="We Do Not Sell Your Data" />
                            <Body>
                                <div className="p-5 bg-[#1a1a1a] rounded-xl text-white">
                                    <p className="text-[17px] font-semibold leading-snug">DevPrep does not sell, trade, or rent your personal information to anyone. Ever.</p>
                                    <p className="mt-3 text-[14px] text-white/70 leading-relaxed">We are not in the business of monetizing your data. Our revenue comes from subscriptions. Your interview content, voice data, and account information are not for sale &mdash; to advertisers, data brokers, analytics companies, or any other third party.</p>
                                </div>
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 7 */}
                        <section id="s7" className="scroll-mt-24">
                            <SectionHeading n="7" title="Cookies and Tracking" />
                            <Body>
                                <P>DevPrep uses the following types of cookies:</P>
                                <BulletList items={[
                                    <><strong>Session cookies</strong> &mdash; temporary cookies that keep you authenticated during a browser session. These expire when you close your browser.</>,
                                    <><strong>Persistent authentication tokens</strong> &mdash; stored in your browser&apos;s local storage to keep you logged in across sessions, so you do not have to sign in every time.</>,
                                ]} />
                                <div className="mt-4 p-4 bg-[#f5f5f7] rounded-lg border border-[#e5e5e5]">
                                    <p className="font-medium text-[#1a1a1a] text-[15px]">No third-party analytics or advertising cookies</p>
                                    <p className="mt-1 text-[14px] text-[#666] leading-relaxed">We currently do not use third-party analytics services (such as Google Analytics) or advertising cookies on DevPrep. If this changes in the future, we will update this policy and, where required, request your consent before setting any such cookies.</p>
                                </div>
                                <P className="mt-3">You can clear cookies and local storage through your browser settings at any time. Note that clearing authentication tokens will log you out of DevPrep.</P>
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 8 */}
                        <section id="s8" className="scroll-mt-24">
                            <SectionHeading n="8" title="Data Security" />
                            <Body>
                                <P>We take the security of your data seriously and implement reasonable technical and organizational measures to protect it, including:</P>
                                <BulletList items={[
                                    <><strong>Encryption in transit</strong> &mdash; all data transmitted between your browser, DevPrep&apos;s servers, and third-party APIs (Groq, Gemini, Neon) is encrypted using HTTPS/TLS.</>,
                                    <><strong>Access controls</strong> &mdash; your interview data is scoped to your account. We do not expose other users&apos; data and apply row-level access checks at the database layer.</>,
                                    <><strong>Secret management</strong> &mdash; API keys and credentials are stored as environment variables and are never exposed in client-side code.</>,
                                    <><strong>Authentication via Google OAuth</strong> &mdash; we offload authentication to Google, so we never handle or store your password.</>,
                                ]} />
                                <p className="mt-4 text-[14px] text-[#888] italic leading-relaxed">No method of electronic transmission or storage is 100% secure. While we use commercially reasonable means to protect your data, we cannot guarantee absolute security. If you believe your account has been compromised, please contact us immediately at <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>.</p>
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 9 */}
                        <section id="s9" className="scroll-mt-24">
                            <SectionHeading n="9" title="Your Rights" />
                            <Body>
                                <P>You have the following rights over your data. To exercise any of these, email us at <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A> with your request:</P>
                                <BulletList items={[
                                    <><strong>Access</strong> &mdash; request a copy of the personal data we hold about you.</>,
                                    <><strong>Correction</strong> &mdash; request that we correct inaccurate or incomplete information associated with your account.</>,
                                    <><strong>Export</strong> &mdash; request a machine-readable export of your interview transcripts and feedback history.</>,
                                    <><strong>Deletion</strong> &mdash; request that we delete your account and all associated data (interview transcripts, feedback reports, voice processing history). Upon verification, we will remove your data from our primary database within 30 days. You can also delete individual interview sessions directly from your dashboard.</>,
                                    <><strong>Objection to processing</strong> &mdash; object to certain uses of your data, where applicable under law.</>,
                                ]} />
                                <P className="mt-3">We will respond to data requests within 30 days. In exceptional cases, we may require identity verification before actioning sensitive requests.</P>
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 10 */}
                        <section id="s10" className="scroll-mt-24">
                            <SectionHeading n="10" title="Children's Privacy" />
                            <Body>
                                <P>DevPrep is not directed at children under the age of 16. We do not knowingly collect personal information from anyone under 16 years old. If you are a parent or guardian and believe your child has provided us with personal information without your consent, please contact us at <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A> and we will take steps to delete that information promptly.</P>
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 11 */}
                        <section id="s11" className="scroll-mt-24">
                            <SectionHeading n="11" title="International Users & Legal Basis" />
                            <Body>
                                <P>DevPrep is accessible globally. If you are accessing DevPrep from outside India, please be aware that your information may be transferred to and processed on servers located in other countries, including those operated by our third-party providers (Groq, Google, Neon).</P>
                                <P className="mt-3">By using DevPrep, you consent to the collection, transfer, and processing of your data in accordance with this Privacy Policy.</P>
                                <P className="mt-3">If you are located in the European Economic Area (EEA), the United Kingdom, or another jurisdiction with GDPR-equivalent regulations, you have additional rights that apply to you, including:</P>
                                <BulletList items={["Right of access (Article 15 GDPR)", "Right to rectification (Article 16 GDPR)", <>Right to erasure / &ldquo;right to be forgotten&rdquo; (Article 17 GDPR)</>, "Right to data portability (Article 20 GDPR)", "Right to object to processing (Article 21 GDPR)"]} />
                                <P className="mt-3">Our legal basis for processing your data is primarily contractual necessity (to provide the service you signed up for) and, where applicable, your explicit consent. To exercise GDPR rights, contact us at <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>.</P>
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 12 */}
                        <section id="s12" className="scroll-mt-24">
                            <SectionHeading n="12" title="Changes to This Policy" />
                            <Body>
                                <P>We may update this Privacy Policy from time to time as our product evolves or to reflect changes in applicable law. When we do:</P>
                                <BulletList items={[
                                    <>The &ldquo;Last updated&rdquo; date at the top of this page will be revised.</>,
                                    "For minor changes (clarifications, formatting), the updated date is sufficient notice.",
                                    "For material changes &mdash; those that meaningfully affect your rights or how we process your data &mdash; we will notify you by email at least 7 days before the changes take effect.",
                                ]} />
                                <P className="mt-3">Continued use of DevPrep after a policy update constitutes acceptance of the revised policy.</P>
                            </Body>
                        </section>
                        <Divider />

                        {/* Section 13 */}
                        <section id="s13" className="scroll-mt-24">
                            <SectionHeading n="13" title="Contact Us" />
                            <Body>
                                <P>If you have questions about this Privacy Policy, want to exercise your data rights, or have a privacy concern you would like to raise, reach out to us:</P>
                                <div className="mt-4 p-5 rounded-xl border border-[#e5e5e5] bg-[#fafafa] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div style={monoStyle} className="text-[#eb3a14] text-[28px] leading-none select-none font-bold">@</div>
                                    <div>
                                        <p style={monoStyle} className="text-[11px] text-[#999] uppercase tracking-[0.08em] mb-1">Privacy &amp; Data Requests</p>
                                        <a href={`mailto:${CONTACT_EMAIL}`} className="text-[17px] font-semibold text-[#1a1a1a] hover:text-[#eb3a14] transition-colors">{CONTACT_EMAIL}</a>
                                    </div>
                                </div>
                                <P className="mt-4">We aim to respond to all privacy-related inquiries within 30 days. Please include &ldquo;Privacy Request&rdquo; in the subject line so we can prioritize your message.</P>
                            </Body>
                        </section>

                        <div className="mt-12 pt-8 border-t border-[#f0f0f0] text-center">
                            <p className="text-[14px] text-[#999]">Questions about your privacy? <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#eb3a14] font-medium hover:underline">Drop us an email.</a></p>
                            <div className="mt-4 flex items-center justify-center gap-3">
                                <a href={ROUTES.terms} style={monoStyle} className="text-[12px] text-[#999] hover:text-[#1a1a1a] transition-colors">Terms of Service</a>
                                <span className="text-[#e5e5e5]">&#183;</span>
                                <a href={ROUTES.home} style={monoStyle} className="text-[12px] text-[#999] hover:text-[#1a1a1a] transition-colors">Back to DevPrep</a>
                            </div>
                        </div>
                    </motion.div>
                </section>

                <Footer />
            </div>
        </>
    );
}
