/**
 * Page object for the platform admin Manage Tenants screen.
 * Condition-based selectors: role + text so assertions wait for real content.
 */
import { Page } from '@playwright/test';
import { env } from '../../../config/env';

export class TenantListPage {
  constructor(private readonly page: Page) {}

  /** Open the Manage Tenants page and wait for load (requires admin to be logged in). */
  async goto(): Promise<void> {
    await this.page.goto(env.MANAGE_TENANTS_PATH, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /**
   * Asserts the Manage Tenants page title (h4) is visible.
   * Uses getByRole('heading') only so we match the main title, not the sidebar link
   * "Manage Tenants" (strict mode: page has both a link and an h4 with same text).
   */
  async expectManageTenantsHeadingVisible(): Promise<void> {
    await this.page
      .getByRole('heading', { name: 'Manage Tenants' })
      .waitFor({ state: 'visible', timeout: 20_000 });
  }

  /** Asserts the tenant list summary is visible (e.g. "Showing X of Y tenants"). */
  async expectTenantListVisible(): Promise<void> {
    const listIndicator = this.page
      .getByText(/showing \d+ of \d+ tenants/i)
      .or(this.page.getByText(/\d+ of \d+ tenants/i))
      .first();
    await listIndicator.waitFor({ state: 'visible', timeout: 20_000 });
  }
}
