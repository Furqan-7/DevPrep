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


const InterviewSchema = z.object({
    role: z.string(),
    level: z.string(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;

