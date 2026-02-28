/**
 * Re-exports env config so existing imports from "config/env" keep working.
 * Actual config lives under config/env/ (load.ts, uat.ts).
 */
export { loadEnv, env, requireEnvForE2E, validateUatEnvForE2E, type UatEnv } from './env/index';
