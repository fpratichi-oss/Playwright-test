# Playwright-test – PayPlan UAT E2E

E2E test suite for PayPlan **UAT only**: admin login/tenant list (UI) and Patria lead API (contract). Tests run in this repo; to run them on every **PayPlan app PR**, the dev team adds a workflow in the PayPlan repo (see [CI integration — QA request to dev team](#ci-integration--qa-request-to-dev-team)).

## Project structure

```
├── config/                    # Env loading + UAT config (env.ts, env/, global-setup.ts)
├── e2e/
│   ├── fixtures/              # Auth fixture (logged-in admin page)
│   │   └── auth.fixture.ts
│   ├── pages/                 # Page Object Model
│   │   └── platform-admin/
│   │       ├── AdminLogin.page.ts
│   │       └── TenantList.page.ts
│   ├── specs/
│   │   └── smoke/
│   │       ├── platform-admin/
│   │       │   └── admin-panel-login-and-tenant-list.spec.ts
│   │       └── patria/
│   │           └── patria-contract.spec.ts
│   └── test-data/             # Non-secret data (JSON + payload builders)
│       ├── index.ts           # Exports applicationTestData, paths
│       ├── application.json
│       ├── paths.json
│       └── patria-lead-payload.ts
├── .github/workflows/
│   └── e2e-uat.yml            # Runs on PR to main/master in this repo
├── playwright.config.ts
└── package.json
```

## Tests (current)

| Spec | What it does |
|------|----------------|
| `smoke/platform-admin/admin-panel-login-and-tenant-list.spec.ts` | Admin login → Manage Tenants list; invalid credentials; unauthenticated redirect (3 tests) |
| `smoke/patria/patria-contract.spec.ts` | POST lead to Patria API → assert 201 and response contract (leadId, link, tier, bidData, platformKey). In CI both flows run; locally skipped if `UI_AUTOMATION_KEY` not set (6 tests) |

**Total:** 2 spec files, 9 tests. Chromium only; config from env.

## Commands

| Command | What it runs |
|---------|----------------|
| `npm run test` or `npm run test:ci` | Full suite (admin + Patria). In CI both run; locally Patria runs only if `UI_AUTOMATION_KEY` set. |
| `npm run test:smoke` | Same, scoped to `e2e/specs/smoke` |
| `npm run test:admin` | Admin specs only (platform-admin) |
| `npm run test:patria` | Patria contract spec only (skipped locally without `UI_AUTOMATION_KEY`) |
| `npm run report` | Open last HTML report |

## Local setup

1. **Install**
   ```bash
   npm install
   npx playwright install chromium
   ```

2. **Environment**
   ```bash
   cp .env.example .env
   ```
   Set in `.env`: `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Optional: `API_BASE_URL`, `UI_AUTOMATION_KEY` (enables Patria tests).

3. **Run**
   ```bash
   npm run test:admin    # admin only
   npm run test:ci      # full suite (Patria skipped if no key)
   ```

## Test data and credentials

- **Secrets** (never commit): in `.env` locally; GitHub Secrets in CI. Used via `config/env` (`env.ADMIN_EMAIL`, `env.ADMIN_PASSWORD`, `env.UI_AUTOMATION_KEY`, etc.).
- **Non-secret data**: `e2e/test-data/` — `application.json`, `paths.json`, and `patria-lead-payload.ts`. Import `applicationTestData`, `paths`, or `buildValidLeadPayload` from `e2e/test-data` (adjust path from spec).

## Requirements

- **Node** `>=20` (see `engines` in `package.json`).
- **Lockfile**: Commit `package-lock.json` so `npm ci` works in CI.
- **Lint**: `npm run lint` (or `npm run lint:fix`) before pushing.

## CI (this repo)

- **Workflow:** `.github/workflows/e2e-uat.yml` runs on **pull_request** to `main` or `master`.
- **Required secrets (both admin and Patria run):** `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `UI_AUTOMATION_KEY`. Optional: `API_BASE_URL`. If any required secret is missing, global-setup fails and no tests run.
- On failure: download **playwright-report** and **test-results** artifacts from the run.

## CI integration — QA request to dev team

**From QA:** We’ve set up this Playwright E2E test suite for PayPlan UAT (admin login, tenant list, Patria lead API). To get the most value from it, we’re asking the dev team to run these tests automatically on **every PR** in the PayPlan app repo.

**What we need from you:**

1. **Add a GitHub Actions workflow in the PayPlan repo** (not in this test repo) that:
   - Runs on every **pull request** to `main` or `master`.
   - Checks out the PayPlan app repo, then checks out **this test repo** into a subfolder (e.g. `Playwright-test`).
   - In that folder: run `npm ci`, then `npx playwright install --with-deps chromium`, then `npm run test:ci`.
   - Supplies the required env vars from **PayPlan repo** GitHub Secrets (see below).

2. **Configure these Secrets** in the PayPlan repo (Settings → Secrets and variables → Actions):

   **Required so both admin and Patria run (no skipping in CI):**
   - `BASE_URL` — UAT app URL (e.g. `https://uat.payplan.ai`)
   - `ADMIN_EMAIL` — UAT platform admin email
   - `ADMIN_PASSWORD` — UAT platform admin password
   - `UI_AUTOMATION_KEY` — API key the Patria lead API expects in the `apiKey` header. CI fails at startup if this is missing so both flows always run.

   **Optional:** `API_BASE_URL` — defaults to `https://uat-api.payplan.ai` if not set.

   If this test repo is **private** or in another org: add a PAT in a secret (e.g. `TEST_REPO_PAT`) so the workflow can clone this repo.

3. **No app code changes** — only a new workflow file and the above secrets. The workflow just clones this repo and runs the tests; your PR will show a pass/fail check (e.g. “E2E UAT – Playwright”).

**Result:** Every PayPlan PR runs both admin and Patria tests. On failure, download the **playwright-report** and **test-results** artifacts from the workflow run to debug. If you need a sample workflow YAML or have questions, reach out to QA.

**Why `UI_AUTOMATION_KEY`?** The Patria lead API requires this key in the request header. In **CI it is required** — if missing, the run fails at startup so both flows are always executed. Locally, Patria tests are skipped when the key is not set so you can run admin-only.

## Env vars (reference)

| Variable | Description |
|----------|-------------|
| BASE_URL | UAT app base URL |
| API_BASE_URL | UAT API base URL |
| ADMIN_LOGIN_PATH | Admin login path |
| MANAGE_TENANTS_PATH | Manage Tenants path |
| ADMIN_EMAIL | Platform admin email (UAT) |
| ADMIN_PASSWORD | Platform admin password (UAT) |
| UI_AUTOMATION_KEY | API key for Patria lead API. **Required in CI** (both flows run). Optional locally (Patria skipped if unset). |

Use `.env` locally and GitHub Secrets in CI. Do not commit real values; `.env.example` has placeholders only.
