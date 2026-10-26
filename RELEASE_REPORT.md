# RoleWorth 2.0 — release report

**Final audit date:** 26 October 2026
**Release verdict:** **READY WITH WARNINGS** — the local release candidate passes the final automated gate and the exercised Chromium journeys. Public deployment, broader browser/assistive-technology validation, a larger PDF corpus, dependency-maintenance follow-up and an open-source license decision remain outstanding.

**Final revalidation:** The clean install, static/unit/build gate, development and production Playwright suites, real-Chromium demos and failure states, responsive/reduced-motion checks, source/privacy review and Git candidate checks were rerun on 26 October 2026. No application-source change was required in this final pass.

This report describes the tree and checks actually present in this workspace. It does not claim a hosted URL, external integrations, employer verification, formal accessibility conformance, an event submission or a bug-free product.

## What shipped

RoleWorth is a local-first internship promise-to-proof ledger. The approved lean React/TypeScript/Vite/Tailwind/Zod/PDF.js architecture is preserved; there is no backend, account, database, API key or external AI service.

The implemented workflow is **Offer → Clarify → Decide → Learn → Verify**, with comparison, Promise Delta history and local export/control surfaces:

- Paste-text and browser-side PDF intake, with editable extraction and actionable unsupported, empty, oversized, corrupt and no-text errors.
- Source-linked evidence ledger with exact excerpts, editable interpretations, provenance labels, unknowns, rejected extraction terms and independent-source attribution.
- Personal priorities with transparent recalculation: role, skills, preferred work, hours, stipend/currency, mentorship and non-negotiables.
- Recruiter question drafting and user-entered replies. A reply is not presented as received until the user records it, and it never becomes independent verification automatically.
- Immutable Promise Delta snapshots when a recruiter reply changes the recorded promise.
- Personal learning milestones and dated outcome notes, kept separate from employer promises and evidence.
- Two-offer comparison with an explicit empty state, unknown-preserving cells and no invented winner.
- Versioned, schema-validated JSON export/import and escaped Markdown export; imported derived assessments are recalculated rather than trusted blindly.
- Browser localStorage persistence, explicit reset/delete controls and clearly labelled synthetic demo workspaces.
- Responsive editorial UI with keyboard-operable dialogs, focus management, visible focus styles, reduced-motion support and safe text rendering.

### Intentional boundaries

There is no OCR, employer scraping, automated verification, fraud probability, universal trust score, salary prediction, payment flow or autonomous recruiter contact. Unknown means not established; it is not a negative finding or evidence of wrongdoing. The app does not make an employer-legitimacy verdict. Reports are Markdown and JSON, not PDF reports.

## Audit fixes completed

### Evidence, assessment and data integrity

- Added conservative currency handling: a currency-less or incompatible monetary value does not become a confident stipend comparison; explicit INR/USD/EUR/GBP examples are covered.
- Added preferred-work and training-boundary assessment rules and corresponding clarification questions. Preferred work is now visible in the decision lens and included in Markdown exports.
- Corrected fee-language classification to distinguish explicit no-fee language (including “No upfront fees”, “No registration charges” and standalone “None”) from charges, reimbursement/refund/conditional wording and ambiguous phrases such as “No fee information provided”. The latter remain unknown, not assurance or a false conflict. Explicit-cost, no-fee and ambiguous branches have regression coverage.
- Preserved source text while separating corrections, interpretations, recruiter-provided values and independent-source claims. Rejected terms are excluded rather than silently treated as facts.
- Added real calendar-date validation, bounded user-entered fields, canonical-import uniqueness checks and safe handling of malformed/versioned imports.
- Made workspace append capacity-aware: if a background addition reaches the 50-offer cap, the active ID is repaired to a retained record instead of pointing at an evicted offer.
- Added regression coverage for duplicate offer IDs in persisted/imported data and for long extracted fields. Derived display names are bounded without truncating source evidence; oversized extracted terms are rejected before they can make a saved workspace invalid.

