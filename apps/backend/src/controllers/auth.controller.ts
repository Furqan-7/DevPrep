import { signinSchema, signupSchema } from "../types";
import { prisma } from "@repo/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { response, type Request, type Response } from "express";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../packages/database/.env") });
import axios from "axios";


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_REDIRECT_URL = process.env.GOOGLE_REDIRECT_URI as string;

if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URL) {
    throw new Error("Google environment variables are not defined");
}




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

export const google = async (req: Request, res: Response) => {
    console.log("Reached Google Auth");
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

    const options = {
        redirect_uri: GOOGLE_REDIRECT_URL as string,
        client_id: GOOGLE_CLIENT_ID as string,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile"
        ].join(" "),
    };

    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
}

export const googleCallback = async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
        return res.status(400).json({ error: "No code provided by Google" });
    }

    try {
        // 1. Exchange the code for tokens
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_SECRET_KEY,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
        });

        const { access_token, id_token } = tokenRes.data;

        // 2. Use the access_token to fetch the user's Google profile
        const profileRes = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        const { id: googleId, email, name, picture } = profileRes.data;

        const user = await prisma.user.create({
            data: {
                username: name,
                email: email,
            }
        });

        const account = await prisma.account.create({
            data: {
                provider: "google",
                providerAccountId: googleId,
                userId: user.id,
            },
        });

        const token = jwt.sign({
            userId: user.id, username: user.username
        }, process.env.JWT_TOKEN as string, {
            expiresIn: "7d"
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect("http://localhost:3000/dashboard");


    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Google auth failed" });
    }
};

