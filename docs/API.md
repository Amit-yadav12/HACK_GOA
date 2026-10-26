# RoleWorth internal service contracts

There are no network API endpoints in this release. These are local TypeScript contracts; their side effects are limited to returned values except the storage/download helpers.

| Contract | Input → output | Failure / test expectation |
| --- | --- | --- |
| `extractPdfText(file)` | Browser `File` → `{ text, pageCount }` | Rejects unsupported, empty, >8MB, encrypted, >40-page, corrupt and no-text inputs with actionable `PdfExtractionError`; real text/no-text fixtures are tested. |
| `identifyCandidateTerms(text)` | Text → 12 `ExtractedTerm`s | Returns exact excerpts/offsets where found and unknown terms otherwise; tests check demo and unspecified values. |
| `reviewTerm(record, termId, input)` | Record + value/status/source → recalculated record | Requires a source for `verified`; keeps original text; tests cover provenance and rejection. |
| `evaluateOffer(terms, priorities)` | Terms + profile → `Assessment` | Deterministic supported/conflict/unknown lists; no employer verdict or universal score; tests cover hours, currency-aware stipends, preferred work, training boundaries and contextual fee language. |
| `buildClarificationQuestions(terms, priorities)` | Current evidence → prioritised questions | Uses unresolved terms and transparent rationale; does not contact anyone. |
| `buildRecruiterMessage(record)` | Record → editable string | Local template only; no network side effect. |
| `applyRecruiterResponse(record, input)` | Dated text/context + partial updates → record with response and two appended snapshots | Requires text, date and at least one non-empty linked value; source becomes recruiter/user, never verified; history is tested. |
| `getPromiseDelta(record)` | Record → before/after changes or null | Compares latest snapshots without mutation; unresolved terms remain visible. |
| `createLearningPlan(record)` | Record → three suggested personal milestones | Deterministic starting points, explicitly not employer commitments. |
| `compareOffers(a, b)` | Two different records → term rows | Rejects same ID; missing values remain unknown and records are not mixed. |
| `createExportBundle(offers)` / `exportMarkdown(record)` | Record(s) → versioned JSON object / escaped Markdown string | Throws with no offers; report disclaims verification and separates personal goals. |
| `parseImportBundle(raw)` | JSON string → validated/recalculated records | Rejects malformed, oversized or wrong-schema input; partial reply updates and snapshots round-trip. |
| `loadWorkspace` / `saveWorkspace` / `deleteSavedWorkspace` | Browser storage ↔ validated workspace | Returns user-facing errors for malformed data, quota and permission failures; no silent success. |

No optional AI endpoint is defined because no provider integration is implemented. Adding one would require a separate product decision, server-side secrets, explicit disclosure/action before text transfer, schema-validated output and a deterministic offline path.
