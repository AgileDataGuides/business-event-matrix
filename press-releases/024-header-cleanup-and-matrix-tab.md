# Header Cleanup + CP Tab Rename to "Matrix"

**Date:** 2026-04-24

## What's New

- **Import moved from Tier 2 to App Header** — Import was previously a teal button on the Tier 2 toolbar (next to the export buttons). It now lives in the dark App Header alongside New and Delete. Same pattern across every SA app.
- **Eliminated double headers** — A subtle bug where the SA app's dark App Header and the canvas's own header could both render at once when re-mounting is fixed. Only one header strip ever shows, regardless of mount order.
- **CP BEM canvas tab renamed to "Matrix"** — The Tier 3 tab inside the Context Plane's BEM canvas was labelled "Canvas". It's now "Matrix" — consistent with the SA app and with what users actually call the artefact.
