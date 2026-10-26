# RoleWorth architecture

## Choice

A static React/TypeScript/Vite SPA with Tailwind, Lucide, Zod and PDF.js is sufficient for the MVP. There is no server, account, remote database, analytics SDK or AI integration. Deterministic local rules are the product baseline, not a fallback that hides an unavailable service.

## Data flow

`OfferIntake` accepts pasted text or dynamically imports `lib/pdf.ts` only for PDF intake. `createOfferRecord` keeps the original and working text, calls `identifyCandidateTerms`, `evaluateOffer`, `buildClarificationQuestions`, `createSnapshot` and `createLearningPlan`. `App` owns the single `WorkspaceState`; feature components emit updated `OfferRecord` objects through one callback. `appendOfferToWorkspace` enforces the 50-record cap and repairs active selection if the retained set changes. Term edits and priority changes recalculate the current assessment without mutating snapshots.

A recruiter reply calls `applyRecruiterResponse`: it validates text/date/links, captures a before snapshot, adds user/recruiter provenance to linked terms, recalculates, and appends an after snapshot. `getPromiseDelta` reads the two latest snapshots. Learning milestones and outcomes update only their own collection. Comparison receives two records and never copies terms between them.

## Boundaries

- `src/types/index.ts`: canonical domain types.
- `src/lib/extraction.ts`: line/keyword candidates and exact source offsets; missing terms are unknown.
- `src/lib/assessment.ts`: transparent personal rules, questions, snapshots and reply application.
- `src/lib/offer.ts`: record construction and term review/recalculation.
- `src/lib/pdf.ts`: browser PDF.js legacy parser/worker, 8MB/40-page limits, no-text and error handling.
- `src/lib/schemas.ts`: bounded Zod schemas for persisted/imported data.
- `src/lib/storage.ts`: localStorage key, safe load/save/delete and error messages.
- `src/lib/exchange.ts`: versioned JSON and escaped Markdown.
- `src/features/`: focused UI modules; `src/components/ui.tsx`: shared primitives.

## Persistence and versioning

Only `roleworth.workspace.v1` is used. The workspace contains offers, active ID and global priorities. PDF binaries and draft intake text are not persisted. Stored JSON is validated on load; malformed/unavailable storage produces a visible session-only/error state. Reset removes the key; normal updates save after the initial load.

Exports use `{ kind: "roleworth-export", schemaVersion: 1, exportedAt, offers }`. Import bounds file size, validates with Zod, recalculates assessments and assigns new record IDs in the app to avoid collisions. A future schema needs an explicit migration rather than silently accepting a different shape.

## PDF and security boundaries

PDF.js runs locally with an emitted legacy worker asset. No OCR is claimed. React renders all document/user content as text; no `dangerouslySetInnerHTML` or remote document service exists. There are no frontend secrets or environment variables. The Vite development host allowlist includes the sandbox preview domain only; production is static output.

## Testing and deployment

Vitest covers domain rules, real minimal text/no-text PDF fixtures, malformed imports, storage failures and React workflow integration. Playwright covers the Chromium core journey, actual PDF worker, keyboard dialog behavior, mobile/comparison overflow and unexpected external requests. ESLint, strict TypeScript, Vite production build and a manifest-based lazy-PDF bundle assertion are separate checks. Netlify is the documented static target through `netlify.toml`; a public URL is not assumed until manually verified.

Known trade-offs: phrase-based extraction can miss arbitrary layouts/wording, localStorage is browser-bound and not encrypted, and Chromium automation is not a cross-browser or formal accessibility certification.
