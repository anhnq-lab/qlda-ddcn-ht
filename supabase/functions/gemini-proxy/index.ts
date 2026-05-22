// Edge Function: gemini-proxy
//
// Proxies Google Gemini API calls server-side so GEMINI_API_KEY is NEVER
// shipped to the browser. Caller must be an authenticated Supabase user.
//
// Required Supabase secrets:
//   - SUPABASE_URL              (injected automatically)
//   - SUPABASE_ANON_KEY         (injected automatically)
//   - GEMINI_API_KEY            (set via `supabase secrets set GEMINI_API_KEY=...`)
//
// Wire protocol: caller POSTs { model, contents, tools?, systemInstruction?,
// generationConfig? } — exactly the shape Gemini's REST generateContent accepts.
// Response is the raw Gemini response JSON. The client SDK shim (services/ai/
// geminiProxy.ts) wraps it back into the same surface that GoogleGenerativeAI
// used to expose, so callers in services/ai/* don't change.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-pro';
const ALLOWED_MODELS = new Set([
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
]);

interface RequestBody {
  model?: string;
  contents: unknown;
  tools?: unknown;
  systemInstruction?: unknown;
  generationConfig?: unknown;
  safetySettings?: unknown;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!SUPABASE_URL || !ANON_KEY || !GEMINI_API_KEY) {
    return json({ error: 'Server misconfigured' }, 500);
  }

  // 1) Authorize: verify the caller has a valid Supabase session.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing Authorization bearer token' }, 401);
  }
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: 'Invalid or expired session' }, 401);
  }

  // 2) Parse + validate
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body || typeof body !== 'object' || !body.contents) {
    return json({ error: 'Missing required field: contents' }, 400);
  }
  const model = body.model || DEFAULT_MODEL;
  if (!ALLOWED_MODELS.has(model)) {
    return json({ error: `Model not allowed: ${model}` }, 400);
  }

  // 3) Forward to Gemini REST API
  const upstreamPayload: Record<string, unknown> = { contents: body.contents };
  if (body.tools) upstreamPayload.tools = body.tools;
  if (body.systemInstruction) upstreamPayload.systemInstruction = body.systemInstruction;
  if (body.generationConfig) upstreamPayload.generationConfig = body.generationConfig;
  if (body.safetySettings) upstreamPayload.safetySettings = body.safetySettings;

  try {
    const upstream = await fetch(
      `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upstreamPayload),
      }
    );

    const text = await upstream.text();
    if (!upstream.ok) {
      // Surface upstream error but never leak the API key
      let detail: unknown = text;
      try {
        detail = JSON.parse(text);
      } catch {
        /* keep raw text */
      }
      return json({ error: 'Gemini upstream error', status: upstream.status, detail }, upstream.status);
    }

    // Pass through the raw Gemini response — client shim re-shapes it.
    return new Response(text, {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return json({ error: (e as Error).message ?? 'Internal error' }, 500);
  }
});
