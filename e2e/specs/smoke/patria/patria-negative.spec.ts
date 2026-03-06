/**
 * Smoke: Patria leads API — negative tests (auth, routing, bad payload).
 *
 * What this file covers:
 *   - Auth: no apiKey header → 401/403. Invalid apiKey → 401/403.
 *   - Routing: POST to a non-existent tenant path → 404.
 *   - Bad payload: empty body → 4xx. Missing SSN field → 4xx.
 *
 * Why these are safe:
 *   Every request is rejected before business logic runs.
 *   No lead or application is created. No credit bureau call. No cost.
 *
 * Why only SSN and empty body for payload tests:
 *   The API has minimal server-side validation (only merchantKey + SSN).
 *   Fields like loanAmount and bankInformation are not validated at intake —
 *   the API accepts them and lets downstream underwriting/DMN decide.
 *   Testing those would create real accepted leads (application pollution).
 *
 * Happy path reference: patria-contract.spec.ts (valid 201).
 *
 * Requires: UI_AUTOMATION_KEY in .env (local) or GitHub Secrets (CI).
 * Run: npm run test:patria or npm run test:smoke
 */
import { test, expect } from '@playwright/test';
import { env } from '../../../../config/env';
import { paths } from '../../../test-data';
import { buildValidLeadPayload } from '../../../test-data/patria-lead-payload';

const PATRIA_API_PATH = paths.tenants.patria?.apiPath ?? '/api/leads-management/patria/process';
const PATRIA_PROCESS_URL = `${env.API_BASE_URL}${PATRIA_API_PATH}`;
const TIMEOUT = 15_000;

/** Authenticated headers (valid key). Used for payload tests. */
const authedHeaders = (): Record<string, string> => ({
  accept: 'application/json',
  'Content-Type': 'application/json',
  apiKey: env.UI_AUTOMATION_KEY,
});

test.describe('Patria leads API — negative tests', () => {
  test.skip(!env.UI_AUTOMATION_KEY, 'UI_AUTOMATION_KEY not set');

  // ── Auth rejection ─────────────────────────────────────────────

  test('no apiKey returns 401 or 403', async ({ request }) => {
    const res = await request.post(PATRIA_PROCESS_URL, {
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      data: buildValidLeadPayload(),
      timeout: TIMEOUT,
    });
    expect([401, 403]).toContain(res.status());
  });

  test('invalid apiKey returns 401 or 403', async ({ request }) => {
    const res = await request.post(PATRIA_PROCESS_URL, {
      headers: { accept: 'application/json', 'Content-Type': 'application/json', apiKey: 'FAKE' },
      data: buildValidLeadPayload(),
      timeout: TIMEOUT,
    });
    expect([401, 403]).toContain(res.status());
  });

  // ── Routing ────────────────────────────────────────────────────

  test('invalid path returns 404', async ({ request }) => {
    const res = await request.post(`${env.API_BASE_URL}/api/leads-management/INVALID/process`, {
      headers: authedHeaders(),
      data: buildValidLeadPayload(),
      timeout: TIMEOUT,
    });
    expect(res.status()).toBe(404);
  });

  // ── Bad payload (schema-level rejection, no lead created) ─────

  test('empty body is rejected', async ({ request }) => {
    const res = await request.post(PATRIA_PROCESS_URL, {
      headers: authedHeaders(),
      data: {},
      timeout: TIMEOUT,
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('missing SSN is rejected', async ({ request }) => {
    const payload = buildValidLeadPayload();
    const { ssnNumber, ...restPersonal } = payload.personalInformation;
    const res = await request.post(PATRIA_PROCESS_URL, {
      headers: authedHeaders(),
      data: { ...payload, personalInformation: restPersonal },
      timeout: TIMEOUT,
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});
