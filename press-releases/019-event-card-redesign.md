# Event Card Redesign

**Date:** 2026-04-05

## What's New

- **Events render as cards** — Each event row now uses the shared `CanvasCard` component (same look as Domains and Concepts). Replaces the previous flat-row treatment.
- **Drag handle outside the card** — The ⠿ drag handle sits to the left of the card body, not inside it. Easier to grab without accidentally clicking into the event header.
- **Event numbering moved outside the card** — The row index sits to the left of the drag handle, before the card. The card body itself is now reserved entirely for the event name + tooltip / edit affordances.
