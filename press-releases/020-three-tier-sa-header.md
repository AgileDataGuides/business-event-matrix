# Three-Tier SA Header

**Date:** 2026-04-07

## What's New

The standalone Business Event Matrix now uses the standardised three-tier header pattern that every SA app shares.

- **Tier 1 — Dark App Header** — The dark slate strip at the top hosts the matrix switcher dropdown, **New Matrix**, **Import**, and **Delete** buttons. Same look and ordering as the Glossary, Concept Model, Dictionary, and IPC apps.
- **Tier 2 — White Toolbar** — A clean white card carrying the matrix name, description (click-to-edit), and the export buttons (JSON, PDF, CSV, Excel).
- **Tier 3 — Tabs** — Tab strip below the toolbar (Matrix is currently the only tab, with Instructions added in a follow-up).
- **Compatibility** — Start scripts switched from `pnpm` to `npm` so the published standalone repo runs without requiring pnpm to be installed globally.
