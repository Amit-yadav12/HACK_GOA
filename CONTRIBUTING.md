# Contributing to RoleWorth

## Before editing

Read `docs/AGENTS.md` and the relevant product documents. Inspect the current implementation and tests first. Keep one canonical implementation of each rule and component; do not add parallel “final” or “new” versions.

## Development loop

```bash
npm ci
npm run dev
# in another terminal
npm run lint
npm run type-check
npm run test
npx playwright install --with-deps chromium # first browser-test setup
npm run test:e2e
npm run build
npm run test:bundle
npm audit
```

Add focused tests for extraction, provenance, unknown handling, persistence or assessment changes. Do not weaken validation or delete a failing test to make a change appear complete.

## Trust and privacy review

A change must not invent offer terms, quotations, recruiter replies or verification outcomes. Keep source text separate from user corrections and interpretations. Do not add analytics, external document processing, secrets, accounts or a remote database without an explicit product decision and documentation update.

Uploaded PDF binaries stay out of persistence. Imported content is untrusted until Zod validation succeeds. Render user content as text, not HTML.

## UI changes

Use the existing tokens and shared components. Preserve keyboard access, visible focus, responsive layouts, reduced-motion support and honest empty/error states. Every active control needs a real state change; unfinished controls should be removed or clearly disabled with a reason.

## Reporting

Include the exact commands you ran, failures and remaining manual checks. Do not claim a public URL, browser test, PDF result or integration works unless you verified it. No license is currently granted by this repository.
