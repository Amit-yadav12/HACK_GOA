# RoleWorth coding rules

1. Inspect the current files, docs, scripts and tests before editing. Reuse the canonical modules; never create `AppNew`, duplicate assessment engines or competing documentation.
2. Preserve the loop **Offer → Clarify → Decide → Learn → Verify** and the local-first scope. Do not silently add login, backend, analytics, payments, marketplace, scraping or external AI.
3. Keep TypeScript strict and domain types in `src/types/index.ts`. Validate imported/persisted data with the existing Zod schemas. Do not bypass validation with unchecked casts as a feature strategy.
4. Every extracted fact needs provenance where available. Keep original text, user corrections, recruiter replies, inference and independent-source claims distinct. Missing text is unknown, never proof of wrongdoing.
5. Never invent quotes, terms, replies, verification results, testimonials, metrics or user outcomes. Synthetic fixtures must be visibly labelled and must not contain private documents.
6. Do not add a fraud probability, universal trust score or employer legitimacy verdict. Keep assessment rules inspectable and priority-based.
7. PDFs are browser-local and their binaries are not persisted. No document text may leave the device without a separately approved, disclosed and explicit action. Never commit secrets or expose provider keys in frontend code.
8. Use existing design tokens/components. Maintain semantic labels, keyboard access, focus, responsive layouts, reduced motion, loading/empty/error states and honest disabled controls.
9. Make small root-cause fixes. Add regression tests for meaningful bugs. Never delete tests, weaken expected behavior or hide errors to get a green check.
10. Run the relevant `lint`, `type-check`, `test`, `test:e2e`, `build`, `test:bundle` and dependency-audit commands. Report exact results and unrun manual/browser/deployment checks. Do not claim a feature, test or public deployment without evidence.
11. Keep `README.md`, the relevant `docs/` source and `RELEASE_REPORT.md` accurate when behavior changes. Use small, reviewable commits with no unrelated rewrites or private fixtures.
