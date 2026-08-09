"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronDown, Mic, ArrowLeft, Clock, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { RoleData } from "../data";
import api from "@/lib/api";

const monoStyle = {
  fontFamily: "var(--font-jbmono, 'JetBrains Mono', ui-monospace, monospace)",
} as const;

const EASE = [0.25, 0.8, 0.25, 1] as const;

// ── Static role metadata (UI only – no questions) ────────────────────────────

const ROLE_META: Record<string, Omit<RoleData, "questions">> = {
  "frontend-engineer": {
    title: "Front-End Developer",
    duration: 20,
    skills: ["HTML/CSS proficiency", "JavaScript expertise", "React & frameworks", "Web performance"],
  },
  "backend-engineer": {
    title: "Back-End Developer",
    duration: 20,
    skills: ["System Design", "REST APIs", "Databases", "Caching"],
  },
  "full-stack-developer": {
    title: "Full Stack Developer",
    duration: 25,
    skills: ["Node.js", "React", "PostgreSQL", "Docker"],
  },
  "dsa": {
    title: "Data Structures & Algorithms",
    duration: 18,
    skills: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "Complexity Analysis"],
  },
  "system-design": {
    title: "System Design",
    duration: 30,
    skills: ["Scalability", "Load Balancing", "Microservices", "CAP Theorem"],
  },
  "machine-learning-engineer": {
    title: "Machine Learning Engineer",
    duration: 20,
    skills: ["Machine Learning", "Deep Learning", "Data Analysis", "Python"],
  },
  "devops-engineer": {
    title: "DevOps Engineer",
    duration: 18,
    skills: ["CI/CD", "Kubernetes", "AWS", "Infrastructure as Code"],
  },
  "android-developer": {
    title: "Android Developer",
    duration: 18,
    skills: ["Kotlin", "Jetpack Compose", "Android SDK", "MVVM"],
  },
  "ios-developer": {
    title: "iOS Developer",
    duration: 18,
    skills: ["Swift", "SwiftUI", "UIKit", "Core Data"],
  },
  "data-engineer": {
    title: "Data Engineer",
    duration: 20,
    skills: ["Spark", "Kafka", "ETL Pipelines", "Data Warehousing"],
  },
  "product-manager": {
    title: "Product Manager",
    duration: 20,
    skills: ["Product Strategy", "Roadmapping", "Stakeholder Management", "Metrics"],
  },
  "behavioral-round": {
    title: "Behavioral Round",
    duration: 15,
    skills: ["Leadership", "Conflict Resolution", "Communication", "Teamwork"],
  },
};

// ── Sample questions shown on the page (static preview only) ─────────────────

