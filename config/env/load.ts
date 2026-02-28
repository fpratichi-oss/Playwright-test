/**
 * Shared env loading. No environment-specific URLs or secrets here.
 * E2E runs against UAT only.
 */
import dotenv from 'dotenv';
import path from 'path';

/** Load .env from project root so process.env is populated before tests run. */
export function loadEnv(): void {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}
