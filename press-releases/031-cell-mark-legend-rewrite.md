# Business Event Matrix Clarifies What the Star Means

**28 April 2026**

AgileDataGuides today released a rewritten cell mark legend for the Business Event Matrix, replacing ambiguous wording about what the star (★) actually means.

## The Problem

The original cell mark legend read:

> Check (✓) to indicate a Concept is involved in an Event or star (★) to indicate that Event creates that Concept.

The phrase "Event creates that Concept" was genuinely ambiguous. Read literally, it sounded like the event somehow brings the concept into existence — which is not what's being expressed. What we actually mean is that the event is the one that **mints new values** for that concept. The *Place Order* event doesn't "create the Order concept"; it creates new Orders (i.e. new order IDs).

This was creating modelling confusion. New users would star concepts where the event "involves" them rather than where the event "produces a new instance of" them, leading to matrices where every event had three or four stars and the driving concept signal was lost.

## The Solution

The legend now reads:

> Check (✓) to indicate a Concept is involved in an Event, or star (★) to indicate that the Event drives the creation of that Concept's values — e.g. starring Order on the *Place Order* event means that event is what creates new order IDs.

Two improvements:
1. **"Drives the creation of that Concept's values"** is precise — it's about the values (instances), not the concept itself
2. **Inline example** — the *Place Order* / Order / order IDs example anchors the abstraction in something concrete

The same wording now appears in the in-app legend, the Instructions tab, and the README.

## Key Benefits

- **Less modelling drift** — users understand the star marks the value-creating event, not just any involvement
- **Concrete example** — the order IDs example makes the abstract rule click immediately
- **Consistent across surfaces** — same wording in the legend, Instructions tab, and README
- **Backward compatible** — existing matrices keep their stars; only the wording changes

The clarified legend is available now in the latest release.
