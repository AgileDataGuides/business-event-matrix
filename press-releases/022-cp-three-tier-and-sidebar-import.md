# Context Plane — Three-Tier Header + Sidebar Import

**Date:** 2026-04-18

## What's New

The Context Plane's BEM canvas was migrated to the same three-tier header pattern the standalone app uses, and the Import action moved to the dark sidebar.

- **Three-tier header in CP** — Tier 1 (switcher / New / Delete in the dark sidebar rail), Tier 2 (white toolbar with name + description + exports), Tier 3 (tabs). Matches Glossary and Concept Model, which were migrated at the same time.
- **Sidebar Import pattern** — Import now lives in the dark CP sidebar, not in the canvas body. The Tier 2 white toolbar no longer carries an Import button when running inside the Context Plane.
- **No more white Tier 1 strip inside the canvas area** — The Glossary, Concept Model, and BEM canvases used to render their own white Tier 1 toolbar inside the canvas body even when running embedded in the Context Plane. That duplicate strip is gone — switcher, New, Import, Delete all live in the dark CP sidebar rail, matching Data Contract / Dictionary / Metric Trees / IPC / Checklist.