### UI, accessibility and responsive behavior

- Fixed tablet navigation reachability, mobile header overflow, mobile data-control dialog reachability, modal scrolling, busy-state behavior and lazy-PDF interaction races.
- Added accessible tab keyboard navigation, dialog Escape/focus-return behavior, navigation labelling and comparison table semantics.
- Fixed comparison-card intrinsic-width overflow at narrow and tablet widths with shrink/wrap constraints; the term table retains its intentional local horizontal scroller.
- Darkened muted/status tokens and replaced residual low-contrast text/separator usage. Navigation step numbers now retain a readable navy color on hover.
- Added long-text wrapping safeguards for user-generated values, excerpts, milestones and outcomes without changing the editorial visual system.

### Performance and release engineering

- Kept PDF.js out of the initial static module graph through dynamic intake loading. Added `scripts/check-bundle.mjs` and a CI assertion against the production manifest.
- Added reproducible Playwright browser coverage for the core journey, actual PDF extraction, mobile/tablet navigation, keyboard tabs, dialog focus return, comparison overflow, JSON restore and unexpected external requests/page/console errors.
- Added the dependency audit to CI and refreshed README, contributing, architecture, PRD, design and service documentation.
- Recaptured `docs/screenshots/intake.png` and `docs/screenshots/decision.png` from the actual local production preview using labelled synthetic data. They are not deployment screenshots or empirical product metrics.

## Exact final verification results

The following results are from the final revalidation and the cumulative UI audit. The targeted contrast measurements are explicitly identified as earlier spot checks, not a sitewide certification:

