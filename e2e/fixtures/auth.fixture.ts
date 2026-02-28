/**
 * Auth fixtures: reusable setup for admin login.
 * Use these in specs when you need a login page or an already-logged-in page
 * so you don't repeat login steps in every test.
 */
import { test as base, Page } from '@playwright/test';
import { AdminLoginPage } from '../pages/platform-admin/AdminLogin.page';
import { env } from '../../config/env';

type AuthFixtures = {
  adminLoginPage: AdminLoginPage;
  loggedInPage: Page;
};

export const test = base.extend<AuthFixtures>({
  /** Injects a ready-to-use AdminLoginPage for the current page. */
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },

  /** Performs login with env credentials and gives you the same page, already past login. */
  loggedInPage: async ({ page, adminLoginPage }, use) => {
    await adminLoginPage.goto();
    await adminLoginPage.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
    await use(page);
  },
});

export { expect } from '@playwright/test';
