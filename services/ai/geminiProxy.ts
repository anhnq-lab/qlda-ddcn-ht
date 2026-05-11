/**
 * AI Proxy Client — Gọi trực tiếp Google Gemini API sử dụng @google/generative-ai
 */
import { GoogleGenerativeAI, ChatSession, GenerativeModel, Part } from '@google/generative-ai';

// Lấy API key từ biến môi trường
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

// Model mặc định theo lựa chọn (2.5 hoặc 1.5)
const DEFAULT_MODEL = 'gemini-2.5-pro';

// ── Types ────────────────────────────────────────────────────────
// Dùng lại một số type cũ để các file khác khỏi vỡ nếu import type (mặc dù ta sẽ sửa ở nơi dùng)
export interface AIMessage {
    role: 'system' | 'user' | 'assistant' | 'tool' | 'model';
    content: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
}

export type GeminiContent = AIMessage;
export type GeminiPart = { text: string };

// ── Core functions ───────────────────────────────────────────────

export function getGenerativeModel(options?: { model?: string; tools?: any[]; systemInstruction?: string }): GenerativeModel {
    if (!genAI) {
        throw new Error('VITE_GEMINI_API_KEY chưa được cấu hình trong .env');
    }
    
    return genAI.getGenerativeModel({
        model: options?.model || DEFAULT_MODEL,
        tools: options?.tools ? [{ functionDeclarations: options.tools }] : undefined,
        systemInstruction: options?.systemInstruction,
    });
}

// ── Simple text generation ───────────────────────────────────────

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
        }
    });
    
    return result.response.text();
}

// ── Image Analysis ───────────────────────────────────────────────

export async function generateFromImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    options?: { model?: string; temperature?: number }
): Promise<string> {
    const model = getGenerativeModel({ model: options?.model || 'gemini-2.5-pro' });
    
    // Xóa prefix data:image/...;base64, nếu có
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    const imagePart: Part = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType
        }
    };

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
        generationConfig: {
            temperature: options?.temperature ?? 0.2,
        }
    });

    return result.response.text();
}

// ── Availability check ───────────────────────────────────────────

export function isGeminiProxyAvailable(): boolean {
    return !!API_KEY;
}
