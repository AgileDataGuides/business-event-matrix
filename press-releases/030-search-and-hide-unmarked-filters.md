# Business Event Matrix Adds Search and Hide-Unmarked Filters

**28 April 2026**

AgileDataGuides today released two paired filter controls for the Business Event Matrix — independent search inputs for domains and concepts, and a one-click toggle that hides every empty row and column. Together they make a sprawling matrix dramatically easier to focus.

## The Problem

A Business Event Matrix grows fast. The SaaS Revenue Events example matrix alone has 30+ events, 5+ domains, and 25+ concepts spread across seven W's categories — that's a lot of cells to scan even when you're looking for a specific intersection. The matrix had a single concept search filter, but no way to filter domains and no way to drop empty rows / columns from view.

## The Solution

Two new filter controls live above the matrix:

1. **Domain search** — Independent search input that narrows visible domain columns by name. Pairs with the existing concept search; the two filter independently and stack.
2. **Hide unmarked toggle** — A pill-style toggle switch (right of the search inputs). One click drops every event row, domain column, and concept column with no ✓ / ★ marks in the currently visible matrix. Click again to bring them back.

The really useful bit is how the two combine: with **Hide unmarked** on alongside an active search, the filters cascade through events first using AND-semantics:

- Search for the *Customer* concept and toggle Hide unmarked
- Drops every event that doesn't tick *Customer*
- Then drops every domain that none of the remaining events touches
- Then drops every other concept that none of those events touches

The matrix stays internally consistent across all three axes — what you see is exactly the slice you searched for, with nothing irrelevant in the way.

## Key Benefits

- **Zoom into a slice** — search for one concept + Hide unmarked = the matrix collapses to just the rows / columns that actually involve it
- **Pill toggle** — visual cue that a filter is active, no need to remember whether you've hidden things
- **AND-semantics across axes** — filters are coherent; the visible matrix is a proper subset, not a union of unrelated rows and columns
- **Independent searches** — filter on domain, concept, or both; they don't conflict
- **Available in both modes** — works in the standalone app and the embedded Context Plane version

Search and Hide unmarked are available now in the latest release.
