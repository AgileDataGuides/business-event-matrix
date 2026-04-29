# Business Event Matrix Adds Typeahead Search When Adding Events

**19 April 2026**

AgileDataGuides today released typeahead search for the **+ Event** button, giving users a way to link existing events from other matrices instead of accidentally creating duplicates.

## The Problem

Every Business Event Matrix in the Context Plane was its own island. Adding the *Customer Places Order* event to a Sales matrix had no awareness that the same event already existed on the Operations matrix, the Marketing matrix, or anywhere else. Users inevitably ended up with three subtly different versions of the same event scattered across matrices, with the inevitable definition drift.

## The Solution

Clicking **+ Event** now opens an inline search-or-create input. Start typing and a typeahead dropdown searches every existing `global_core_business_event` node by name. Pick a result to link the existing event into the current matrix. Type a new name and hit Enter to create a fresh event.

The same UX already existed for **+ Concept**; this release brings **+ Event** to parity. (And **+ Domain** follows in a later release.)

## How It Works

The typeahead matches on case-insensitive substring. Matches show their existing description and the matrix they originally appeared on, so users can confirm they're picking the right event before linking.

When a user picks an existing event, the matrix gets a *link* to that event node — not a copy. Editing the event's description on any matrix updates it everywhere. Removing the event from the current matrix only removes the link; the event itself stays available to other matrices.

This release also fixes a small bug where a newly-linked event sometimes failed to appear in the matrix until the next reload — the new event row now renders immediately on selection.

## Key Benefits

- **Reuse beats invent** — link existing events instead of creating accidental duplicates
- **Definition stays in sync** — editing the event in one matrix updates it everywhere
- **Search-as-you-type** — fast picker with substring matching
- **Bug fix** — newly linked events appear immediately, no reload required
- **Same pattern as Concept** — consistent typeahead UX across both add flows

The Add Event typeahead is available now in the latest release.
