# Test data (non-secret only)

**Do not put credentials or secrets here.** Passwords, API keys, and real PII go in **`.env`** (see project README).

Use this folder for **non-secret** test data that many scenarios need:

- Test phone numbers (masked or test-only)
- Sample search terms, product IDs, tenant IDs (if safe to commit)
- KBA answers, card last-4, or other **fake** test values
- Links, settings, or payloads that are environment-agnostic

**How to use:**

- In specs or pages: `import { applicationTestData } from '../test-data';` (adjust path by spec location)
- Credentials: `import { env } from '@config/env';` then `env.ADMIN_EMAIL`, `env.ADMIN_PASSWORD`, etc.

Add more JSON files (e.g. `cardDetails.json`, `kba.json`) and re-export from `index.ts` if you want typed access.
