# Env config (per environment)

- **load.ts** – Shared: `loadEnv()`. No env-specific URLs. UAT only.
- **uat.ts** – UAT only: URLs, paths, credentials, `requireEnvForE2E()`. Used for all runs for now.
- **index.ts** – Re-exports the active env (currently UAT). Later you can add `staging.ts` and switch by `APP_ENV`.

Root `config/env.ts` re-exports from here so imports like `from '../../config/env'` keep working.