| Command or check | Result |
| --- | --- |
| `npm ci` | Passed; **346 packages added, 347 audited, 0 vulnerabilities**. npm emitted deprecation warnings for `whatwg-encoding@3.1.1` and `eslint@9.39.5`. |
| `npm run lint` | Passed; ESLint completed with no errors. |
| `npm run type-check` | Passed; strict `tsc --noEmit`. |
| `npm run test` | Passed; **7 Vitest files, 41/41 tests**. |
| `npx playwright install --with-deps chromium` | Passed in the fresh sandbox before browser execution; installed the pinned Chromium 141.0.7390.37 browser and required system dependencies. |
| `npm run test:e2e` | Passed on rerun; **5/5 Playwright Chromium tests** against the development server. |
| `npm run build` | Passed; TypeScript build and Vite production bundle completed. |
| `npm run test:bundle` | Passed; `src/lib/pdf.ts` is lazy-loaded in `assets/pdf-Fn0m44lS.js`, outside the initial static graph; initial static modules: **1**. |
| `npm audit --audit-level=high` | Passed; **0 vulnerabilities**. |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:e2e` | Passed; **5/5 tests** against the built production preview, including the emitted PDF worker. |
| Real-Chromium demo rehearsal | Passed independently at **1440×900** and **390×844**: synthetic load, source evidence, priority update, generated questions, synthetic reply, Promise Delta, learning/outcome, comparison, Markdown + JSON export, confirmed reset and reload. **0 page errors, 0 console errors and 0 unexpected external requests**. |
| Browser failure-state rehearsal | Passed for empty/short input, unsupported files, corrupt PDFs and malformed JSON imports; actionable errors were shown, editable offer text remained empty after PDF failures, and invalid imports did not replace the initial state. |
| Production surface audit | Passed **63 viewport/surface combinations**: decision, evidence, clarify, learn, verify, Promise Delta and comparison at **320, 360, 390, 600, 768, 800, 1024, 1280 and 1440px**. No document overflow or unnamed visible buttons were found; reduced-motion animation duration computed to `0.01ms`. |
| Computed-style contrast spot audit | Earlier targeted production checks returned no failing direct-text nodes on the decision surface; hovered navigation step numbers measured **11.28–11.91:1**. These were spot checks, not a comprehensive or sitewide WCAG certification. |
| Source/privacy inspection | No private-key/token patterns, unsafe HTML sinks or application fetch/XHR/beacon/WebSocket/EventSource calls were found in the source scan; the browser journey also observed no unexpected external requests. |
| Repository candidate inspection | Incomplete Git metadata was repaired without creating a commit. Git is on `main` with no commits or remote. `uploads/`, dependency/browser caches, `dist/`, test output, tsbuildinfo and local environment/credential paths are ignored; no private playbook attachment is a candidate source file. |
| Candidate whitespace check | `git diff --check` over intent-to-add candidate files passed; the index was reset afterwards and no commit was created. |

The final production bundle reported an entry chunk of **462.73 kB**, a lazy PDF chunk of **379.11 kB**, and a separate PDF worker of **1,417.59 kB** (uncompressed Vite-reported sizes). These are build observations, not performance targets or user metrics.

Vite emitted non-fatal Rollup annotation warnings from third-party Zod comments. PDF unit tests emitted PDF.js diagnostic warnings while exercising corrupt/fixture inputs. The commands passed; those warnings are not being presented as a clean-console or universal PDF-compatibility claim.

### Browser coverage actually exercised

The Chromium journey covers synthetic intake, actual PDF.js text extraction and editable text, source evidence, priority changes, recruiter reply entry, Promise Delta visibility, learning/outcome updates, comparison, Markdown download, JSON export/reset/import, local persistence after reload, mobile navigation and the absence of unexpected external requests, page errors and console errors in that journey. Additional tests cover Escape/focus return, keyboard tab selection, tablet/mobile reachability and comparison widths.

## Remaining risks and checks not run

These are explicit follow-ups, not hidden passes:

1. **Deployment is not done.** No public Netlify/site URL has been deployed or verified. Push the repository, import it into Netlify using `netlify.toml`, deploy, and manually open the HTTPS URL. Verify intake, a real text PDF, worker loading, refresh persistence, export/import and mobile layout there.
2. **Browser coverage is Chromium-only.** Firefox, WebKit/Safari, real iOS/Android devices and assistive-technology screen readers were not tested.
3. **Accessibility is not formally certified.** Keyboard/dialog/responsive checks and targeted computed-style scans passed, but a full WCAG audit, screen-reader pass and comprehensive manual contrast review remain required before making a conformance claim.
4. **PDF variability remains.** Automated fixtures cover unsupported, empty, oversized, corrupt, valid text and no-text inputs. Password-protected files, over-40-page files, complex multi-column layouts, unusual fonts and cancellation during a large parse still need manual fixtures and review. OCR is intentionally unavailable.
5. **Local privacy has device limits.** Offer text is processed locally and is not sent to an application endpoint in the exercised journey, but localStorage is not encrypted. Anyone with access to the browser profile or an exported file may read it; reset/delete on shared devices and protect exports.
6. **Assessment limits are human limits.** Extraction and deterministic assessments can miss context. Recruiter replies, independent sources, interpretations and outcomes must be reviewed by the user; the app cannot establish truth or employer legitimacy.
7. **Dependency maintenance warning.** The locked tree has no reported npm vulnerabilities, but clean installation reports deprecated `eslint@9.39.5` and `whatwg-encoding@3.1.1`. Plan a separately tested supported-tooling upgrade rather than hiding the warning or forcing an unverified major framework upgrade.
8. **GitHub publication and licensing are manual.** There is no commit, remote, push or public repository from this run. Review the candidate files, choose and add an appropriate license with the project owner, then commit and push deliberately. No license is currently granted by this repository.
9. **Event submission is not complete, if applicable.** No hackathon submission, public demo recording or authentic build-process recording was performed. Do not describe deterministic services or synthetic demo content as AI, verified evidence or a submitted event entry.

## Release recommendation

Use this build for local evaluation and as a deployment candidate. Do not label it publicly released, formally accessible, externally verified, universally PDF-compatible or event-submitted until the corresponding manual steps above are completed and their results are recorded.
