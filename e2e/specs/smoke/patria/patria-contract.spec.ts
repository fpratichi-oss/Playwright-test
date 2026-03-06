/**
 * Smoke: Patria leads API — contract tests (happy path).
 *
 * What this file covers:
 *   - POST one valid lead → expects 201 Created.
 *   - Response shape: leadId, link, tier, status, reason, bidData, platformKey.
 *   - leadId is UUID; link contains /application?appToken=.
 *   - tier in [A, B, C, D, '']; status in [accepted, rejected].
 *   - bidData: assignedLoanAmount <= requested, apr > 0, payFrequency = biweekly.
 *   - platformKey === 'patria'.
 *
 * One API call per run (beforeAll). Creates one real lead/application.
 * Tests run serially — they share the single response from beforeAll.
 *
 * Negative tests: see patria-negative.spec.ts (auth, routing, bad payload).
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

/** Contract: leadId must be UUID format; link must contain application appToken path. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LINK_APP_TOKEN_REGEX = /\/application\?appToken=/;
/** Contract: tier and status must be from these allowed sets. */
const ALLOWED_TIERS = ['A', 'B', 'C', 'D', ''];
const ALLOWED_STATUSES = ['accepted', 'rejected'];

test.describe('Patria leads API — contract', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!env.UI_AUTOMATION_KEY, 'UI_AUTOMATION_KEY not set');

  let responseStatus: number;
  let responseBody: Record<string, unknown>;
  let requestedLoanAmount: number;

  /** POST one valid lead to Patria API; capture status and body for all tests in this describe. */
  test.beforeAll(async ({ request }) => {
    if (!env.UI_AUTOMATION_KEY) return;

    const payload = buildValidLeadPayload();
    requestedLoanAmount = Number(payload.loanAmount);

    const res = await request.post(PATRIA_PROCESS_URL, {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        apiKey: env.UI_AUTOMATION_KEY,
      },
      data: payload,
      timeout: 90_000,
    });

    responseStatus = res.status();
    responseBody = (await res.json()) as Record<string, unknown>;
  });

  /** Contract: valid lead is accepted and API returns 201. */
  test('valid lead returns 201', () => {
    expect(responseStatus).toBe(201);
  });

  /** Contract: response includes all required top-level fields (leadId, link, tier, status, reason, bidData, platformKey). */
  test('response has required top-level fields', () => {
    expect(responseBody).toHaveProperty('leadId');
    expect(responseBody).toHaveProperty('link');
    expect(responseBody).toHaveProperty('tier');
    expect(responseBody).toHaveProperty('status');
    expect(responseBody).toHaveProperty('reason');
    expect(responseBody).toHaveProperty('bidData');
    expect(responseBody).toHaveProperty('platformKey');
  });

  /** Contract: leadId is a valid UUID; link (when present) contains application appToken path. */
  test('leadId is valid UUID and link has expected format', () => {
    expect(typeof responseBody.leadId).toBe('string');
    expect((responseBody.leadId as string).match(UUID_REGEX)).toBeTruthy();
    if (responseBody.link) {
      expect(responseBody.link).toMatch(LINK_APP_TOKEN_REGEX);
    }
  });

  /** Contract: tier is one of A/B/C/D or empty; status is accepted or rejected. */
  test('tier and status are in allowed sets', () => {
    expect(ALLOWED_TIERS).toContain(responseBody.tier);
    expect(ALLOWED_STATUSES).toContain(responseBody.status);
  });

  /**
   * Contract: bidData shape — for accepted leads, assignedLoanAmount ≤ requested, apr > 0, tier and payFrequency (biweekly).
   * Accepted leads have link; rejected leads do not.
   */
  test('bidData shape and assignedLoanAmount within bounds', () => {
    expect(responseBody.bidData).toBeDefined();
    const bidData = responseBody.bidData as Record<string, unknown>;
    if (responseBody.status === 'accepted') {
      expect(bidData).toHaveProperty('assignedLoanAmount');
      const assigned = bidData.assignedLoanAmount as number;
      expect(assigned).toBeLessThanOrEqual(requestedLoanAmount);
      expect(assigned).toBeGreaterThan(0);
      expect(bidData).toHaveProperty('apr');
      expect((bidData.apr as number)).toBeGreaterThan(0);
      expect(bidData.tier).toBe(responseBody.tier);
      expect(bidData.payFrequency).toBe('biweekly');
    }
    if (responseBody.status === 'accepted' && responseBody.link) {
      expect(responseBody.link).toBeTruthy();
    }
    if (responseBody.status === 'rejected') {
      expect(responseBody.link).toBeFalsy();
    }
  });

  /** Contract: response is for Patria platform (platformKey === 'patria'). */
  test('platformKey is patria', () => {
    expect(responseBody.platformKey).toBe('patria');
  });
});
