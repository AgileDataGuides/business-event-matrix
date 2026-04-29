# Add Event — Inline Typeahead for Existing Events

**Date:** 2026-04-19

## What's New

- **Core Business Events header** — The events column is now headed "Core Business Events" with the same affordance set as Domains and Concepts (drag handles, tooltips, edit modal).
- **Add Event typeahead** — Clicking **+ Event** opens a search-or-create input that searches existing `global_core_business_event` nodes by name. Pick a result to link the existing event to this matrix; type a new name and hit Enter to create. Same pattern Add Concept already used — Event now matches.
- **Selected global event appears in the matrix** — Fix: when an existing global event was picked from the typeahead, it could fail to render until the next reload. The new event row now appears immediately on selection.
