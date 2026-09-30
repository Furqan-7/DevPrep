import { prisma } from "@repo/database";
import { InterviewQuestions, InterviewSessionSchema } from "../types";
import { processInterviewTurn, TOTAL_QUESTIONS } from "../services/interview-engine.service";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../packages/database/.env") });

/**
 * Curated initial interview question bank per role.
 * Instant lookup (<1ms) avoids blocking 3-7s LLM generation on start.
 */
export const ROLE_FIRST_QUESTIONS: Record<string, string[]> = {
    "frontend-engineer": [
        "What best practices should be followed for maintaining scalable and maintainable CSS/JS codebases?",
        "How do you ensure cross-browser compatibility and handle performance bottlenecks in complex front-end applications?",
        "Can you explain the Virtual DOM in React and how reconciliation works under the hood?",
    ],
    "backend-engineer": [
        "How do you design a scalable RESTful API, and what architectural considerations do you keep in mind?",
        "What strategies do you use for database indexing and query optimization when handling high concurrency?",
        "Can you explain the CAP theorem and its practical trade-offs in distributed systems?",
    ],
    "full-stack-developer": [
        "How do you structure data flow and authentication across the frontend and backend in a modern web app?",
        "What factors guide your decision when choosing server-side rendering (SSR) versus client-side rendering (CSR)?",
        "How do you handle database migration and schema updates with zero downtime in production?",
    ],
    "dsa": [
        "What is the difference between dynamic programming and recursion with memoization? Can you give an example?",
        "How do you analyze the time and space complexity of sorting algorithms like QuickSort and MergeSort?",
        "When would you choose a Hash Table over a Binary Search Tree, and what are the trade-offs?",
    ],
    "system-design": [
        "How would you approach designing a high-throughput rate limiter for a global microservice architecture?",
        "What strategies do you use for data partitioning and consistent hashing in distributed databases?",
        "How do load balancers distribute traffic, and how do you handle single points of failure?",
    ],
    "machine-learning-engineer": [
        "What is the bias-variance tradeoff, and how do you detect and mitigate overfitting in complex models?",
        "Can you walk me through feature engineering techniques and how they impact model accuracy?",
        "How do you approach model deployment, monitoring, and handling data drift in production?",
    ],
    "devops-engineer": [
        "What are the core principles of continuous integration and continuous deployment (CI/CD) pipelines?",
        "How does Kubernetes manage container orchestration, networking, and automatic pod scaling?",
        "How do you enforce Infrastructure as Code (IaC) and manage environment secrets securely?",
    ],
    "android-developer": [
        "How does the Android Activity lifecycle work, and how do you prevent memory leaks during config changes?",
        "What are the key benefits of Jetpack Compose compared to the legacy XML layout view system?",
        "How do Kotlin Coroutines simplify asynchronous processing and main thread safety in Android?",
    ],
    "ios-developer": [
        "How does Automatic Reference Counting (ARC) work in Swift, and how do you avoid strong reference cycles?",
        "What are the key differences between SwiftUI and UIKit, and when would you bridge the two?",
        "How do you manage asynchronous network calls using Swift's async/await syntax?",
    ],
    "data-engineer": [
        "What is the difference between ETL and ELT data pipelines, and when would you use each?",
        "How does Apache Spark process large-scale datasets across distributed clusters?",
        "How do you handle late-arriving data and state management in real-time streaming architectures?",
    ],
    "product-manager": [
        "How do you evaluate and prioritize competing product features when resources are constrained?",
        "Walk me through how you define key performance metrics (KPIs) for a newly launched feature?",
        "How do you navigate technical debt trade-offs with engineering teams while meeting business goals?",
    ],
    "behavioral-round": [
        "Tell me about a time you led a team through a complex technical challenge under strict deadlines.",
        "How do you handle technical disagreements or architectural conflicts within your development team?",
        "Describe a situation where a project didn't go as planned and what key lessons you took away.",
    ],
};

/**
 * Start a new interview session and initialize Question 1.
 */
