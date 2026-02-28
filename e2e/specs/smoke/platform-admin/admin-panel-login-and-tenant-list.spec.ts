/**
 * Smoke: admin panel — login and Manage Tenants list.
 * Covers: happy path (login → tenants), invalid credentials, unauthenticated redirect.
 * Run with: npm run test:smoke or npm run test:admin
 */
import { Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/auth.fixture';
import { AdminLoginPage } from '../../../pages/platform-admin/AdminLogin.page';
import { TenantListPage } from '../../../pages/platform-admin/TenantList.page';
import { requireEnvForE2E } from '../../../../config/env';
import { env } from '../../../../config/env';

test.describe('Platform Admin — login and tenant list', () => {
  test.beforeAll(() => {
    requireEnvForE2E();
  });

  /** Happy path: valid login → land on Manage Tenants → heading and list visible. */
  test('admin logs in and sees Manage Tenants list', async ({ loggedInPage }: { loggedInPage: Page }) => {
    const tenantListPage = new TenantListPage(loggedInPage);
    await tenantListPage.goto();
    await tenantListPage.expectManageTenantsHeadingVisible();
    await tenantListPage.expectTenantListVisible();
  });

  /**
   * Negative: invalid credentials → user remains on login page (no redirect).
   * We do not assert the exact error message; UAT may show different copy. The critical check is: no login.
   */
  test('login fails with invalid credentials and stays on login page', async ({ page }) => {
    const adminLoginPage = new AdminLoginPage(page);
    await adminLoginPage.goto();
    await adminLoginPage.fillAndSubmit('invalid@test.com', 'wrongpassword');
    await adminLoginPage.expectStillOnLoginPage();
  });

  /** Unauthenticated access: open manage-tenants without login → redirect to login. */
  test('unauthenticated access to manage-tenants redirects to login', async ({ page }) => {
    await page.goto(env.MANAGE_TENANTS_PATH);
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
