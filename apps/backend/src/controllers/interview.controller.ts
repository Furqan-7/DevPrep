import { prisma } from "@repo/database";
import { InterviewQuestions, InterviewSessionSchema } from "../types";
import { generateJSON } from "../lib/gemini";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../packages/database/.env") });


const TOTAL_QUESTIONS = 10;

interface NextQuestionResponse {
    question: string;
}

interface EvalResponse {
    score: number;          // internal only, never shown to user mid-interview
    interviewerMessage: string; // what the interviewer actually says out loud
    nextQuestion: string | null;
}



/**
 * Curated initial interview question bank per role.
 * Instant lookup (<1ms) avoids blocking 3-7s LLM generation on start.
 */
const ROLE_FIRST_QUESTIONS: Record<string, string[]> = {
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

export const startInterview = async (req: Request, res: Response) => {

    try {
        const userId = res.locals.userId;
        console.log("[generate] raw userId from locals:", userId, "| parsed:", parseInt(userId, 10));

        const Response = InterviewSessionSchema.safeParse(req.body);
        if (!Response.success) {
            return res.status(411).json({
                message: "Invalid Format",
                success: false
            });
        }
        const { role, difficulty, introduction } = Response.data;

        // Select initial question from curated role pool (<1ms execution)
        const defaultFallback = "Can you walk me through your technical background and a recent project you built?";
        const pool = ROLE_FIRST_QUESTIONS[role] ?? [defaultFallback];
        const question: string = pool[Math.floor(Math.random() * pool.length)] ?? defaultFallback;

        // Single nested Prisma transaction (1 DB roundtrip instead of 4 sequential queries)
        let session: any;
        try {
            session = await prisma.interviewSession.create({
                data: {
                    userId: parseInt(userId, 10),
                    role: role,
                    difficulty: difficulty,
                    introduction: introduction,
                    status: "active",
                    currentQues: 1,
                    questions: {
                        create: [
                            {
                                order: 0,
                                question: "Tell me about yourself.",
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
        } catch (dbError: any) {
            console.error("[/api/interview/generate] DB error creating session:", dbError?.message ?? dbError);
            return res.status(503).json({
                success: false,
                message: "Unable to start your interview right now. Please try again in a moment.",
            });
        }

        return res.status(200).json({
            success: true,
            sessionId: session.id,
            questionNum: 1,
            totalQuestions: TOTAL_QUESTIONS,
            question
        });

    } catch (error: any) {
        console.error("[/api/interview/generate] Unexpected error:", error?.message ?? error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong starting your interview. Please try again.",
        });
    }
};


export const submitAnswer = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.userId;
        const Response = InterviewQuestions.safeParse(req.body);

        if (!Response.success) {
            return res.status(402).json({
                success: false,
                error: Response.error.issues.map((i: any) => i.message).join(", ")
            });
        }

        const { sessionId, answer } = Response.data;


        const sessionIdNum = parseInt(sessionId, 10);
        const session = await prisma.interviewSession.findUnique({
            where: { id: sessionIdNum },
            include: { questions: { orderBy: { "order": "asc" } } },
        });


        if (!session) return res.status(404).json({
            success: false,
            error: "Session Not Found"
        });

        if (session.status === "completed") {
            return res.status(400).json({
                success: false,
                error: "Session Already Completed"
            });
        }

        const currentQues = session.questions.find(
            (q: any) => q.order === session.currentQues
        );

        if (!currentQues) {
            return res.status(500).json({
                success: false,
                error: "No Question Found"
            });
        }

        const isLastQuestion = session.currentQues >= TOTAL_QUESTIONS;

        const history = session.questions
            .filter((q: any) => q.order > 0 && q.answer)
            .map((q: any) => `Q${q.order}: ${q.question}\nA${q.order}: ${q.answer}`)
            .join("\n\n");



        const prompt = `
You are a senior technical interviewer conducting a LIVE interview for a "${session.role}" role at "${session.difficulty}" difficulty.
You are speaking directly to the candidate. Be natural, warm, and conversational — like a real human interviewer.

Conversation so far:
${history || "(this is the first question)"}

You just asked: "${currentQues.question}"
Candidate answered: "${answer}"

Your job:
1. EVALUATE internally (score 0-10, hidden from candidate).
2. RESPOND naturally as the interviewer. Your response should:
   - Acknowledge the answer briefly and naturally ("Got it", "That's a good point", "Interesting", "Right", etc.)
   - If the answer was WRONG or INCOMPLETE: gently correct or clarify it in simple terms, as a good mentor would. Don't say "that's wrong" — say "Actually, one thing worth noting is..." or "To add to that..." etc.
   - If the answer was GOOD: affirm briefly, maybe build on it with one sentence.
   - Then NATURALLY transition to the next question using a connector phrase like "Let's move on to...", "Building on that...", "Here's another one for you..." etc.
   - NEVER say "I will now evaluate your answer", "Moving to question X", "Score:", or anything robotic.
   - Keep your message to 3-5 sentences MAX. Concise and natural.
3. ${isLastQuestion
                ? "This was the FINAL question. End the interview warmly — tell the candidate they did well and that their report is being prepared. Set nextQuestion to null."
                : "Generate the NEXT question that flows naturally from the conversation."
            }

Respond ONLY with valid JSON, no markdown, no preamble:
{
  "score": number,
  "interviewerMessage": "string",
  "nextQuestion": "string | null"
}
`.trim();



        const result = await generateJSON<EvalResponse>(prompt);

        await prisma.interviewQuestion.update({
            where: { id: currentQues.id },
            data: {
                answer,
                score: result.score,
                // store the interviewer message as feedback for the report later
                feedback: result.interviewerMessage,
            },
        });

        if (isLastQuestion) {
            await prisma.interviewSession.update({
                where: { id: session.id },
                data: { status: "completed" },
            });

            return res.json({
                isComplete: true,
                interviewerMessage: result.interviewerMessage, // "Great session, your report is being prepared..."
                sessionId: session.id,
            });
        }

        const nextOrder = session.currentQues + 1;

        await prisma.interviewQuestion.create({
            data: { sessionId: session.id, order: nextOrder, question: result.nextQuestion! },
        });

        await prisma.interviewSession.update({
            where: { id: session.id },
            data: { currentQues: nextOrder },
        });

        return res.json({
            isComplete: false,
            interviewerMessage: result.interviewerMessage, // speak this to the user
            questionNum: nextOrder,
            totalQuestions: TOTAL_QUESTIONS,
            question: result.nextQuestion, // next question is ALREADY embedded in interviewerMessage
        });
    } catch (error: any) {
        console.error("[/api/interview/answer] ERROR:", error?.message ?? error);
        return res.status(500).json({
            success: false,
            error: error?.message ?? "Internal server error",
        });
    }
};


export const interviewFeedback = async (req: Request, res: Response) => {

}
