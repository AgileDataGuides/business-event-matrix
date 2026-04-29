# Cell Mark Legend Rewrite + Shared Export Module + Four Export Buttons in CP

**Date:** 2026-04-28

## What's New

- **Cell mark legend rewrite** — The "what does ★ mean?" explainer now reads "★ indicates the Event drives the creation of that Concept's values" with an inline example: starring **Order** on *Place Order* means that event is what creates new order IDs. Replaces the previous, ambiguous "Event creates that Concept" wording — the original could be read as "the event itself produces a Concept", which isn't what's actually being expressed.
- **Four export buttons on the Context Plane canvas** — The CP-side BEM canvas now exposes the same four export options as the standalone app: Export JSON, Export PDF, Export CSV, Export Excel. Previously only JSON and PDF were available from inside the Context Plane.
- **Shared `export-bem.ts` module** — All CSV and XLSX building moved into a single module that both the SA store and the CP frontend consume. Same code, one source of truth — a future change to CSV columns or XLSX sheet structure lands once and propagates to both consumers automatically. Pure functions on a model-shaped input, so neither side has to know how the other gets to that shape (the SA reads from its store; the CP computes from the graph).
- **Instructions tab updated** — Now documents the cell legend wording, the four export buttons, the domain search, and the Hide unmarked toggle (with the AND-cascade behaviour).
