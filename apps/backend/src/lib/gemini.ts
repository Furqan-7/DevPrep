import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Candidate models in order of priority (fastest flash-lite models first for low latency)
const MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
];

export interface StreamGeminiOptions {
    prompt: string;
    systemInstruction?: string;
    onChunk: (chunk: string) => void;
}

export interface StreamGeminiResult {
    fullText: string;
    modelUsed: string;
    firstTokenLatencyMs: number;
    totalLatencyMs: number;
}

/**
 * Stream content from Gemini with automatic fallback to secondary models if primary fails.
 */
export async function streamGeminiContent(options: StreamGeminiOptions): Promise<StreamGeminiResult> {
    const { prompt, systemInstruction, onChunk } = options;
    let lastError: any = null;

    for (const modelName of MODELS) {
        try {
            const modelConfig: any = { model: modelName };
            if (systemInstruction) {
                modelConfig.systemInstruction = systemInstruction;
            }

            const model = genAI.getGenerativeModel(modelConfig);
            const startTime = Date.now();
            let firstTokenTime: number | null = null;
            let fullText = "";

            const responseStream = await model.generateContentStream(prompt);

            for await (const chunk of responseStream.stream) {
                let chunkText = "";
                try {
                    chunkText = chunk.text();
                } catch {
                    // Chunk may have no candidate parts (e.g. finish reason or safety metadata)
                }
                if (!chunkText) continue;

                if (firstTokenTime === null) {
                    firstTokenTime = Date.now();
                }

                fullText += chunkText;
                onChunk(chunkText);
            }

            const totalLatencyMs = Date.now() - startTime;
            const firstTokenLatencyMs = firstTokenTime ? firstTokenTime - startTime : totalLatencyMs;

            return {
                fullText,
                modelUsed: modelName,
                firstTokenLatencyMs,
                totalLatencyMs,
            };
        } catch (err: any) {
            console.warn(`[gemini.ts] Model ${modelName} failed or unavailable:`, err?.message || err);
            lastError = err;
        }
    }

    throw new Error(`All Gemini models failed. Last error: ${lastError?.message || lastError}`);
}

/**
 * Generate JSON using Gemini with model fallback.
 */
export async function generateJSON<T>(prompt: string): Promise<T> {
    let lastError: any = null;

    for (const modelName of MODELS) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" },
            });

            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            const text = result.response.text();
            return JSON.parse(text) as T;
        } catch (err: any) {
            console.warn(`[gemini.ts] generateJSON model ${modelName} failed:`, err?.message || err);
            lastError = err;
        }
    }

    throw new Error(`All Gemini models failed for generateJSON. Last error: ${lastError?.message || lastError}`);
}