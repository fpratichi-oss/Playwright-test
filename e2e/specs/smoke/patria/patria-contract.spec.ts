/**
 * Patria leads API — Category A: contract tests.
 * Asserts that the API returns a well-formed 201 response (structure, types, bounds).
 * Run when UI_AUTOMATION_KEY is set (skipped otherwise so CI without the secret stays green).
 * Run: npm run test:patria or npm run test:smoke
 */
import { test, expect } from '@playwright/test';
import { env } from '../../../../config/env';
import { paths } from '../../../test-data';
import { buildValidLeadPayload } from '../../../test-data/patria-lead-payload';

const PATRIA_API_PATH = paths.tenants.patria?.apiPath ?? '/api/leads-management/patria/process';
const PATRIA_PROCESS_URL = `${env.API_BASE_URL}${PATRIA_API_PATH}`;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LINK_APP_TOKEN_REGEX = /\/application\?appToken=/;
const ALLOWED_TIERS = ['A', 'B', 'C', 'D', ''];
const ALLOWED_STATUSES = ['accepted', 'rejected'];

test.describe('Patria leads API — contract', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!env.UI_AUTOMATION_KEY, 'UI_AUTOMATION_KEY not set');

  let responseStatus: number;
  let responseBody: Record<string, unknown>;
  let requestedLoanAmount: number;

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

  test('valid lead returns 201', () => {
    expect(responseStatus).toBe(201);
  });

  test('response has required top-level fields', () => {
    expect(responseBody).toHaveProperty('leadId');
    expect(responseBody).toHaveProperty('link');
    expect(responseBody).toHaveProperty('tier');
    expect(responseBody).toHaveProperty('status');
    expect(responseBody).toHaveProperty('reason');
    expect(responseBody).toHaveProperty('bidData');
    expect(responseBody).toHaveProperty('platformKey');
  });

  test('leadId is valid UUID and link has expected format', () => {
    expect(typeof responseBody.leadId).toBe('string');
    expect((responseBody.leadId as string).match(UUID_REGEX)).toBeTruthy();
    if (responseBody.link) {
      expect(responseBody.link).toMatch(LINK_APP_TOKEN_REGEX);
    }
  });

  test('tier and status are in allowed sets', () => {
    expect(ALLOWED_TIERS).toContain(responseBody.tier);
    expect(ALLOWED_STATUSES).toContain(responseBody.status);
  });

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

  test('platformKey is patria', () => {
    expect(responseBody.platformKey).toBe('patria');
  });
});
