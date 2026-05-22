# gemini-proxy Edge Function

Proxy server-side cho Google Gemini API. Giấu `GEMINI_API_KEY` khỏi client bundle, xác thực mọi request bằng Supabase JWT.

## Deploy

```bash
# 1. Set secret (chỉ làm 1 lần — key giữ trong Supabase Vault)
supabase secrets set GEMINI_API_KEY=AIza...

# 2. Deploy function
supabase functions deploy gemini-proxy

# 3. (Tuỳ chọn) Theo dõi logs
supabase functions logs gemini-proxy --tail
```

## Wire protocol

Client gọi qua `supabase.functions.invoke('gemini-proxy', { body: {...} })`.

**Body shape** (khớp với REST `generateContent`):

```ts
{
  model?: string;              // default: gemini-2.5-pro
  contents: Content[];         // required
  tools?: any[];               // function declarations
  systemInstruction?: { parts: Part[] } | string;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
  safetySettings?: any[];
}
```

**Response:** raw Gemini response JSON (candidates / promptFeedback / usageMetadata). Client shim ở `services/ai/geminiProxy.ts` re-shape thành surface tương thích với SDK cũ (`response.text()`, `response.functionCalls()`).

## Models cho phép

Whitelist trong `index.ts`. Hiện có:
- `gemini-2.5-pro` (default)
- `gemini-2.5-flash`
- `gemini-1.5-pro`
- `gemini-1.5-flash`
- `gemini-1.5-flash-8b`

Muốn bật model mới: chỉnh `ALLOWED_MODELS` set trong `index.ts` rồi redeploy.

## Bảo mật

- `GEMINI_API_KEY` chỉ nằm trong Supabase Vault, không có trong code/git/CI env client-side.
- Mọi request bắt buộc có Supabase JWT hợp lệ (Authorization: Bearer ...). Không có session → 401.
- Lỗi upstream từ Gemini được forward kèm status, **không** kèm API key.
- CORS mở (`*`) — phù hợp pattern Supabase Edge Function; nếu cần restrict, sửa `Access-Control-Allow-Origin` trong `index.ts`.
