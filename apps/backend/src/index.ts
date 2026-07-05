import express from "express";
import dotenv from "dotenv";
import path from "path";
import { config } from "dotenv";
import { CronJob } from "cron";
config();


// Load DATABASE_URL from the database package .env at runtime
dotenv.config({ path: path.resolve(__dirname, "../../../packages/database/.env") });

import { prisma } from "@repo/database";
import { signinSchema, signupSchema, InterviewQuestionsInput, InterviewSessionSchema, InterviewQuestions } from "./types";
import type { InterviewSessionInput } from "./types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";

import GetJobsRemotive from "./GetJobsRemotive";
import GetJobsRapid from "./GetJobsRapid";
import { mapRapidJob, mapRemotiveJob } from "./MapJobs";
import { MiddleWhere } from "./Middlewhere";
import { error } from "console";
import { generateJSON } from "./lib/gemini";

const app = express();
app.use(express.json());
app.use(cors());


const TOTAL_QUESTIONS = 10;

interface NextQuestionResponse {
    question: string;
}

interface EvalResponse {
    score: number;          // internal only, never shown to user mid-interview
    interviewerMessage: string; // what the interviewer actually says out loud
    nextQuestion: string | null;
}

app.post("/signup", async (req, res) => {
    const Response = signupSchema.safeParse(req.body);

    console.log(req.body);

    if (!Response.success) {
        console.log("Error", Response.error);
        return res.status(411).json({
            message: "Invalid input",
            success: false
        });
    }

    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;



    const HashedPassword = await bcrypt.hash(password, 10);

    try {
        const UserExist = await prisma.user.findUnique({
            where: { email }
        });

        if (UserExist) {
            return res.status(400).json({
                message: "User already exists with this email",
                success: false
            });
        }

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: HashedPassword
            }
        });

        const token = jwt.sign({
            userId: user.id, username: user.username
        }, process.env.JWT_TOKEN as string, {
            expiresIn: "7d"
        });

        return res.status(200).json({
            message: "User created successfully",
            username: user.username,
            token: token,
            id: user.id,
            success: true
        });

    } catch (e: any) {
        console.error("[SIGNUP ERROR]", e?.message ?? e);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
            error: e?.message ?? String(e)
        });
    }
})


app.post("/signin", async (require, res) => {
    const Response = signinSchema.safeParse(require.body);
    console.log("Reached at signin ");
    if (!Response.success) {
        return res.status(411).json({
            message: "Invalid Format",
            success: false
        })
    };

    try {

        const email = require.body.email;
        const password = require.body.password;

        const user = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid user",
                success: false
            })
        };

        const hashedPassword = user.password ? user.password : " ";
        const isPasswordCorrect = bcrypt.compareSync(password, hashedPassword);

        if (!isPasswordCorrect) {
            return res.status(402).json({
                message: "Incorrect Password",
                success: false
            })
        };

        console.log("Reached at JWT Token" + process.env.JWT_TOKEN);

        const token = jwt.sign({
            userId: user.id, username: user.username
        }, process.env.JWT_TOKEN as string, {
            expiresIn: "7d"
        });

        return res.status(200).json({
            message: "User logged in successfully",
            success: true,
            username: user.username,
            id: user.id,
            token
        });

    } catch (e) {
        console.log("Error" + e);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});

app.get("/api/dsa/problems", async (req, res) => {
    const userId = res.locals.userId;

    try {
        const problems = await prisma.problem.findMany({
            include: {
                companies: true
            },
        });

        return res.status(200).json({
            success: true,
            problems,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error
        });
    }

});

app.get("/api/dsa/problems", async (req, res) => {
    const compony = req.body.compony;

    try {
        const ComponyProblems = await prisma.problem.findMany({
            include: {
                companies: true,
            },
        });

        return res.status(200).json({
            success: true,
            ComponyProblems: ComponyProblems
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error
        });
    }
});

app.get("/api/dsa/progress", async (req, res) => {
    const userId = res.locals.userId;


    try {

    } catch (error) {

    }
});


app.get("/api/cscore/questions", async (req, res) => {


    try {

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error
        });
    }
});

app.get("/api/cscore/progress", async (req, res) => {
    const userId = res.locals.userId;


    try {

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error
        });
    }
});



// async function TempJobs() {

//     try {
//         const response = await Promise.allSettled([
//             GetJobsRemotive(),
//             GetJobsRapid(),
//         ]);


//         console.log(response);

//         const remotiveResult = response[0];
//         const rapidResult = response[1];

//         let remotiveJobs: any[] = [];
//         let rapidJobs: any[] = [];

//         if (remotiveResult.status === "fulfilled") {
//             remotiveJobs = remotiveResult.value;
//         } else {
//             console.error("❌ Remotive API failed:", remotiveResult.reason);
//         }

