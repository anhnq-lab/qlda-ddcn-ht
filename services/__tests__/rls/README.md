# RLS Integration Tests

End-to-end tests that hit a real Supabase project to verify Row Level Security policies. **Always point these at a staging database, never production.**

## What they cover

5 critical tables × 4 personas (admin / project member / outsider / contractor):

- `projects` — admin sees all, member sees own, outsider sees none
- `payments` — read scoping + outsider INSERT denied
- `contracts` — read scoping + outsider UPDATE denied
- `documents` — contractor scope + outsider DELETE denied
- `tasks`     — full scope matrix

Tests **skip themselves** when env vars are missing — they won't break CI for missing creds.

## One-time setup on a staging Supabase project

1. **Apply all migrations** (especially the P0-6 departments migration):
   ```bash
   supabase db push
   ```

2. **Seed test users** — create 4 auth users + matching `employees` rows:
   ```sql
   -- via Supabase Studio SQL editor (using service-role):
   --   • admin@test         → employees.role = 'Admin'
   --   • member@test        → in `project_members` for TEST_PROJECT_ID
   --   • outsider@test      → in NO project_members rows
   --   • contractor@test    → row in `contractor_accounts`
   ```

3. **Pick a project ID** in that staging DB for `TEST_PROJECT_ID`.

## Running locally

Add to `.env.test` (NOT `.env`, NOT committed):

```ini
SUPABASE_TEST_URL=https://<staging>.supabase.co
SUPABASE_TEST_ANON_KEY=<anon>
SUPABASE_TEST_SERVICE_ROLE_KEY=<service-role>

SUPABASE_TEST_ADMIN_EMAIL=admin@test
SUPABASE_TEST_ADMIN_PASSWORD=...
SUPABASE_TEST_MEMBER_EMAIL=member@test
SUPABASE_TEST_MEMBER_PASSWORD=...
SUPABASE_TEST_OUTSIDER_EMAIL=outsider@test
SUPABASE_TEST_OUTSIDER_PASSWORD=...
SUPABASE_TEST_CONTRACTOR_EMAIL=contractor@test
SUPABASE_TEST_CONTRACTOR_PASSWORD=...
SUPABASE_TEST_PROJECT_ID=<existing project_id>
```

Then:

```bash
# load .env.test (powershell)
Get-Content .env.test | ForEach-Object {
  if ($_ -match '^\s*([A-Z_]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2]) }
}
npx vitest run services/__tests__/rls/
```

Or on bash:
```bash
set -a; source .env.test; set +a
npm run test:run -- services/__tests__/rls/
```

## Running in CI

Add the env vars as GitHub repository secrets, then in `.github/workflows/ci.yml`:

```yaml
      - name: RLS integration tests
        if: github.event_name == 'pull_request'
        run: npm run test:run -- services/__tests__/rls/
        env:
          SUPABASE_TEST_URL:              ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_TEST_ANON_KEY:         ${{ secrets.SUPABASE_TEST_ANON_KEY }}
          SUPABASE_TEST_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_TEST_SERVICE_ROLE_KEY }}
          # ... persona creds
          SUPABASE_TEST_PROJECT_ID:       ${{ secrets.SUPABASE_TEST_PROJECT_ID }}
```

## Safety notes

- Tests only INSERT/UPDATE/DELETE with rows that should be denied, so on a healthy RLS posture they make zero state changes.
- If a test ever flips green-to-red because RLS got loosened, **revert the migration immediately** — these are guardrail tests for the highest-impact security boundary in the app.
- The `__rls_test_*` markers in INSERT/UPDATE payloads make orphan rows easy to grep for if the policies ever do let one through.
