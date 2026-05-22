/**
 * AI Proxy Client — Gọi Gemini API qua Supabase Edge Function (gemini-proxy)
 *
 * GEMINI_API_KEY KHÔNG còn xuất hiện trong client bundle. Mọi request đi qua
 * Edge Function `gemini-proxy`, hàm này tự xác thực Supabase JWT của caller
 * và gắn key (lấy từ Supabase secrets) vào request thực tới Gemini REST API.
 *
 * Surface (giữ tương thích ngược với SDK @google/generative-ai):
 *   - getGenerativeModel({ model?, tools?, systemInstruction? })
 *       .generateContent({ contents, generationConfig })   → { response }
 *       .startChat({ history, generationConfig })          → Chat
 *           .sendMessage(string | Part[])                  → { response }
 *   - generateContent(prompt, options)                     → string
 *   - generateFromImage(imageBase64, mimeType, prompt)     → string
 *   - isGeminiProxyAvailable()                             → boolean
 *
 * response shape: { text(): string; functionCalls(): FunctionCall[] | undefined }
 */
import { supabase } from '../../lib/supabase';

const DEFAULT_MODEL = 'gemini-2.5-pro';

// ── Types compatible with previous SDK shape ────────────────────────
export interface AIMessage {
    role: 'system' | 'user' | 'assistant' | 'tool' | 'model';
    content: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
}

export type GeminiContent = AIMessage;
export type GeminiPart = { text: string };

export interface FunctionCall {
    name: string;
    args: Record<string, unknown>;
}

export interface FunctionResponse {
    name: string;
    response: object;
}

export interface Part {
    text?: string;
    inlineData?: { data: string; mimeType: string };
    functionCall?: FunctionCall;
    functionResponse?: FunctionResponse;
}

// Schema types matching Gemini REST API (replaces SDK's SchemaType enum)
export enum SchemaType {
    OBJECT = 'object',
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    ARRAY = 'array',
    INTEGER = 'integer',
}

export interface Schema {
    type: SchemaType;
    description?: string;
    properties?: Record<string, Schema>;
    required?: string[];
    items?: Schema;
    enum?: string[];
    format?: string;
    nullable?: boolean;
}

export interface FunctionDeclaration {
    name: string;
    description?: string;
    parameters?: Schema;
}

export interface Content {
    role: string;
    parts: Part[];
}

interface GenerationConfig {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
    responseMimeType?: string;
}

interface GenerateContentRequest {
    contents: Content[];
    tools?: any[];
    systemInstruction?: { parts: Part[] } | string;
    generationConfig?: GenerationConfig;
    safetySettings?: any[];
}

interface GeminiCandidate {
    content?: { parts?: Part[]; role?: string };
    finishReason?: string;
}

interface GeminiResponse {
    candidates?: GeminiCandidate[];
    promptFeedback?: unknown;
}

export interface GenerateContentResult {
    response: {
        text(): string;
        functionCalls(): FunctionCall[] | undefined;
        candidates?: GeminiCandidate[];
    };
}

// ── Core: POST to the Edge Function ─────────────────────────────────

async function invokeProxy(
    model: string,
    payload: GenerateContentRequest
): Promise<GeminiResponse> {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { model, ...payload },
    });
    if (error) {
        let message = error.message;
        try {
            const ctx = (error as any)?.context;
            if (ctx && typeof ctx.json === 'function') {
                const j = await ctx.json();
                if (j?.error) message = j.detail?.error?.message || j.error;
            }
        } catch {
            /* keep original */
        }
        throw new Error(`Gemini proxy error: ${message}`);
    }
    return data as GeminiResponse;
}

function wrapResponse(raw: GeminiResponse): GenerateContentResult {
    const candidates = raw.candidates || [];
    const firstParts = candidates[0]?.content?.parts || [];

    return {
        response: {
            candidates,
            text(): string {
                return firstParts
                    .filter((p) => typeof p.text === 'string')
                    .map((p) => p.text as string)
                    .join('');
            },
            functionCalls(): FunctionCall[] | undefined {
                const calls = firstParts
                    .filter((p) => p.functionCall)
                    .map((p) => p.functionCall as FunctionCall);
                return calls.length > 0 ? calls : undefined;
            },
        },
    };
}