export const startInterview = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.userId;
        const parseResult = InterviewSessionSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                message: "Invalid Request Format",
                success: false,
            });
        }
        const { role, difficulty, introduction } = parseResult.data;

        // Select authoritative Question 1 from curated role pool (<1ms execution)
        const defaultFallback = "Can you walk me through your technical background and a recent project you built?";
        const pool = ROLE_FIRST_QUESTIONS[role] ?? [defaultFallback];
        const question: string = pool[Math.floor(Math.random() * pool.length)] ?? defaultFallback;

        // Fetch candidate username for AI context
        const candidateUser = await prisma.user.findUnique({
            where: { id: parseInt(userId, 10) },
            select: { username: true },
        });
        const candidateName = candidateUser?.username ?? null;

        // Atomically create session with intro (order 0) and first technical question (order 1).
        // currentQues starts at 0 so the intro is the authoritative first spoken question.
        const session = await prisma.interviewSession.create({
            data: {
                userId: parseInt(userId, 10),
                role,
                difficulty,
                introduction,
                status: "active",
                currentQues: 0,
                questions: {
                    create: [
                        {
                            order: 0,
                            question: "Tell me about yourself.",
                            // Pre-populate with written intro if provided; will be overwritten by spoken answer
                            answer: introduction ?? null,
                        },
                        {
                            order: 1,
                            question: question,
                        },
                    ],
                },
            },
        });

        // Return the intro question as the authoritative firstQuestion so the
        // ws-server speaks "Tell me about yourself." — not the technical question.
        return res.status(200).json({
            success: true,
            sessionId: session.id,
            questionNum: 0,
            totalQuestions: TOTAL_QUESTIONS,
            question: "Tell me about yourself.",
            candidateName,
        });
    } catch (error: any) {
        console.error("[/api/interview/generate] Error starting interview:", error?.message ?? error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong starting your interview. Please try again.",
        });
    }
};

/**
 * Real-time SSE streaming turn processor.
 * Consumed by ws-server for zero-delay speech synthesis.
 */
export const streamInterviewTurn = async (req: Request, res: Response) => {
    try {
        const { sessionId, candidateAnswer, currentQuestion } = req.body;

        if (!sessionId || !candidateAnswer) {
            return res.status(400).json({
                success: false,
                error: "sessionId and candidateAnswer are required",
            });
        }

        const sessIdNum = parseInt(String(sessionId), 10);
        if (isNaN(sessIdNum)) {
            return res.status(400).json({ success: false, error: "Invalid sessionId" });
        }

        // Set up Server-Sent Events headers for low latency streaming
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        if (typeof res.flushHeaders === "function") {
            res.flushHeaders();
        }

        const turnResult = await processInterviewTurn({
            sessionId: sessIdNum,
            candidateAnswer: String(candidateAnswer).trim(),
            currentQuestionText: currentQuestion ? String(currentQuestion).trim() : undefined,
            onSpokenChunk: (chunk: string) => {
                res.write(`data: ${JSON.stringify({ type: "spoken_chunk", text: chunk })}\n\n`);
            },
        });

        res.write(`data: ${JSON.stringify({ type: "turn_result", ...turnResult })}\n\n`);
        res.end();
    } catch (err: any) {
        console.error("[streamInterviewTurn] Error:", err?.message || err);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, error: err?.message || "Internal server error" });
        }
        res.write(`data: ${JSON.stringify({ type: "error", error: err?.message || "Turn generation failed" })}\n\n`);
        res.end();
    }
};

/**
 * Non-streaming legacy fallback for submitAnswer.
 * Delegates directly to authoritative processInterviewTurn.
 */
export const submitAnswer = async (req: Request, res: Response) => {
    try {
        const parseResult = InterviewQuestions.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: parseResult.error.issues.map((i: any) => i.message).join(", "),
            });
        }

        const { sessionId, answer } = parseResult.data;
        const sessIdNum = parseInt(sessionId, 10);

        let spokenAccumulator = "";
        const result = await processInterviewTurn({
            sessionId: sessIdNum,
            candidateAnswer: answer,
            onSpokenChunk: (chunk: string) => {
                spokenAccumulator += " " + chunk;
            },
        });

        return res.json({
            isComplete: result.isComplete,
            interviewerMessage: result.interviewerMessage || spokenAccumulator.trim(),
            questionNum: result.questionNum,
            totalQuestions: result.totalQuestions,
            question: result.nextQuestion,
        });
    } catch (error: any) {
        console.error("[/api/interview/answer] Error:", error?.message ?? error);
        return res.status(500).json({
            success: false,
            error: error?.message ?? "Internal server error",
        });
    }
};

export const interviewFeedback = async (req: Request, res: Response) => {
    res.status(200).json({ message: "Interview feedback endpoint" });
};
