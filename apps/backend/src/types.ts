import { Difficulty } from "@repo/database";
import { report } from "node:process";
import { z } from "zod";


export const signupSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6),
});

export const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});


export const InterviewSessionSchema = z.object({
    role: z.string(),
    difficulty: z.string(),
    introduction: z.string().optional(),
    // Tailor the questions to the saved resume and/or a target job's description
    useResume: z.boolean().optional(),
    jobDescription: z.string().trim().min(80).max(8000).optional(),
});

export const InterviewQuestions = z.object({
    sessionId: z.string(),
    answer: z.string()
})

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type InterviewSessionInput = z.infer<typeof InterviewSessionSchema>;
export type InterviewQuestionsInput = z.infer<typeof InterviewQuestions>;
