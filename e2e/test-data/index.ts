/**
 * Non-secret test data for E2E scenarios.
 * Credentials (admin, API keys) come from config/env (i.e. .env), not from here.
 */
import * as path from 'path';
import * as fs from 'fs';

const loadJson = <T>(filename: string): T => {
  const filePath = path.resolve(__dirname, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`e2e/test-data: failed to load ${filename} from ${filePath}: ${msg}`);
  }
};

export const applicationTestData = loadJson<{
  phoneNumbers: { primary: string; alt1: string; alt2: string };
  testPassword: string;
}>('application.json');

/** Central list of UAT paths (admin + per-tenant). Use in specs instead of hardcoding. */
export const paths = loadJson<{
  admin: { login: string; manageTenants: string };
  tenants: Record<string, { admin?: string; application?: string; apiPath?: string }>;
}>('paths.json');

/** Add more as you add JSON files:
 * export const cardDetails = loadJson<CardDetails>('cardDetails.json');
 * export const kbaData = loadJson<KbaData>('kba.json');
 */
