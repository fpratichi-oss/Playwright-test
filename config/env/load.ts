/**
 * Shared env loading. No environment-specific URLs or secrets here.
 *
 * Locally:
 * - APP_ENV=staging → loads .env.staging
 * - APP_ENV=uat     → loads .env.uat
 * - no APP_ENV      → falls back to .env
 *
 * In CI:
 * - We usually rely on real env vars / GitHub Secrets; these calls are a no-op
 *   if the corresponding files don't exist.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export function loadEnv(): void {
  const root = process.cwd();
  const appEnv = process.env.APP_ENV || process.env.PAYPLAN_ENV;

  if (appEnv) {
    const envFile = path.resolve(root, `.env.${appEnv}`);
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile });
      return;
    }
  }

  // Fallback: regular .env at project root (UAT in your current setup)
  const defaultEnv = path.resolve(root, '.env');
  if (fs.existsSync(defaultEnv)) {
    dotenv.config({ path: defaultEnv });
  }
}
