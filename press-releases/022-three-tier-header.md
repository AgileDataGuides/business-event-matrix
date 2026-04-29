# Business Event Matrix Adopts the AgileDataGuides Three-Tier Header

**7 April 2026**

AgileDataGuides today released a redesigned header for the Business Event Matrix, adopting the standardised three-tier header pattern used across every app in the AgileDataGuides Pattern Template family.

## The Problem

The original header crammed everything into a single white toolbar — switcher, name, description, exports, import, delete — and the BEM didn't match the layout of the Information Product Canvas or the other Pattern Template apps. Users hopping between apps had to relearn where to find each control.

## The Solution

The Business Event Matrix now uses the AgileDataGuides three-tier pattern:

- **Tier 1 — Dark App Header** — A dark slate strip at the top hosts the matrix switcher dropdown, **New Matrix**, **Import**, and **Delete** buttons. The slate background marks it visually as "global" controls — actions that affect which matrix you're working on.
- **Tier 2 — White Toolbar** — A clean white card carrying the matrix name (click-to-edit), description (click-to-edit), and the export buttons (JSON, PDF, CSV, Excel). This tier is about the *current* matrix.
- **Tier 3 — Tabs** — A tab strip below the toolbar (Matrix is currently the only tab; Instructions is added in a follow-up release).

## Key Benefits

- **Visual parity across apps** — the same header pattern in IPC, BEM, Glossary, Concept Model, Dictionary, and the Checklist
- **Information hierarchy** — global controls in dark header, current-matrix controls in white toolbar, view switching in tabs
- **Click-to-edit name and description** — single click on either turns it into an input, no double-click or modal needed
- **Same in both modes** — the standalone app and the embedded Context Plane version share the same header

The three-tier header is available now in the latest release.
