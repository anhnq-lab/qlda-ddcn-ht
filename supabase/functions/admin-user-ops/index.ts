// Edge Function: admin-user-ops
//
// Performs Supabase Auth admin operations (create / update / delete users)
// server-side so the service_role key is NEVER shipped to the browser.
//
// Authorization: caller must be an authenticated admin. We verify the caller's
// JWT against the DB `is_admin()` helper using a user-scoped client BEFORE
// using the service-role client for the privileged operation.
//
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected
// automatically by the Supabase Edge runtime — no secrets in code.

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Restrict CORS to the configured origin. Falls back to '*' only if not set
// (e.g. local dev without .env). Set ALLOWED_ORIGIN in Supabase Edge Function secrets.
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';

const CORS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

type Action = 'createUser' | 'updateUser' | 'deleteUser';

interface RequestBody {
  action: Action;
  payload: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
    return json({ error: 'Server misconfigured' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing Authorization bearer token' }, 401);
  }

  // 1) Authorize: verify the CALLER is an admin, using their own JWT.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: 'Invalid or expired session' }, 401);
  }

  const { data: isAdmin, error: adminErr } = await userClient.rpc('is_admin');
  if (adminErr) {
    return json({ error: 'Authorization check failed' }, 500);
  }
  if (isAdmin !== true) {
    return json({ error: 'Forbidden: admin role required' }, 403);
  }

  // 2) Parse request
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const { action, payload } = body ?? {};
  if (!action || !payload) {
    return json({ error: 'Missing action or payload' }, 400);
  }

  // 3) Perform privileged operation with the service-role client
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    if (action === 'createUser') {
      const { data, error } = await admin.auth.admin.createUser({
        email: payload.email as string,
        password: payload.password as string,
        email_confirm: (payload.email_confirm as boolean) ?? true,
        user_metadata: (payload.user_metadata as Record<string, unknown>) ?? {},
      });
      if (error) return json({ error: error.message }, 400);
      return json({ user: data.user });
    }

    if (action === 'updateUser') {
      const userId = payload.userId as string;
      if (!userId) return json({ error: 'userId required' }, 400);
      const attributes = (payload.attributes as Record<string, unknown>) ?? {};
      const { data, error } = await admin.auth.admin.updateUserById(userId, attributes);
      if (error) return json({ error: error.message }, 400);
      return json({ user: data.user });
    }

    if (action === 'deleteUser') {
      const userId = payload.userId as string;
      if (!userId) return json({ error: 'userId required' }, 400);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: (e as Error).message ?? 'Internal error' }, 500);
  }
});
