/**
 * Env config entry point.
 * For now only UAT is used. Later: add staging.ts etc. and choose by APP_ENV.
 */
export { loadEnv } from './load';
export { env, requireEnvForE2E, validateUatEnvForE2E, type UatEnv } from './uat';
