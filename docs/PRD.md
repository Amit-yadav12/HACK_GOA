# RoleWorth 2.0 — Product requirements

## Problem and users

Students often receive internship offers with incomplete compensation, time, mentorship or exit language. Comparing that language with personal constraints is difficult, and a missing clause can be mistaken for a promise. RoleWorth serves a student who wants to make an explainable decision without uploading a private document or creating an account.

### Jobs to be done

- Understand what an offer actually says and inspect the source.
- Identify missing information that materially affects a personal decision.
- Ask a recruiter precise questions and retain the reply as new evidence.
- Compare opportunities without filling gaps with guesses.
- Turn personal learning intentions into dated evidence of what happened.

## Scope and acceptance criteria

| Journey | Implemented acceptance criteria |
| --- | --- |
| Offer intake | Paste text or select a local PDF; validate empty/short/unsupported/oversized/corrupt input; edit extracted text; build a ledger without sign-in. |
| Evidence review | Extract 12 canonical term categories; show exact excerpts where available; support five provenance statuses; edit, reject and restore terms; preserve original text. |
| Personal decision | Edit role, skills, preferred work, hours, stipend, mentorship and boundaries; deterministic rules show supported priorities, conflicts and unknowns; unknowns are not negative facts or fraud scores. |
| Clarification | Generate editable/copyable questions from unresolved terms; capture dated reply text/context; require explicit term links and values; never auto-verify a reply. |
| Promise Delta | Preserve initial and reply before/after snapshots; show changed values/statuses, assessment counts and unresolved terms; retain snapshot history. |
| Learn and verify | Create suggested or personal milestones with target dates and expected evidence; edit/status/delete them; record dated outcomes and user-selected promise status separately. |
| Compare | Select two distinct saved offers; compare only recorded values; display unknowns and use a consistent priority lens without mixing records. |
| Exchange and control | Export Markdown/JSON; validate schema-versioned imports; recalculate imported assessments; persist locally; delete current offer or reset all data; label synthetic demos. |

## Non-functional requirements

Local-first static SPA; no mandatory service or key; responsive mobile/tablet/desktop layouts; semantic controls, labels, focus indicators and reduced motion; strict TypeScript and validated external data; no raw PDF persistence; no document content in analytics or logs.

## Out of scope

OCR, external employer verification, fraud/legal determinations, universal trust or salary scores, marketplace/social features, accounts/team workspaces, payments, autonomous recruiter contact, remote database and AI dependency. Markdown and JSON are the supported report formats; PDF report export is deferred.

## Failure states

The UI provides manual-paste routes for scanned/corrupt PDFs, actionable file limits, short-text validation, import validation errors, storage-unavailable/quota messaging, empty comparison and empty milestone states, and disabled export when no record exists. Complex PDF layout and deterministic phrase coverage remain documented limitations.

## Risks and mitigations

- **Misleading assessment:** inspectable rules, no universal score, explicit limitations.
- **False assurance:** provenance labels and source excerpts; replies are user-provided, not independent verification.
- **Privacy leakage:** local PDF.js/rules, no external calls, user-controlled storage/export/reset.
- **Bad extraction:** editable text and terms, rejection, unknown fallback, PDF fixtures in tests.
- **Scope creep:** static MVP and out-of-scope list are canonical.
