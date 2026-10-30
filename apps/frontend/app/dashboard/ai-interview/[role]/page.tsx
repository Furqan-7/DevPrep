"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronDown, Mic, ArrowLeft, Clock, AlertCircle } from "lucide-react";
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
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: EASE, delay: (index % 5) * 0.04 }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-left rounded-2xl border border-dp-ln bg-dp-sf2 px-4 sm:px-5 py-4 transition-colors hover:border-dp-ac/50 cursor-pointer group"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <span style={monoStyle} className="shrink-0 rounded-md bg-dp-soft px-2 py-0.5 text-[12px] font-bold tabular-nums text-dp-ac">
            {String(index).padStart(2, "0")}
          </span>
          <span className="flex-1 text-[14px] sm:text-[15px] font-medium leading-snug text-dp-ink">{question}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: EASE }} className="shrink-0 text-dp-mu group-hover:text-dp-ink">
            <ChevronDown size={16} />
          </motion.span>
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
              <p className="mt-3 pt-3 border-t border-dp-ln pl-[44px] sm:pl-[52px] text-[13px] leading-relaxed text-dp-mu">
                Zara may ask this or a follow-up on it. Answer out loud in the practice interview to get a score and feedback.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
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
      <DashboardShell themed>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-dp-mu text-sm">
          Role not found.{" "}
          <button
            onClick={() => router.push("/dashboard/ai-interview")}
            className="mt-4 text-dp-ink font-bold underline underline-offset-4"
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
        candidateName?: string | null;
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
          firstQuestion: json.question,   // now "Tell me about yourself."
          totalQuestions: json.totalQuestions,
          candidateName: json.candidateName ?? null,
          title: meta.title,
          duration: meta.duration,
          skills: meta.skills,
        })
      );


      router.push(`/dashboard/ai-interview/${slug}/session`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const serverMsg: string | undefined = axiosErr?.response?.data?.message;
      showError(serverMsg ?? "Failed to start interview. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  const errorBadge = startError && (
    <div role="alert" className="mx-auto flex max-w-md items-start gap-2 rounded-xl border border-dp-ln border-l-[3px] border-l-dp-ac bg-dp-sf2 px-4 py-3 text-left text-[13px] text-dp-ink">
      <AlertCircle size={14} className="mt-0.5 shrink-0 text-dp-ac" />
      <span>{startError}</span>
    </div>
  );

  return (
    <DashboardShell themed>
      <div className="min-h-[calc(100vh-64px)] antialiased">
        {/* ── Hero ── */}
        <section className="dp-glow">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-8 pt-6 sm:pt-8 pb-40 sm:pb-48">
            <button
              type="button"
              onClick={() => router.push("/dashboard/ai-interview")}
              style={monoStyle}
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-dp-mu hover:text-dp-ink transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              All interview roles
            </button>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-8 sm:mt-12 flex flex-col items-center text-center"
            >
              <span
                style={monoStyle}
                className="inline-flex items-center gap-2 rounded-full border border-dp-ln bg-dp-pill px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-dp-ink/80"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-dp-ok" />
                <Clock size={11} />
                {meta.duration} min practice interview
              </span>

              <h1 className="mt-6 max-w-[760px] text-[34px] sm:text-[46px] lg:text-[56px] font-bold leading-[1.04] tracking-[-0.035em] text-dp-ink">
                {meta.title}
                <span className="block text-dp-mu">interview practice.</span>
              </h1>

              <p className="mt-5 max-w-[520px] text-[15px] sm:text-[16px] leading-relaxed text-dp-mu">
                Review the most common <span className="text-dp-ink font-medium">{meta.title}</span> questions, then answer them out loud with Zara and get scored on every answer.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {meta.skills.map((skill) => (
                  <span
                    key={skill}
                    style={monoStyle}
                    className="rounded-full border border-dp-ln bg-dp-pill px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-dp-ink/75"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {startError && <div className="mt-6 w-full">{errorBadge}</div>}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleStartInterview}
                  disabled={starting}
                  style={monoStyle}
                  className="dp-btn-ember inline-flex items-center gap-2 h-12 px-7 rounded-full text-[13px] font-bold uppercase tracking-[0.05em] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Mic size={15} />
                  {starting ? "Starting…" : "Start AI interview"}
                </motion.button>
                <button
                  type="button"
                  onClick={() => document.getElementById("questions")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  style={monoStyle}
                  className="inline-flex items-center h-12 px-7 rounded-full border border-dp-ln bg-dp-sf/70 backdrop-blur-md text-[13px] font-bold uppercase tracking-[0.05em] text-dp-ink cursor-pointer hover:border-dp-ink transition-colors"
                >
                  See questions
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Questions ── */}
        <section id="questions" className="mx-auto max-w-[820px] px-5 sm:px-8 pt-4 pb-20 scroll-mt-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p style={monoStyle} className="text-[11px] font-medium uppercase tracking-[0.1em] text-dp-ac">
                Top questions
              </p>
              <h2 className="mt-2 text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] text-dp-ink">
                What Zara is likely to ask
              </h2>
            </div>
            <span style={monoStyle} className="hidden sm:block text-[11px] uppercase tracking-[0.1em] text-dp-mu">
              {String(questions.length).padStart(2, "0")} questions
            </span>
          </div>
          <div className="space-y-2.5">
            {questions.map((q, i) => (
              <QuestionItem key={i} index={i + 1} question={q} />
            ))}
          </div>

          {/* ── Bottom CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="dp-glow dp-glow--cta dp-glow--rise mt-14 relative overflow-hidden rounded-[28px] border border-dp-ln bg-dp-dk text-white text-center px-6 pt-12 pb-32 sm:pt-14 sm:pb-36"
          >
            <h2 className="text-[24px] sm:text-[32px] font-bold tracking-[-0.02em]">Ready when you are.</h2>
            <p className="mx-auto mt-3 max-w-[420px] text-[14px] sm:text-[15px] leading-relaxed text-white/65">
              A {meta.duration}-minute voice interview with Zara, tailored to the {meta.title} role.
            </p>
            {startError && <div className="mt-5">{errorBadge}</div>}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleStartInterview}
              disabled={starting}
              style={monoStyle}
              className="dp-btn-ember mt-7 inline-flex items-center gap-2 h-12 px-8 rounded-full text-[13px] font-bold uppercase tracking-[0.05em] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Mic size={15} />
              {starting ? "Starting…" : "Start now"}
            </motion.button>
          </motion.div>
        </section>
      </div>
    </DashboardShell>
  );
}
