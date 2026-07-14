import { signinSchema, signupSchema } from "../types";
import { prisma } from "@repo/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";



export const signup = async (req: Request, res: Response) => {
    const Response = signupSchema.safeParse(req.body);
    console.log("Reached sign up");

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
};

export const signin = async (req: Request, res: Response) => {
    const Response = signinSchema.safeParse(req.body);
    console.log("Reached at signin ");
    if (!Response.success) {
        return res.status(411).json({
            message: "Invalid Format",
            success: false
        })
    };

    try {

        const email = req.body.email;
        const password = req.body.password;

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
};

