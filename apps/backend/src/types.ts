import { z } from "zod";


const signupSchema = z.object({
    username: z.string(),
    email: z.string(),
    password: z.string(),
})

const signinSchema = z.object({
    email: z.string(),
    password: z.string(),
})

export { signupSchema, signinSchema };