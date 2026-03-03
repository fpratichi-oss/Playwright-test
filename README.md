# Playwright-test – PayPlan E2E

This repo contains a small Playwright E2E suite for PayPlan:  
- **Admin UI smoke**: platform admin login + Manage Tenants list.  
- **Patria API contract**: POST a lead and validate the full response shape.

We will use the **same tests for different environments** (staging, UAT, later prod) by changing env vars and CI workflows.

---

## For the PayPlan dev team

- **Most important:** [How to wire this into staging (after deploy, non‑blocking)](#how-to-wire-this-into-staging-after-deploy-nonblocking)

### What we’re doing now

- **Staging first (current focus)**  
  - Run this suite **after each deploy to staging** (branch `develop`).  
  - Non‑blocking: failures only send a **Slack notification** and do not stop merges.

- **Next: UAT**  
  - Reuse this suite as a **blocking PR check** before merging to UAT.

- **Later: Prod**  
  - Run a carefully scoped subset as a **blocking PR check** before production deploys.

The tests themselves live in this repo. The PayPlan app repo wires them into your pipelines via GitHub Actions.

---

### What the suite covers

- **Admin smoke (UI, staging/UAT/ via env)**  
  - Happy path: admin logs in and sees **Manage Tenants** list.  
  - Negative: invalid credentials stay on login page.  
  - Unauthenticated: direct access to Manage Tenants redirects to login.

- **Patria contract (API, staging/UAT via env)**  
  - POST a valid lead to the Patria leads endpoint.  
  - Assert:
    - HTTP 201 for accepted lead.  
    - Response fields: `leadId`, `link`, `tier`, `status`, `reason`, `bidData`, `platformKey`.  
    - `leadId` format (UUID), `link` contains `/application?appToken=`, `tier`/`status` enums, `bidData` bounds and consistency.

---

### How to wire this into staging (after deploy, non‑blocking)

**Goal:** After each staging deploy (push to `develop`), run this suite against staging and send a Slack notification if it fails. Do **not** block merges.

**What we need from you:**

1. **GitHub Secrets (PayPlan repo)**  
   In **Settings → Secrets and variables → Actions** add:

   - `STAGING_BASE_URL` → e.g. `https://dev.payplan.dev`
   - `STAGING_API_BASE_URL` → e.g. `https://api.staging.payplan.ai`
   - `STAGING_ADMIN_EMAIL`
   - `STAGING_ADMIN_PASSWORD`
   - `STAGING_UI_AUTOMATION_KEY` (optional; needed if Patria tests should run)

2. **New workflow file in the PayPlan repo**  
   Add **`.github/workflows/playwright-testsuite.yml`**. That workflow should:

   - Run **after** staging deploy (e.g. `workflow_run` on `deploy-to-staging.yml` success, or a job with `needs: deployment` inside that workflow—your choice).
   - Check out this test repo: `fpratichi-oss/Playwright-test` into a folder (e.g. `playwright-tests`).
   - In that folder: `npm ci` → `npx playwright install --with-deps chromium` → `npm run test:ci`.
   - Pass these env vars into the `npm run test:ci` step (same names the Playwright suite expects):

   | Env var (in workflow) | Secret (in PayPlan repo) |
   |------------------------|---------------------------|
   | `BASE_URL`            | `${{ secrets.STAGING_BASE_URL }}` |
   | `API_BASE_URL`        | `${{ secrets.STAGING_API_BASE_URL }}` |
   | `ADMIN_EMAIL`         | `${{ secrets.STAGING_ADMIN_EMAIL }}` |
   | `ADMIN_PASSWORD`      | `${{ secrets.STAGING_ADMIN_PASSWORD }}` |
   | `UI_AUTOMATION_KEY`   | `${{ secrets.STAGING_UI_AUTOMATION_KEY }}` |
   | `CI`                  | `true` |

   - On failure: post a Slack message with a link to the run (non‑blocking).

---

### How to wire this into UAT / prod later (high‑level)

Once staging is stable:

- **UAT PR workflow**  
  - Trigger: PR from `develop`/`staging` → `uat`.  
  - Steps: same as staging, but use UAT secrets (`BASE_URL`, `API_BASE_URL`, etc.).  
  - Mark the E2E job as a **required check** once you’re comfortable.

- **Prod PR workflow**  
  - Trigger: PR from `uat` → `main`.  
  - Steps: same pattern, but with prod URLs and creds.  
  - Likely run a **smaller, critical subset** of tests.

The existing UAT‑focused workflow in this repo (`.github/workflows/e2e-uat.yml`) is only for running this suite directly on this repo; the recommended approach for the PayPlan app is to use the patterns above.

---

## Env vars (reference)

The tests read the following variables (from `.env` locally or from CI env/secrets):

| Variable           | Description                                                            |
|--------------------|------------------------------------------------------------------------|
| `BASE_URL`         | App base URL (staging/UAT/prod)                                       |
| `API_BASE_URL`     | API base URL for Patria contract tests                                |
| `ADMIN_LOGIN_PATH` | Admin login path (defaults to `/platform/admin/login`)                |
| `MANAGE_TENANTS_PATH` | Manage Tenants path (defaults to `/platform/admin/manage-tenants`) |
| `ADMIN_EMAIL`      | Platform admin email                                                  |
| `ADMIN_PASSWORD`   | Platform admin password                                               |
| `UI_AUTOMATION_KEY`| API key for Patria lead API. **Required in CI** (both flows run). Optional locally (Patria skipped if unset). |

**Local convention:**

- `.env` – usually used for UAT‑like runs (see `.env.example`).  
- `.env.staging` – used for staging runs; loaded when you set `APP_ENV=staging`.

---

## Details for QA / local usage

### Project structure

```text
├── config/                    # Env loading + shared config (UAT defaults)
│   ├── env.ts                 # Re-exports from env/
│   ├── global-setup.ts
│   └── env/                   # load.ts, index.ts, uat.ts
├── e2e/
│   ├── fixtures/
│   │   └── auth.fixture.ts
│   ├── pages/
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
│   └── e2e-uat.yml            # Internal CI for this repo, targets UAT via secrets
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

### Tests (current)

| Spec | What it does |
|------|--------------|
| `smoke/platform-admin/admin-panel-login-and-tenant-list.spec.ts` | Admin login → Manage Tenants list; invalid credentials; unauthenticated redirect (3 tests) |
| `smoke/patria/patria-contract.spec.ts` | POST lead to Patria API → assert 201 and response contract (leadId, link, tier, bidData, platformKey) (6 tests) |

**Total:** 2 spec files, 9 tests. Chromium only; config from env.

### Commands (local)

| Command                 | What it runs                                   |
|-------------------------|-----------------------------------------------|
| `npm run test` / `npm run test:ci` | Full suite (admin + Patria)            |
| `npm run test:smoke`    | Full suite, scoped to `e2e/specs/smoke`       |
| `npm run test:admin`    | Admin specs only (platform-admin)             |
| `npm run test:patria`   | Patria contract spec only                     |
| `npm run report`        | Open last HTML report                         |

Patria tests run only when `UI_AUTOMATION_KEY` is set.

### Local setup

1. **Install**

   ```bash
   npm install
   npx playwright install chromium
   ```

2. **Environment**

   ```bash
   cp .env.example .env   # example for a UAT-like run
   ```

   - For a **UAT-like local run**, set in `.env`:
     - `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
     - Optional: `API_BASE_URL`, `UI_AUTOMATION_KEY` (enables Patria tests)

   - For **staging local runs**, create `.env.staging`:
     - `BASE_URL` – staging UI URL (e.g. `https://dev.payplan.dev`)
     - `ADMIN_EMAIL`, `ADMIN_PASSWORD` – staging admin user
     - `API_BASE_URL` – staging API URL (e.g. `https://api.staging.payplan.ai`)
     - Optional: `UI_AUTOMATION_KEY` – staging Patria automation key

     Then run commands with:

     ```bash
     APP_ENV=staging <your npm / npx command>
     ```

3. **Run**

   ```bash
   npm run test:admin    # admin only
   npm run test:ci       # full suite
   ```

### Test data and credentials

- **Secrets** (never commit): in `.env`/`.env.staging` locally; GitHub Secrets in CI. Used via `config/env` (`env.ADMIN_EMAIL`, `env.ADMIN_PASSWORD`, `env.UI_AUTOMATION_KEY`, etc.).
- **Non-secret data**: `e2e/test-data/` — `application.json`, `paths.json`, and `patria-lead-payload.ts`. Import `applicationTestData`, `paths`, or `buildValidLeadPayload` from `e2e/test-data` (adjust path based on spec location).

### Requirements

- **Node** `>=20` (see `engines` in `package.json`).
- **Lockfile**: Commit `package-lock.json` so `npm ci` works in CI.
- **Lint**: `npm run lint` (or `npm run lint:fix`) before pushing.

