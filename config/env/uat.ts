/**
 * UAT environment config.
 * URLs, paths, and credentials for PayPlan UAT only.
 */

/** Typed UAT env for consumers (single source of truth). */
export interface UatEnv {
  BASE_URL: string;
  API_BASE_URL: string;
  ADMIN_LOGIN_PATH: string;
  MANAGE_TENANTS_PATH: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  UI_AUTOMATION_KEY: string;
}

const isCI = process.env.CI === 'true' || process.env.CI === '1';

/** Fail fast if required UAT env vars are missing. Call before admin specs. */
export function requireEnvForE2E(): void {
  const missing: string[] = [];
  if (!process.env.BASE_URL?.trim() && isCI) missing.push('BASE_URL');
  if (!process.env.ADMIN_EMAIL?.trim()) missing.push('ADMIN_EMAIL');
  if (!process.env.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD');
  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars: ${missing.join(', ')}. Set them in .env (local) or GitHub Secrets (CI). See .env.example.`
    );
  }
}

const UAT_DEFAULTS = {
  BASE_URL: 'https://uat.payplan.ai',
  API_BASE_URL: 'https://uat-api.payplan.ai',
  ADMIN_LOGIN_PATH: '/platform/admin/login',
  MANAGE_TENANTS_PATH: '/platform/admin/manage-tenants',
} as const;

function buildUatEnv(): UatEnv {
  if (isCI && !process.env.BASE_URL?.trim()) {
    throw new Error('BASE_URL is required in CI. Set it in GitHub Secrets.');
  }
  const BASE_URL = (process.env.BASE_URL || (isCI ? '' : UAT_DEFAULTS.BASE_URL)).replace(/\/$/, '');
  const API_BASE_URL = (process.env.API_BASE_URL || UAT_DEFAULTS.API_BASE_URL).replace(/\/$/, '');
  const ADMIN_LOGIN_PATH = process.env.ADMIN_LOGIN_PATH || UAT_DEFAULTS.ADMIN_LOGIN_PATH;
  const MANAGE_TENANTS_PATH = process.env.MANAGE_TENANTS_PATH || UAT_DEFAULTS.MANAGE_TENANTS_PATH;

  return {
    BASE_URL,
    API_BASE_URL,
    ADMIN_LOGIN_PATH: ADMIN_LOGIN_PATH.startsWith('/') ? ADMIN_LOGIN_PATH : `/${ADMIN_LOGIN_PATH}`,
    MANAGE_TENANTS_PATH: MANAGE_TENANTS_PATH.startsWith('/') ? MANAGE_TENANTS_PATH : `/${MANAGE_TENANTS_PATH}`,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? '',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? '',
    UI_AUTOMATION_KEY: process.env.UI_AUTOMATION_KEY ?? process.env.PATRIA_API_KEY ?? '',
  } as const;
}

let _env: UatEnv | null = null;

/** Lazy singleton so env is built after loadEnv() has run (e.g. in playwright.config or global-setup). */
function getEnv(): UatEnv {
  if (!_env) _env = buildUatEnv();
  return _env;
}

/** Call after loadEnv() to run CI checks from one place (e.g. global-setup). In CI, requires all secrets so both admin and Patria run (no skipping). */
export function validateUatEnvForE2E(): void {
  const e = getEnv();
  if (!isCI) return;

  const missing: string[] = [];
  if (!process.env.BASE_URL?.trim()) missing.push('BASE_URL');
  if (!process.env.ADMIN_EMAIL?.trim()) missing.push('ADMIN_EMAIL');
  if (!process.env.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD');
  if (!e.UI_AUTOMATION_KEY) missing.push('UI_AUTOMATION_KEY');
  if (missing.length > 0) {
    throw new Error(
      `CI requires these GitHub Secrets (admin + Patria): ${missing.join(', ')}. Set them so both flows run without skipping. See .env.example / README.`
    );
  }
}

/** Env object: built on first access so loadEnv() can run first. */
export const env = new Proxy({} as UatEnv, {
  get(_, key: keyof UatEnv) {
    return getEnv()[key];
  },
});
