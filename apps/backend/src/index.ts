import express from "express";
import dotenv from "dotenv";
import path from "path";
import { config } from "dotenv";
config();

// Load DATABASE_URL from the database package .env at runtime
dotenv.config({ path: path.resolve(__dirname, "../../../packages/database/.env") });

import { prisma } from "@repo/database";
import { signinSchema, signupSchema } from "./types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import { success } from "zod";

const app = express();
app.use(express.json());
app.use(cors());

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
                companies: compony,
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

app.get("/api/jobs", async (req, res) => {
    try {

        const jobs1 = 



    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error
        });
    }
});



app.post("/api/interview/generate", async (req, res) => {

});

app.get("/api/interview/feedback", async (req, res) => {

});







app.listen(3001, () => {
    console.log("Server is Running on 3001 Port ");
})
