# E2E Specs — Type-first convention

Specs are organized by **test type** first, then by **feature**:

- **`smoke/`** — Critical path checks (e.g. login, tenant list). Run on every PR.
- **`regression/`** — Broader coverage; run in CI or nightly.
- **`api/`** — API-only tests (no browser).

Within each type, use **feature subfolders** (e.g. `platform-admin`, `patria`).  
**Spec file names:** descriptive, lowercase, hyphens — e.g. `admin-panel-login-and-tenant-list.spec.ts`, `patria-contract.spec.ts`.

```
e2e/specs/
  smoke/
    platform-admin/   # Platform admin UI smoke
    patria/           # Patria flow smoke
  regression/
    # Add feature folders when needed
  api/
    # Add feature folders when needed
```

**Scripts:** `npm run test:smoke` | `npm run test:admin` | `npm run test:patria`
