# Business Event Matrix Redesigns Events as Cards

**5 April 2026**

AgileDataGuides today released a visual redesign of event rows in the Business Event Matrix. Events now render as proper cards — matching the visual treatment domains and concepts already use — with the drag handle and row number sitting outside the card body.

## The Problem

Events used to render as flat rows with the drag handle and row number embedded inside the event name area. Two issues with that:
1. Visually it didn't match how domains and concepts already rendered (which used proper cards)
2. The drag handle was hard to grab without accidentally clicking into the event name and triggering inline edit

## The Solution

Each event row now uses the shared `CanvasCard` component — the same card visual that domains and concepts already use. The drag handle (⠿) sits to the left of the card body, not inside it. The row number sits even further to the left, before the drag handle, so the card body is reserved entirely for the event name and the tooltip / edit affordances.

## Key Benefits

- **Visual parity** — events, domains, and concepts all render as cards now
- **Drag handles outside the body** — easier to grab without accidentally activating inline edit
- **Cleaner scan** — the row number reads as metadata, not part of the event name
- **Same `CanvasCard` everywhere** — one component, one set of behaviours

The event card redesign is available now in the latest release.
