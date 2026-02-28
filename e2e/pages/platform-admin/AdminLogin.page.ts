/**
 * Page object for the PayPlan platform admin login screen.
 * UAT: https://uat.payplan.ai/platform/admin/login
 */
import { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { env } from '../../../config/env';

export class AdminLoginPage {
  constructor(private readonly page: Page) {}

  /** Open the platform admin login page and wait for the form to be ready. */
  async goto(): Promise<void> {
    await this.page.goto(env.ADMIN_LOGIN_PATH, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Fill email/password and submit; waits until URL no longer contains /login.
   * Use for the happy path (valid credentials).
   */
  async login(email: string, password: string): Promise<void> {
    await this.page.locator('input[name="email"]').fill(email);
    await this.page.locator('input[name="password"]').fill(password);
    await this.page.locator('[type="submit"]').click();
    await this.page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
  }

  /**
   * Fill email/password and click submit without waiting for navigation.
   * Use for negative tests (invalid credentials) — then assert error and still on /login.
   */
  async fillAndSubmit(email: string, password: string): Promise<void> {
    await this.page.locator('input[name="email"]').fill(email);
    await this.page.locator('input[name="password"]').fill(password);
    await this.page.locator('[type="submit"]').click();
  }

  /** Asserts an error message is visible (e.g. invalid credentials). Uses specific phrases to avoid false positives. */
  async expectErrorMessageVisible(): Promise<void> {
    const errorLocator = this.page
      .getByRole('alert')
      .or(this.page.getByText(/invalid|incorrect|login failed|wrong password|wrong email|credentials|unauthorized/i))
      .first();
    await expect(errorLocator).toBeVisible({ timeout: 10_000 });
  }

  /** Asserts we are still on the login page (URL contains /login). */
  async expectStillOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/, { timeout: 5_000 });
  }
}
