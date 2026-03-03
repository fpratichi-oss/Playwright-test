/**
 * Runs once before all tests. Loads env from disk (local) or process (CI),
 * then validates that required variables are present for the current run.
 * In CI: requires BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, UI_AUTOMATION_KEY so both admin and Patria run (no skipping).
 */
import { loadEnv } from './env/load';
import { validateUatEnvForE2E } from './env/uat';

export default function globalSetup(): void {
  loadEnv();
  validateUatEnvForE2E();
}
