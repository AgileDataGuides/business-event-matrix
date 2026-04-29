# Business Event Matrix Flags Events Missing a Driving Concept

**17 April 2026**

AgileDataGuides today released a visual warning indicator for events that are missing the all-important "driving concept" star, helping users spot incomplete event definitions at a glance.

## The Problem

Every Business Event should have exactly one Concept marked with a star (★) — the concept whose values that event creates. For example, the *Place Order* event should star the *Order* concept because that's the event that mints new order IDs. Forgetting to mark the driving concept is a common modelling mistake, and there was no way to spot it without scanning every event row by hand.

A second smaller issue: domain ticks and concept stars looked identical in the matrix grid (both used the same colour), making it harder to scan which axis was which.

## The Solution

Two paired changes:

1. **Missing-driving-concept warning** — Events with no star (★) anywhere in their concept row now show an amber **!** indicator next to their concept count in the row header. Users can scan the column of indicators down the matrix and immediately see which events still need a driving concept.
2. **Grey domain ticks** — Domain ticks now render in neutral grey while concept stars stay amber, so the two axes are visually distinct at a glance.

## How It Works

The warning indicator is purely informational — it doesn't block saving, exporting, or any other action. It's a nudge: "you might want to look at this row". Users who deliberately want an event without a driving concept can ignore it.

## Key Benefits

- **Spot incomplete events at a glance** — scan the row indicators, see what's missing
- **Visual axis distinction** — grey ticks for domains vs amber stars for concepts makes the matrix easier to read
- **Non-blocking** — the warning is a nudge, not a hard error
- **Backward compatible** — existing matrices automatically inherit the warning indicators on open

The missing-driving-concept warning is available now in the latest release.