const PREVIEW_QUESTIONS: Record<string, string[]> = {
  "frontend-engineer": [
    "What best practices should be followed for maintaining scalable and maintainable CSS/JS codebases?",
    "How do you ensure cross-browser compatibility in complex front-end projects?",
    "What advanced JavaScript concepts should be mastered for efficient front-end development?",
    "What approaches are used to optimize webpack/bundler performance at the front-end?",
    "How to structure CSS for large-scale responsive web applications?",
    "What are the main considerations when building responsive layouts?",
    "How to manage state and handle data flow in large JavaScript applications?",
    "What are the strategies for modularizing JavaScript code in enterprise front-end projects?",
    "What techniques are effective for debugging complex front-end issues?",
    "What are the principles behind progressive enhancement and graceful degradation in front-end development?",
  ],
  "backend-engineer": [
    "How do you design a scalable RESTful API from scratch?",
    "What are the key differences between SQL and NoSQL databases, and when would you choose each?",
    "How does database indexing work and how does it affect query performance?",
    "Explain the CAP theorem and its practical implications for distributed systems.",
    "How would you implement rate limiting on a high-traffic API?",
    "What caching strategies do you use to reduce database load?",
    "How do you handle database migrations in a production environment with zero downtime?",
    "What is the difference between horizontal and vertical scaling?",
    "How do you secure a backend API against common vulnerabilities (SQL injection, CSRF, XSS)?",
    "Explain the concept of message queues and when you would use them in a backend system.",
  ],
  "full-stack-developer": [
    "How do you architect a full-stack application for both performance and maintainability?",
    "Explain the difference between server-side rendering (SSR) and client-side rendering (CSR) and when to use each.",
    "How do you manage authentication and authorization across the frontend and backend?",
    "What strategies do you use for effective state management in a React application?",
    "How do you containerize a full-stack application using Docker and Docker Compose?",
    "How do you handle environment variables securely across development and production?",
    "Explain how you would set up a CI/CD pipeline for a full-stack project.",
    "How do you optimize database queries when working with an ORM like Prisma or Sequelize?",
    "What are WebSockets and how would you implement real-time features in a full-stack app?",
    "How do you approach testing across both the frontend and backend layers?",
  ],
  "dsa": [
    "What is the time and space complexity of common sorting algorithms? When would you use each?",
    "Explain the difference between a stack and a queue with real-world use cases.",
    "How does dynamic programming differ from recursion with memoization?",
    "What is a balanced binary search tree and why is balance important for performance?",
    "Explain Dijkstra's algorithm and its time complexity.",
    "When would you use a hash table over a binary search tree?",
    "What is the sliding window technique? Give an example problem where it applies.",
    "How does merge sort achieve O(n log n) time complexity?",
    "What is a trie and when is it more efficient than a hash map?",
    "Explain the two-pointer technique and give a problem it solves efficiently.",
  ],
  "system-design": [
    "How would you design a URL shortener like bit.ly?",
    "Explain the differences between monolithic and microservices architectures.",
    "How do you design a system to handle 10 million requests per day?",
    "What is consistent hashing and why is it used in distributed systems?",
    "How would you design a notification system that supports push, email, and SMS?",
    "What is the role of a load balancer and what algorithms can it use?",
    "How does a content delivery network (CDN) work and when should you use one?",
    "How would you design a distributed cache layer using Redis?",
    "Explain event-driven architecture and when you would choose it over synchronous APIs.",
    "How would you design the database schema for a social media feed like Twitter?",
  ],
  "machine-learning-engineer": [
    "What is the bias-variance tradeoff and how does it affect model selection?",
    "Explain the difference between supervised, unsupervised, and reinforcement learning.",
    "How do you handle class imbalance in a classification problem?",
    "What is gradient descent and how does learning rate affect convergence?",
    "Explain the purpose of regularization techniques like L1 and L2.",
    "How do you evaluate a machine learning model beyond accuracy?",
    "What is cross-validation and why is it important?",
    "How does a convolutional neural network (CNN) differ from a standard feedforward network?",
    "What is feature engineering and how does it impact model performance?",
    "How do you deploy a machine learning model to production and monitor its performance over time?",
  ],
  "devops-engineer": [
    "What is the difference between continuous integration, continuous delivery, and continuous deployment?",
    "How does Kubernetes orchestrate containerized applications?",
    "What is Infrastructure as Code (IaC) and how does Terraform implement it?",
    "How do you implement blue-green deployments to minimize downtime?",
    "What is a Kubernetes pod and how does it differ from a container?",
    "How do you monitor a production system and set up alerting for critical failures?",
    "Explain the difference between a Dockerfile and a docker-compose.yml file.",
    "How do you manage secrets and sensitive configuration in a cloud environment?",
    "What is the difference between a VM and a container?",
    "How would you set up auto-scaling for a web application on AWS?",
  ],
  "android-developer": [
    "What is the Android Activity lifecycle and how does it affect app state management?",
    "Explain the MVVM architecture pattern and how it relates to Android's Jetpack ViewModel.",
    "What is Jetpack Compose and how does it differ from the traditional View system?",
    "How does Kotlin coroutines simplify asynchronous programming in Android?",
    "What is the difference between SharedPreferences, Room, and a file for local data storage?",
    "How do you handle configuration changes (e.g., screen rotation) in Android?",
    "What is dependency injection and how does Hilt implement it in Android?",
    "How do you optimize RecyclerView performance for large datasets?",
    "What are intents and how are they used to navigate between activities?",
    "How do you test Android code using JUnit and Espresso?",
  ],
  "ios-developer": [
    "What is the difference between SwiftUI and UIKit, and how do they interoperate?",
    "How does Swift's memory management with ARC work?",
    "What is the difference between a struct and a class in Swift?",
    "How do you manage asynchronous code in Swift using async/await?",
    "What is Core Data and when would you use it over other storage solutions?",
    "Explain the delegate pattern and how it's used in iOS development.",
    "How do you implement navigation in a SwiftUI application?",
    "What is Combine and how does it relate to reactive programming in iOS?",
    "How do you handle push notifications in an iOS application?",
    "What are the best practices for debugging and profiling an iOS app using Xcode Instruments?",
  ],
  "data-engineer": [
    "What is the difference between an ETL and an ELT pipeline?",
    "How does Apache Spark achieve distributed data processing?",
    "What is Apache Kafka and when would you use it in a data pipeline?",
    "Explain the concept of data partitioning and why it matters for performance.",
    "What is the difference between a data lake and a data warehouse?",
    "How do you handle late-arriving data in a streaming pipeline?",
    "What are the key considerations when designing a data schema for analytics?",
    "How do you ensure data quality and consistency in a large-scale pipeline?",
    "What is orchestration in data engineering and how does Apache Airflow help?",
    "How would you optimize a slow SQL query running on a large dataset?",
  ],
  "product-manager": [
    "How do you prioritize features when everything seems equally important?",
    "Walk me through how you would define success metrics for a new product feature.",
    "How do you handle disagreements between engineering, design, and business stakeholders?",
    "What frameworks do you use for product discovery and understanding user needs?",
    "How do you structure a product roadmap and communicate it to different audiences?",
    "Describe how you would run an A/B test to validate a new feature hypothesis.",
    "How do you decide when to build, buy, or partner for a new product capability?",
    "What is your approach to gathering and synthesizing user feedback?",
    "How do you manage technical debt versus new feature development in your roadmap?",
    "Describe a product decision you made that turned out to be wrong and what you learned.",
  ],
  "behavioral-round": [
    "Tell me about a time you had to lead a team through a difficult technical challenge.",
    "Describe a situation where you disagreed with a colleague or manager. How did you resolve it?",
    "Give an example of a project where you had to work under significant time pressure.",
    "Tell me about a time you received critical feedback. How did you respond to it?",
    "Describe a situation where you had to make a decision with incomplete information.",
    "Tell me about a time you proactively identified and solved a problem before it escalated.",
    "How do you prioritize your work when you have multiple high-priority tasks?",
    "Describe a time you mentored or coached a junior team member.",
    "Tell me about a project that failed. What did you learn and what would you do differently?",
    "How have you handled a situation where a team member was not contributing effectively?",
  ],
};

