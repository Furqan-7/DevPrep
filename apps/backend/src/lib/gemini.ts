import { GoogleGenerativeAI, type GenerationConfig, type GenerativeModel, type ResponseSchema } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Optional override for the API host (a proxy, or a local stub in tests).
const REQUEST_OPTIONS = process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : undefined;

// Candidate models in order of priority (fastest flash-lite models first for low latency)
const MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
];

const MODEL = process.env.GEMINI_INTERVIEW_MODEL || "gemini-3.5-flash-lite";

// Interview turns are short, conversational replies. Extended "thinking" adds
// seconds of silence before the first token, so we ask for minimal thinking and
// cap the output. If the model rejects the thinking config we drop it once and
// remember that for the rest of the process lifetime.
const INTERVIEW_GENERATION_CONFIG = {
    temperature: 0.7,
    maxOutputTokens: 400,
};
const THINKING_CONFIG = { thinkingConfig: { thinkingLevel: process.env.GEMINI_THINKING_LEVEL || "minimal" } };
let thinkingConfigSupported = process.env.GEMINI_DISABLE_THINKING_CONFIG !== "true";

const modelCache = new Map<string, GenerativeModel>();

function getInterviewModel(systemInstruction: string | undefined, withThinking: boolean): GenerativeModel {
    const key = `${withThinking ? "t" : "n"}:${systemInstruction ?? ""}`;
    let model = modelCache.get(key);
    if (!model) {
        model = genAI.getGenerativeModel({
            model: MODEL,
            ...(systemInstruction ? { systemInstruction } : {}),
            generationConfig: {
                ...INTERVIEW_GENERATION_CONFIG,
                ...(withThinking ? THINKING_CONFIG : {}),
            } as GenerationConfig,
        }, REQUEST_OPTIONS);
        modelCache.set(key, model);
    }
    return model;
}


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
 * Stream content from Gemini, tuned for low time-to-first-token.
 */
export async function streamGeminiContent(
    options: StreamGeminiOptions
): Promise<StreamGeminiResult> {
    const { prompt, systemInstruction, onChunk } = options;

    const startTime = Date.now();
    let firstTokenTime: number | null = null;
    let fullText = "";

    console.log(`[Gemini] Request started | model=${MODEL} thinkingConfig=${thinkingConfigSupported}`);

    let responseStream;
    try {
        responseStream = await getInterviewModel(systemInstruction, thinkingConfigSupported).generateContentStream(prompt);
    } catch (err: any) {
        const message = String(err?.message || err);
        if (!thinkingConfigSupported || !/thinking/i.test(message)) throw err;
        console.warn(`[Gemini] Model rejected thinkingConfig, retrying without it: ${message}`);
        thinkingConfigSupported = false;
        responseStream = await getInterviewModel(systemInstruction, false).generateContentStream(prompt);
    }

    for await (const chunk of responseStream.stream) {
        let chunkText = "";

        try {
            chunkText = chunk.text();
        } catch {
            // Chunk may contain no text
        }

        if (!chunkText) continue;

        if (firstTokenTime === null) {
            firstTokenTime = Date.now();
            console.log(
                `[Gemini] First token | ${Date.now() - startTime}ms`
            );
        }

        fullText += chunkText;
        onChunk(chunkText);
    }

    console.log(
        `[Gemini] Completed | ${Date.now() - startTime}ms`
    );

    const totalLatencyMs = Date.now() - startTime;
    const firstTokenLatencyMs =
        firstTokenTime !== null
            ? firstTokenTime - startTime
            : totalLatencyMs;

    return {
        fullText,
        modelUsed: MODEL,
        firstTokenLatencyMs,
        totalLatencyMs,
    };
}

export interface GenerateJsonOptions {
    responseSchema?: ResponseSchema;
    temperature?: number;
    maxOutputTokens?: number;
}

/**
 * Generate JSON with Gemini's JSON mode. Tries the configured interview model first,
 * then the fallback list; a model that errors or returns unparseable JSON is skipped.
 */
export async function generateJSON<T>(prompt: string, options: GenerateJsonOptions = {}): Promise<T> {
    let lastError: any = null;
    const candidates = [MODEL, ...MODELS.filter((m) => m !== MODEL)];

    for (const modelName of candidates) {
        try {
            const model = genAI.getGenerativeModel(
                {
                    model: modelName,
                    generationConfig: {
                        responseMimeType: "application/json",
                        ...(options.responseSchema ? { responseSchema: options.responseSchema } : {}),
                        ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
                        ...(options.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {}),
                    },
                },
                REQUEST_OPTIONS,
            );

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
