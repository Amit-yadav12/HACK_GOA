# RoleWorth data model

No remote database is required. The browser is the user-controlled store for this local-first MVP.

## Logical entities

All records have local string IDs and ISO timestamps unless noted. The TypeScript source of truth is `src/types/index.ts`; bounded runtime validation is in `src/lib/schemas.ts`.

- **OfferRecord**: `id`, `name`, `sourceKind` (`paste/pdf/demo/import`), optional `fileName`, `isDemo`, `originalText`, `sourceText`, `terms`, `priorities`, `assessment`, `questions`, `responses`, `snapshots`, `milestones`, `decisionNote`, `createdAt`, `updatedAt`. PDF binary is never included.
- **ExtractedTerm**: `id`, canonical `key`, `label`, `value`, `status`, `source`, optional exact `excerpt` (`text/start/end/page`), optional `note` and `verificationSource`, `rejected`, `updatedAt`. Empty/unknown values are not negative facts.
- **UserPriorityProfile**: target role, comma-separated skills, nullable weekly hours/minimum stipend, currency, mentorship preference, preferred work and non-negotiables.
- **RecruiterQuestion**: canonical term key, question and rationale.
- **RecruiterResponse**: date, source/context, exact text, linked term keys, partial term updates and creation timestamp. A reply is user-provided evidence, not independent verification.
- **AssessmentSnapshot**: reason, timestamp, immutable assessment and term value/status/rejection list. Snapshots are appended; editing current state does not rewrite them.
- **LearningMilestone**: title, planned activity, expected evidence, target date, status, origin (`suggested/personal`) and optional outcome.
- **OutcomeRecord**: date, work performed, feedback, skills practised, evidence reference, user-selected promise outcome and update timestamp. Completing a milestone never implies a fulfilled employer promise.

## Relationships

```text
WorkspaceState 1 ─── * OfferRecord
OfferRecord   1 ─── 12 ExtractedTerm
OfferRecord   1 ─── * RecruiterQuestion / RecruiterResponse
OfferRecord   1 ─── * AssessmentSnapshot / LearningMilestone
LearningMilestone 1 ─── 0..1 OutcomeRecord
OfferRecord   1 ─── 1 PriorityProfile + current Assessment
```

## Storage and deletion

`roleworth.workspace.v1` stores `{ version: 1, offers, activeOfferId, priorities }`. Loads reject malformed or oversized data; save/remove errors are returned to the UI. The app does not persist uploaded files, draft text before ledger creation, passwords or identity profiles. Delete-current removes one record; reset removes the workspace key after confirmation. Browser site-data clearing is outside the app’s control.

## Backup and migration

JSON exports contain the complete offer records and schema version. Imports are limited to 5MB/50 offers, validated, recalculated and assigned fresh IDs by the app. A future version should migrate explicitly and preserve old snapshots or explain any unavoidable loss. Markdown is a human-readable report, not an import format.
