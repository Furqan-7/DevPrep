"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronDown, Mic, ArrowLeft, Clock } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { RoleData } from "../data";
import api from "@/lib/api";

// ── Static role metadata (UI only – no questions) ────────────────────────────
// Questions & session data come from the backend when "Start Interview" is hit.

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

// ── Accordion item ─────────────────────────────────────────────────────────────

function QuestionItem({ index, question }: { index: number; question: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="w-full text-left border border-white/[0.08] rounded-xl px-5 py-4 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-[10px] font-mono text-brand-muted/50 pt-0.5 flex-shrink-0 tabular-nums">
            {String(index).padStart(2, "0")}
          </span>
          <span className="text-sm font-medium text-white leading-snug">{question}</span>
        </div>
        <ChevronDown
          size={15}
          className={`flex-shrink-0 text-brand-muted transition-transform duration-200 mt-0.5 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      {open && (
        <div className="mt-3 ml-7 text-xs text-brand-muted leading-relaxed border-t border-white/[0.06] pt-3">
          Expand this question in a live AI interview session to get a detailed, personalised answer
          and feedback on your own response.
        </div>
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RoleInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.role) ? params.role[0] : params.role ?? "";
  const meta = ROLE_META[slug];
  const questions = PREVIEW_QUESTIONS[slug] ?? [];

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  if (!meta) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand-muted text-sm">
          Role not found.{" "}
          <button
            onClick={() => router.push("/dashboard/ai-interview")}
            className="mt-4 text-white underline underline-offset-4"
          >
            Back to interviews
          </button>
        </div>
      </DashboardShell>
    );
  }

  /** Call the backend to create a session, then navigate to session page. */
  async function handleStartInterview() {
    setStarting(true);
    setStartError(null);
    try {
      const { data: json } = await api.post<{
        success: boolean;
        sessionId: number;
        question: string;
        questionNum: number;
        totalQuestions: number;
      }>("/api/interview/generate", {
        role: slug,
        difficulty: "medium",
      });

      // Store session data so the session page can read it without an extra
      // network call.
      sessionStorage.setItem(
        `interview_session_${slug}`,
        JSON.stringify({
          sessionId: json.sessionId,
          firstQuestion: json.question,
          totalQuestions: json.totalQuestions,
          // Attach role meta so the session page has title / skills / duration
          title: meta.title,
          duration: meta.duration,
          skills: meta.skills,
        })
      );

      router.push(`/dashboard/ai-interview/${slug}/session`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to start interview. Please try again.";
      setStartError(msg);
    } finally {
      setStarting(false);
    }
  }

  return (
    <DashboardShell>
      {/* ── Glow ── */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-indigo-600/8 blur-[140px] -z-10" />

      <div className="max-w-7xl mx-auto px-10 pt-10 pb-20">

        {/* ── Back link ── */}
        <button
          onClick={() => router.push("/dashboard/ai-interview")}
          className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          All interview roles
        </button>

        {/* ── Hero ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[10px] text-brand-muted uppercase tracking-widest font-semibold mb-3">
            <Clock size={10} />
            {meta.duration} mins interview
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white mb-4 leading-tight">
            {meta.title}{" "}
            <span className="text-brand-muted font-normal">interview questions</span>
          </h1>

          {/* Skill pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {meta.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-full text-xs font-semibold border border-white/10 bg-white/[0.03] text-brand-muted"
              >
                {skill}
              </span>
            ))}
          </div>

          <p className="text-sm text-brand-muted max-w-2xl leading-relaxed mb-6">
            Check out 10 of the most common{" "}
            <span className="text-white font-medium">{meta.title}</span> interview questions and
            take an AI‑powered practice interview.
          </p>

          {/* Error */}
          {startError && (
            <p className="text-xs text-red-400 mb-4">{startError}</p>
          )}

          {/* CTA */}
          <button
            onClick={handleStartInterview}
            disabled={starting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:bg-white/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Mic size={13} />
            {starting ? "Starting…" : "Take practice AI interview"}
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-white/[0.06] mb-10" />

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left: sticky label */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <p className="text-[10px] text-brand-muted uppercase tracking-widest font-bold mb-2">
                Top questions
              </p>
              <p className="text-xl md:text-2xl font-display font-bold text-white leading-snug">
                10 of the most common{" "}
                <span className="text-brand-muted font-normal">{meta.title} interview questions</span>
              </p>
            </div>
          </div>

          {/* Right: accordion */}
          <div className="flex-1 space-y-2.5">
            {questions.map((q, i) => (
              <QuestionItem key={i} index={i + 1} question={q} />
            ))}
          </div>
        </div>

        {/* ── Bottom CTA banner ── */}
        <div className="mt-20 relative rounded-3xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
          {/* Glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-violet-600/10" />
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full bg-indigo-500/15 blur-[80px]" />

          <div className="relative z-10 flex flex-col items-center text-center px-8 py-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-brand-muted mb-5">
              <Mic size={10} className="text-white/60" />
              AI-Powered · Instant feedback
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-white mb-3">
              Take practice AI interview
            </h2>
            <p className="text-sm text-brand-muted max-w-md leading-relaxed mb-8">
              Put your skills to the test and receive instant feedback on your performance — tailored
              specifically for the <span className="text-white">{meta.title}</span> role.
            </p>
            {startError && (
              <p className="text-xs text-red-400 mb-4">{startError}</p>
            )}
            <button
              onClick={handleStartInterview}
              disabled={starting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-sm font-bold shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-white/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Mic size={14} />
              {starting ? "Starting…" : "Start now"}
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
