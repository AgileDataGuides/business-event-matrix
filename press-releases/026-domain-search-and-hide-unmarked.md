# Domain Search + Hide-Unmarked Toggle

**Date:** 2026-04-28

## What's New

Two new filter controls above the matrix make it dramatically easier to focus on a specific slice of a large matrix.

- **Domain search** — A new search input narrows the visible domain columns by name. Sits side-by-side with the existing concept search; the two filter independently and stack.
- **Concept search layout cleaned up** — The existing concept filter input now lives in the same compact row as the domain search.
- **Hide unmarked pill toggle** — A pill-style toggle switch (right of the search inputs) hides any event row, domain column, or concept column with no ✓ / ★ marks in the currently visible matrix. One click drops the empty cells from view; click again to bring them back.
- **AND-semantics cascade across active filters** — The really useful bit. With Hide unmarked on alongside an active search, the filters cascade through events first:
  - Searching for the *Customer* concept and toggling Hide unmarked drops every event that doesn't tick *Customer*.
  - Then drops every domain that none of the remaining events touches.
  - Then drops every other concept that none of those events touches.
  - The matrix stays internally consistent across all three axes — what you see is exactly the slice you searched for.