// ── Accordion item (restyled per design system tokens + scroll animation) ────

function QuestionItem({ index, question }: { index: number; question: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: EASE, delay: (index % 5) * 0.05 }}
      className="w-full"
    >
      <div
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left border border-[#e5e5e5] rounded-xl p-5 bg-white hover:border-[#1a1a1a]/40 hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span
              style={monoStyle}
              className="text-[13px] font-bold text-[#eb3a14] shrink-0 tabular-nums bg-[#eb3a14]/[0.08] px-2 py-0.5 rounded"
            >
              {String(index).padStart(2, "0")}
            </span>
            <span className="text-[15px] font-semibold text-[#1a1a1a] leading-snug tracking-[-0.01em]">
              {question}
            </span>
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="shrink-0 text-[#666666] group-hover:text-[#1a1a1a] transition-colors"
          >
            <ChevronDown size={16} />
          </motion.div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-3.5 border-t border-[#e5e5e5] text-[13px] text-[#666666] leading-relaxed flex items-start gap-2">
                <Sparkles size={14} className="text-[#eb3a14] shrink-0 mt-0.5" />
                <span>
                  Expand this question in a live AI interview session to practice your voice or code response with Zara and receive instant personalized feedback.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RoleInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const rawRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const slug = rawRole ?? "";
  const meta = ROLE_META[slug];
  const questions = PREVIEW_QUESTIONS[slug] ?? [];

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  function showError(msg: string) {
    setStartError(msg);
    setTimeout(() => setStartError(null), 5000);
  }

  if (!meta) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#666666] text-sm bg-[#f5f5f7]">
          Role not found.{" "}
          <button
            onClick={() => router.push("/dashboard/ai-interview")}
            className="mt-4 text-[#1a1a1a] font-bold underline underline-offset-4"
          >
            Back to interviews
          </button>
        </div>
      </DashboardShell>
    );
  }

  /** Call the backend to create a session, then navigate to session page. */
  async function handleStartInterview() {
    if (!meta) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setStartError("You must be signed in to start an interview. Redirecting to sign in…");
      setTimeout(() => router.push("/auth/signin"), 1500);
      return;
    }

    setStarting(true);
    setStartError(null);
    try {
      const { data: json } = await api.post<{
        success: boolean;
        sessionId: number;
        question: string;
        questionNum: number;
        totalQuestions: number;
        message?: string;
      }>("/api/interview/generate", {
        role: slug,
        difficulty: "medium",
      });

      if (!json.success) {
        showError(json.message ?? "Failed to start interview. Please try again.");
        return;
      }

      sessionStorage.setItem(
        `interview_session_${slug}`,
        JSON.stringify({
          sessionId: json.sessionId,
          firstQuestion: json.question,
          totalQuestions: json.totalQuestions,
          title: meta.title,
          duration: meta.duration,
          skills: meta.skills,
        })
      );

      router.push(`/dashboard/ai-interview/${slug}/session`);
    } catch (err: any) {
      const serverMsg: string | undefined = err?.response?.data?.message;
      showError(serverMsg ?? "Failed to start interview. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <DashboardShell>
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "#F5F5F7",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 pt-8 pb-20">

          {/* ── Back link ── */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={() => router.push("/dashboard/ai-interview")}
            style={monoStyle}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors mb-8 cursor-pointer border-0 bg-transparent p-0"
          >
            <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />
            ALL INTERVIEW ROLES
          </motion.button>

          {/* ── Hero Section ── */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.04 },
              },
            }}
            className="mb-14"
          >
            {/* Duration pill */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
              }}
            >
              <div
                style={monoStyle}
                className="inline-flex items-center gap-2 rounded-full bg-[#eb3a14]/[0.08] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#eb3a14] mb-6"
              >
                <Clock size={11} className="text-[#eb3a14]" />
                {meta.duration} MINS PRACTICE INTERVIEW
              </div>
            </motion.div>

            {/* Headline (dominant focal point, matching landing hero style) */}
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
              }}
              className="font-extrabold text-[#1a1a1a] text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.05] tracking-[-0.03em] max-w-[850px] mb-6"
            >
              {meta.title}{" "}
              <span className="font-bold text-[#666]">interview questions & AI practice.</span>
            </motion.h1>

            {/* Skill pills */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
              }}
              className="flex flex-wrap gap-2 mb-6"
            >
              {meta.skills.map((skill) => (
                <span
                  key={skill}
                  style={monoStyle}
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.08em] uppercase border border-[#e5e5e5] bg-white text-[#666666]"
                >
                  {skill}
                </span>
              ))}
            </motion.div>

            {/* Subtext description */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
              }}
              className="text-[#666] text-[16px] sm:text-[18px] leading-relaxed max-w-[620px] mb-8"
            >
              Check out 10 of the most common{" "}
              <span className="text-[#1a1a1a] font-semibold">{meta.title}</span> interview questions and
              take an AI‑powered practice interview.
            </motion.p>

            {/* Error badge if any */}
            {startError && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs mb-6 max-w-md">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{startError}</span>
              </div>
            )}

            {/* Primary Hero CTA Button */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
              }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleStartInterview}
                disabled={starting}
                style={monoStyle}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1a1a1a] hover:bg-black text-white text-[13px] font-bold tracking-[0.08em] uppercase cursor-pointer transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Mic size={15} />
                {starting ? "Starting…" : "Take practice AI interview"}
              </motion.button>
            </motion.div>
          </motion.div>

          {/* ── Divider ── */}
          <div className="border-t border-[#e5e5e5] mb-12" />

          {/* ── Two-column layout ── */}
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Left: sticky label */}
            <div className="lg:w-64 shrink-0">
              <div className="lg:sticky lg:top-24">
                <p
                  style={monoStyle}
                  className="text-[11px] text-[#eb3a14] uppercase tracking-[0.1em] font-medium mb-3"
                >
                  TOP QUESTIONS
                </p>
                <p className="text-xl md:text-2xl font-extrabold text-[#1a1a1a] leading-tight tracking-[-0.02em]">
                  10 of the most common{" "}
                  <span className="text-[#666] font-bold">{meta.title} questions</span>
                </p>
              </div>
            </div>

            {/* Right: accordion questions */}
            <div className="flex-1 space-y-3">
              {questions.map((q, i) => (
                <QuestionItem key={i} index={i + 1} question={q} />
              ))}
            </div>
          </div>

          {/* ── Bottom CTA banner (Restyled + Scroll Entrance) ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-20 relative rounded-3xl overflow-hidden bg-[#1a1a1a] text-white p-10 md:p-14 text-center border border-[#1a1a1a] shadow-xl"
          >
            <div className="max-w-2xl mx-auto flex flex-col items-center">
              <div
                style={monoStyle}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#eb3a14] mb-6 border border-white/15"
              >
                <Mic size={11} className="text-[#eb3a14]" />
                AI-POWERED · INSTANT FEEDBACK
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[-0.02em] text-white mb-4">
                Take practice AI interview
              </h2>
              <p className="text-white/70 text-[15px] sm:text-[16px] leading-relaxed max-w-lg mb-8">
                Put your skills to the test and receive instant feedback on your performance — tailored specifically for the <span className="text-white font-semibold">{meta.title}</span> role.
              </p>
              {startError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-6 max-w-sm">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>{startError}</span>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleStartInterview}
                disabled={starting}
                style={monoStyle}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#eb3a14] hover:bg-[#d63410] text-white text-[13px] font-bold tracking-[0.08em] uppercase cursor-pointer transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Mic size={15} />
                {starting ? "Starting…" : "Start now"}
              </motion.button>
            </div>
          </motion.div>

        </div>
      </div>
    </DashboardShell>
  );
}
