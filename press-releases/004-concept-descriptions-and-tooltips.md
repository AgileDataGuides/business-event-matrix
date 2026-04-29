# Business Event Matrix Adds Concept Descriptions

**24 March 2026**

AgileDataGuides today extended hover tooltips and descriptions to concepts in the Business Event Matrix, completing the same treatment that domains received earlier today.

## The Problem

Concepts have the same definition problem as domains — "Customer" can mean a registered account, a payer, a person who's bought once, or a person who's bought in the last 30 days. Without a description, the matrix loses meaning the moment the original author moves on.

## The Solution

Concepts now have a description field. Hovering over a concept column header shows a tooltip with the concept name, description, and the concept's W's category colour band. Both domains and concepts share the same tooltip design — the only difference is the colour, which matches the entity's category (violet for domains, the W's pastel for concepts).

A single **Edit details** modal handles both domain and concept editing — the modal header dynamically reads "Domain Details" or "Concept Details" depending on what was clicked.

## How It Works

Both tooltips use the same component, parameterised by entity type. The W's category colour comes from the concept's `w` field (`who` / `what` / `where` / `when` / `why` / `how` / `how-many`) and matches the column band colour, so the tooltip visually anchors back to the matrix.

## Key Benefits

- **Consistent treatment** — same tooltip and edit experience across domains and concepts
- **Visual continuity** — tooltip border colour matches the matrix column it came from
- **Single modal** — one edit dialog handles both domain and concept details
- **Saved with the matrix** — descriptions persist alongside everything else in the JSON file

Concept descriptions are available now in the latest release.
