# Business Event Matrix App Now Available

**24 March 2026**

AgileDataGuides today announced the release of the Business Event Matrix, a free, open-source app that helps data teams map the relationship between business events, the domains that own them, and the concepts they involve.

## The Problem

Data teams need a way to capture how the business actually works — what events happen, which domains own them, and which concepts are involved in each event. Without this map, downstream work like data modelling, glossary curation, and contract design starts from scratch every time. Existing approaches scatter the answer across whiteboards, sticky notes, and slide decks that nobody can find a week later.

## The Solution

The Business Event Matrix provides a visual grid based on Lawrence Corr's BEAM "Who does What" pattern. Events are rows. Domains and concepts are columns. Each cell records whether a concept is involved in an event — or whether the event is the one that creates the concept's values.

Concepts are grouped by W's category — Who, What, Where, When, Why, How, How Many — each with its own pastel colour band, so the matrix reads at a glance.

## How It Works

Users open the app in their browser, click **+ Event** / **+ Domain** / **+ Concept** to populate the matrix, then click intersection cells to cycle through three states: empty → ✓ (involved) → ★ (creates the concept's values) → empty. Double-click any name to rename it inline.

Multiple matrices can be created and switched between via the matrix dropdown. The app ships with a pre-built **Ice Cream Shop** example so visitors land on a populated matrix the first time they open it.

## Key Benefits

- **Visual structure** — the matrix layout makes event coverage immediately obvious
- **One canonical answer** — events, domains, and concepts live in one place, not scattered across decks
- **Multiple matrices** — model different parts of a business in separate matrices, switch between them with one click
- **Pastel design** — concepts colour-coded by W's category for fast visual scanning
- **Runs locally** — no cloud accounts, no sign-ups, your data stays on your machine

The Business Event Matrix is available now at [github.com/AgileDataGuides/business-event-matrix](https://github.com/AgileDataGuides/business-event-matrix).