//         if (rapidResult.status === "fulfilled") {
//             rapidJobs = rapidResult.value;
//         } else {
//             console.error("❌ Rapid API failed:", rapidResult.reason);
//         }

//         let MappedRemotive = [];
//         let MappedRapidJob = [];

//         for (let i = 0; i < remotiveJobs.length; i++) {
//             MappedRemotive.push(mapRemotiveJob(remotiveJobs[i]));
//         }

//         for (let i = 0; i < rapidJobs.length; i++) {
//             MappedRapidJob.push(mapRapidJob(rapidJobs[i]));
//         }

//         const jobs = [...MappedRemotive, ...MappedRapidJob];

//         await prisma.job.createMany({
//             data: jobs,
//             skipDuplicates: true
//         });

//     } catch (error) {
//         console.log("Error while Fetching jobs " + error);
//     }
// }

// TempJobs();


const jobs = new CronJob("0 */8 * * *", async () => {
    try {
        const response = await Promise.allSettled([
            GetJobsRemotive(),
            GetJobsRapid(),
        ]);


        console.log(response);

        const remotiveResult = response[0];
        const rapidResult = response[1];

        let remotiveJobs: any[] = [];
        let rapidJobs: any[] = [];

        if (remotiveResult.status === "fulfilled") {
            remotiveJobs = remotiveResult.value;
        } else {
            console.error("❌ Remotive API failed:", remotiveResult.reason);
        }

        if (rapidResult.status === "fulfilled") {
            rapidJobs = rapidResult.value;
        } else {
            console.error("❌ Rapid API failed:", rapidResult.reason);
        }

        let MappedRemotive = [];
        let MappedRapidJob = [];

        for (let i = 0; i < remotiveJobs.length; i++) {
            MappedRemotive.push(mapRemotiveJob(remotiveJobs[i]));
        }

        for (let i = 0; i < rapidJobs.length; i++) {
            MappedRapidJob.push(mapRapidJob(rapidJobs[i]));
        }

        const jobs = [...MappedRemotive, ...MappedRapidJob];

        await prisma.job.createMany({
            data: jobs,
            skipDuplicates: true
        });



    } catch (error) {
        throw new Error("[JOB ERROR]" + error);
    }

});
jobs.start();



app.get("/api/jobs", async (req, res) => {

    try {
        // make a db call here to fetch the jobs 

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error
        });
    }
});



app.post("/api/interview/generate", MiddleWhere, async (req, res) => {

    try {
        const userId = res.locals.userId;
        console.log("[generate] raw userId from locals:", userId, "| parsed:", parseInt(userId, 10));

        const Response = InterviewSessionSchema.safeParse(req.body);
        if (!Response.success) {
            return res.status(411).json({
                message: "Invalid Format",
                success: false
            })
        };
        const { role, difficulty, introduction } = Response.data;

        console.log("user Id " + userId + " data " + Response.data);

        const session = await prisma.interviewSession.create({
            data: {
                userId: parseInt(userId, 10),
                role: role,
                difficulty: difficulty,
                introduction: introduction,
                status: "active",
                currentQues: 0,
            }
        });

        await prisma.interviewQuestion.create({
            data: {
                sessionId: session.id,
                order: 0,
                question: "Tell me about yourself.",
                answer: introduction ?? null,
            }
        });

        const prompt = `
You are a senior technical interviewer for a "${role}" role at "${difficulty}" difficulty.
The candidate just introduced themselves: "${introduction || "(no introduction given)"}"

Generate the FIRST real interview question (order 1), using their introduction as light
context if relevant. Keep it focused and not overly long.

Respond ONLY with valid JSON, no markdown, no preamble:
{ "question": "string" }
        `.trim();

        const { question } = await generateJSON<NextQuestionResponse>(prompt);

        await prisma.interviewQuestion.create({
            data: { sessionId: session.id, order: 1, question },
        });

        await prisma.interviewSession.update({
            where: { id: session.id },
            data: { currentQues: 1 },
        });

        return res.status(200).json({
            success: true,
            sessionId: session.id,
            questionNum: 1,
            totalQuestions: TOTAL_QUESTIONS,
            question
        });

    } catch (error: any) {
        console.error("[/api/interview/generate] ERROR:", error?.message ?? error);
        return res.status(500).json({
            success: false,
            message: error?.message ?? "Internal server error",
            detail: error?.code ?? null,        // Prisma error code e.g. P2003
        });
    }
});



app.post("/api/interview/answer", MiddleWhere, async (req, res) => {
    try {
        const userId = res.locals.userId;
        const Response = InterviewQuestions.safeParse(req.body);

        if (!Response.success) {
            return res.status(402).json({
                success: false,
                error: Response.error
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
    } catch (error) {

        return res.status(500).json({
            success: false,
            error: error
        });

    }
});

app.get("/api/interview/feedback", async (req, res) => {

});







app.listen(3001, () => {
    console.log("Server is Running on 3001 Port ");
})