// Normalize various "message" inputs (string | Part[]) to Content[]
function toUserContent(message: string | Part[]): Content {
    if (typeof message === 'string') {
        return { role: 'user', parts: [{ text: message }] };
    }
    // For function-response parts the role expected by Gemini is "function"
    if (message.some((p) => p.functionResponse)) {
        return { role: 'function', parts: message };
    }
    return { role: 'user', parts: message };
}

// ── Model & Chat shim ───────────────────────────────────────────────

export interface ModelOptions {
    model?: string;
    tools?: any[];
    systemInstruction?: string;
}

export interface ChatSession {
    sendMessage(message: string | Part[]): Promise<GenerateContentResult>;
    getHistory(): Content[];
}

export interface GenerativeModel {
    generateContent(req: GenerateContentRequest | { contents: Content[]; generationConfig?: GenerationConfig }): Promise<GenerateContentResult>;
    startChat(opts?: { history?: Content[]; generationConfig?: GenerationConfig }): ChatSession;
}

export function getGenerativeModel(options?: ModelOptions): GenerativeModel {
    const modelName = options?.model || DEFAULT_MODEL;
    const tools = options?.tools ? [{ functionDeclarations: options.tools }] : undefined;
    const systemInstruction = options?.systemInstruction
        ? { parts: [{ text: options.systemInstruction }] }
        : undefined;

    return {
        async generateContent(req): Promise<GenerateContentResult> {
            const raw = await invokeProxy(modelName, {
                contents: req.contents,
                tools,
                systemInstruction,
                generationConfig: (req as any).generationConfig,
            });
            return wrapResponse(raw);
        },

        startChat(opts?: { history?: Content[]; generationConfig?: GenerationConfig }): ChatSession {
            const history: Content[] = [...(opts?.history || [])];
            const generationConfig = opts?.generationConfig;

            return {
                async sendMessage(message: string | Part[]): Promise<GenerateContentResult> {
                    const userContent = toUserContent(message);
                    const contents = [...history, userContent];

                    const raw = await invokeProxy(modelName, {
                        contents,
                        tools,
                        systemInstruction,
                        generationConfig,
                    });

                    history.push(userContent);
                    const modelContent = raw.candidates?.[0]?.content;
                    if (modelContent) {
                        history.push({
                            role: modelContent.role || 'model',
                            parts: modelContent.parts || [],
                        });
                    }

                    return wrapResponse(raw);
                },
                getHistory(): Content[] {
                    return history;
                },
            };
        },
    };
}

// ── Simple text generation ───────────────────────────────────────────

export async function generateContent(
    prompt: string,
    options?: {
        model?: string;
        temperature?: number;
        responseMimeType?: string;
    }
): Promise<string> {
    const model = getGenerativeModel({ model: options?.model });
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: options?.temperature ?? 0.2,
            responseMimeType: options?.responseMimeType,
        },
    });
    return result.response.text();
}

// ── Image Analysis ───────────────────────────────────────────────────

export async function generateFromImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    options?: { model?: string; temperature?: number }
): Promise<string> {
    const model = getGenerativeModel({ model: options?.model || 'gemini-2.5-pro' });

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const result = await model.generateContent({
        contents: [
            {
                role: 'user',
                parts: [
                    { inlineData: { data: base64Data, mimeType } },
                    { text: prompt },
                ],
            },
        ],
        generationConfig: {
            temperature: options?.temperature ?? 0.2,
        },
    });

    return result.response.text();
}

// ── Availability check ───────────────────────────────────────────────
// Proxy is available whenever Supabase is configured — actual key validation
// happens server-side in the Edge Function.

export function isGeminiProxyAvailable(): boolean {
    return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
}
