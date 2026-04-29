# Business Event Matrix Polishes Inline Editing

**24 March 2026**

AgileDataGuides today released two small but important fixes to the Business Event Matrix's inline editing — one that makes inline rename usable on long names, and one that lets users rename from inside the edit modal.

## The Problem

Two small issues had been undermining the inline edit experience:
1. Double-clicking a domain or concept name to rename it caused the input field to shrink to a single character wide, hiding the very name the user was trying to edit.
2. The "Edit details" modal had description, aliases, owner and notes fields — but no Name field. Users who'd opened the modal to fix one thing had to close it, double-click the column header, and edit the name separately.

## The Solution

The first issue is fixed: the inline edit input now sizes itself to fit the existing name with a sensible minimum width.

The second is fixed too: a Name field now sits at the top of the "Edit details" modal for domains, concepts, and events. Users can rename in either place — inline for speed, modal for context — and the two stay in sync.

## Key Benefits

- **Inline rename actually works** — the input no longer collapses to one character
- **One-stop edit** — rename, redescribe, retag, and recategorise in a single modal
- **Either flow works** — fast double-click for quick renames, modal for everything else

Both fixes are available now in the latest release.
