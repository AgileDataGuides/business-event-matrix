# Delete-from-Modal Pattern + Inline Add Domain Typeahead

**Date:** 2026-04-26

## What's New

A focused round of cleanup that unifies how items are deleted, brings Add Domain to parity with Add Event / Add Concept, and refreshes the Instructions tab.

### Deletion pattern unified

- **Per-card trash icons removed** — The little red × that appeared on hover on every card is gone. It was inconsistent with where users actually want a destructive action (in the edit flow, after they have committed to opening the row).
- **Delete button inside edit modal** — Each row's edit modal (Domain / Concept / Event) now has a destructive **Delete** button on the left of the footer, with Cancel + Save grouped on the right. Confirms before deletion. Same pattern across BEM, Glossary, Concept Model, and Dictionary.
- **BEM-specific × buttons gone** — The domain header had its own × button distinct from the per-card trash. That's removed too — Delete-from-modal is the single deletion path.
- **CP Remove now actually unlinks** — Removing a row from the matrix in the Context Plane was a no-op in some places. It now correctly unlinks the entity from the matrix without deleting the underlying global node (so concepts shared with other canvases are preserved).

### Add Domain — typeahead parity

- **Inline + Domain typeahead** — Clicking **+ Domain** now opens the same search-or-create input Add Event and Add Concept use. Searches existing `global_domain` nodes by name; pick a result to link, or type a new name and hit Enter to create.

### Documentation refresh

- **Instructions tab updated** — Re-written to cover all three example matrices (Ice Cream Shop, Lawrence Corr BEAM, SaaS Revenue Events), the typeahead add flow, the new Delete-from-modal pattern, and the four export buttons.

### Fixes

- **Matrix switcher loads renamed files** — When a saved matrix file's filename and internal `id` no longer match (e.g. after manual rename on disk), the switcher dropdown now loads it correctly instead of silently dropping it.
- **Curly braces in Instructions code escaped** — `{ nodes, links }` in the Instructions code snippet was being interpreted by Svelte as a runtime expression. Now HTML-escaped.
- **`$lib` import path fixes** — Dropped trailing `.ts` extensions on `$lib` imports that svelte-check was flagging as unresolvable.
