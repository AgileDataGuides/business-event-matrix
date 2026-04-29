# Business Event Matrix Moves Delete Into the Edit Modal

**26 April 2026**

AgileDataGuides today released a unified deletion pattern across the Business Event Matrix. The little red trash icon that appeared on hover over every card is gone; deletion now lives inside the opened edit modal, behind a confirm step.

## The Problem

The original delete affordance was a tiny red trash icon that appeared on each card on hover (`opacity-0 group-hover:opacity-100`). Two issues:

1. **Wrong moment for a destructive action** — the user is hovering, not committing to anything. A single mis-click was enough to delete a domain or concept.
2. **Inconsistent across canvases** — different SA apps had different delete affordances (some hover-trash, some inline ×, some both), making the pattern unpredictable.

The BEM also had its own × buttons on domain headers that were separate from the per-card trash, doubling the inconsistency. And the Context Plane's "Remove" action was a no-op in some places, silently doing nothing when users expected the entity to be unlinked from the matrix.

## The Solution

Three matched changes:

1. **Per-card trash icon removed** — the hover trash is gone from every SA card across BEM, Glossary, Concept Model, and Dictionary.
2. **Delete button inside edit modal** — each row's edit modal (Domain / Concept / Event) gets a destructive red **Delete** button on the *left* of the footer, with **Cancel** and **Save** grouped on the right. Clicking Delete asks for confirmation before deleting.
3. **CP "Remove" actually unlinks** — the Context Plane's Remove action now correctly removes the entity from the matrix without deleting the underlying global node (so concepts shared with other canvases are preserved).

## How It Works

The Delete button uses the documented danger button styling — `bg-white text-red-600 border border-red-300 hover:bg-red-50` — and lives in `flex justify-between items-center` footer with Cancel + Save grouped on the right. This positions the destructive action visually far from the confirm action, following the standard "destructive far from confirm" UX convention.

## Key Benefits

- **No more accidental deletions** — destructive actions live behind a deliberate open-modal-then-confirm sequence
- **Consistent across canvases** — same pattern in BEM, Glossary, Concept Model, and Dictionary
- **CP Remove is reliable** — no more silent no-op when users expect an unlink
- **Visual safety** — the red Delete button is placed far from Save / Cancel to discourage muscle-memory clicks

The unified delete pattern is available now in the latest release.
