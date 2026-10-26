# RoleWorth design system

## Principles

Evidence before opinion; uncertainty in plain language; student-controlled decisions; calm editorial confidence; minimal friction. The interface should make a next question easier to find, not make an employer look automatically safe or dangerous.

## Tokens

- **Ivory `#f7f6f1`**: application background.
- **Paper `#fffefa`**: reading and form surfaces.
- **Navy `#173247`**: primary type, dark action and navigation emphasis.
- **Ink/muted `#2c3e4b` / `#5f6f79`**: secondary reading and metadata.
- **Line `#e5e5de`**: quiet dividers and borders.
- **Teal `#116c69` / soft `#e7f2ef`**: explicit supported evidence and confirmed user actions; never a universal safety signal.
- **Amber `#8d5b1c` / soft `#fbf1df`**: unknowns, inference and questions.
- **Red `#963e3a` / soft `#faece9`**: serious conflicts, destructive actions and errors only.

Use Georgia/display serif for reflective headings and system sans for controls and dense reading. Body text is generally 14–17px with 1.5+ line height. Spacing follows 4px increments; reading width is capped around 1220px. Cards use 16px radii, 1px line borders and restrained paper shadows. Motion is a short enter/toast transition only and is disabled under `prefers-reduced-motion`.

## Hierarchy

Term label → current value → provenance badge → source excerpt → personal impact/next question. A source quote is visually distinct from an interpretation or user correction. Decision readouts show supported, conflict and unknown counts derived from the current assessment; they are not charts or empirical scores.

## Screens and states

Intake leads with what to provide and what the user receives. The workspace shell exposes Offer & evidence, Clarify, Decide, Learn and Verify, with Promise Delta as history. Comparison uses a two-column table with explicit unknown cells. Data controls combine export/import and destructive actions with clear confirmation.

Every feature has initial, populated and relevant empty/error states: PDF processing/no text/corrupt file, short input, no terms matching a filter, no saved second offer, no milestones, storage unavailable, import invalid, export unavailable and no snapshots yet.

## Responsive and accessible behavior

Desktop uses a 238px workspace rail and flexible reading column; smaller screens collapse navigation into a labelled menu and stack reading panels. Tables horizontally scroll rather than forcing unreadable cells. Forms have associated labels, buttons have accessible names, dialogs have `role="dialog"`, Escape handling, focus return and a basic focus trap. Status is conveyed by text as well as color. `:focus-visible` is prominent and reduced-motion CSS is mandatory.

## Anti-patterns

No AI-gradient hero, glassmorphism stack, fake analytics, unsupported risk meter, invented employer facts, tiny evidence text, decorative controls or hidden source quotes. Synthetic content always carries a visible synthetic label.
