/**
 * Smoke: Patria leads API — negative tests (auth, routing, bad payload).
 *
 * What this file covers (mapped to PayPlan):
 *   - Auth: FTSKeyAuth guard returns false → 403 Forbidden.
 *     - No apiKey header → 403
 *     - Invalid apiKey → 403
 *   - Routing: non-existent tenant path → 404 (NestJS routing).
 *   - Bad payload (all return 400 BadRequestException):
 *     - Empty body → caught by controller catch-all → 400
 *     - Missing SSN → explicit check in processLead() line 1066 → 400
 *     - Empty SSN → same check (falsy SSN) → 400
 *     - Missing personalInformation → controller catch-all → 400
 *
 * Why these are safe:
 *   Every request is rejected before business logic runs.
 *   No lead or application is created. No credit bureau call. No cost.
 *
 * Why only these payload cases:
 *   The API only validates merchantKey + SSN server-side (leads-management.service.ts).
 *   Fields like loanAmount, bankInformation are NOT validated at intake —
 *   the API accepts them and lets downstream underwriting/DMN decide.
 *   Testing those would create real accepted leads (application pollution).
 *
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

  // ── Auth rejection (FTSKeyAuth guard → 403) ────────────────────

  /** FTSKeyAuth guard: no apiKey in headers/query → canActivate returns false → 403. */
  test('no apiKey returns 403', async ({ request }) => {
    const res = await request.post(PATRIA_PROCESS_URL, {
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      data: buildValidLeadPayload(),
      timeout: TIMEOUT,
    });
    expect(res.status()).toBe(403);
  });

  /** FTSKeyAuth guard: apiKey !== app.ftsToken → canActivate returns false → 403. */
  test('invalid apiKey returns 403', async ({ request }) => {
    const res = await request.post(PATRIA_PROCESS_URL, {
      headers: { accept: 'application/json', 'Content-Type': 'application/json', apiKey: 'FAKE' },
      data: buildValidLeadPayload(),
      timeout: TIMEOUT,
    });
    expect(res.status()).toBe(403);
  });

  // ── Routing (NestJS → 404) ─────────────────────────────────────

  /** No route registered for /INVALID/ → NestJS returns 404. */
  test('invalid tenant path returns 404', async ({ request }) => {
    const res = await request.post(`${env.API_BASE_URL}/api/leads-management/INVALID/process`, {
      headers: authedHeaders(),
      data: buildValidLeadPayload(),
      timeout: TIMEOUT,
    });
    expect(res.status()).toBe(404);
  });

  // ── Bad payload (controller catch-all / service validation → 400) ──

  /** Empty body: no personalInformation, no SSN → caught by controller catch block → 400. */
  test('empty body returns 400', async ({ request }) => {
    const res = await request.post(PATRIA_PROCESS_URL, {
      headers: authedHeaders(),
      data: {},
      timeout: TIMEOUT,
    });
    expect(res.status()).toBe(400);
  });

  /** Missing SSN field entirely: processLead() checks !transformedPayload.lead.ssn → 400. */
  test('missing SSN field returns 400', async ({ request }) => {
    const payload = buildValidLeadPayload();
    const { ssnNumber, ...restPersonal } = payload.personalInformation;
    const res = await request.post(PATRIA_PROCESS_URL, {
      headers: authedHeaders(),
      data: { ...payload, personalInformation: restPersonal },
      timeout: TIMEOUT,
    });
    expect(res.status()).toBe(400);
  });

  /** Empty SSN string: processLead() checks !transformedPayload.lead.ssn (falsy) → 400. */
  test('empty SSN string returns 400', async ({ request }) => {
    const payload = buildValidLeadPayload({ ssnNumber: '' });
    const res = await request.post(PATRIA_PROCESS_URL, {
      headers: authedHeaders(),
      data: payload,
      timeout: TIMEOUT,
    });
    expect(res.status()).toBe(400);
  });

  /** Missing personalInformation entirely: transformPayload fails → controller catch → 400. */
  test('missing personalInformation returns 400', async ({ request }) => {
    const payload = buildValidLeadPayload();
    const { personalInformation, ...rest } = payload;
    const res = await request.post(PATRIA_PROCESS_URL, {
      headers: authedHeaders(),
      data: rest,
      timeout: TIMEOUT,
    });
    expect(res.status()).toBe(400);
  });
});
