# Business Event Matrix Now Shares Concepts Across Canvases

**27 March 2026**

AgileDataGuides today released cross-canvas concept sharing for the Business Event Matrix when running inside the Context Plane app. Concepts created in the BEM are now automatically visible in the Concept Model, Glossary, Dictionary, and Context Canvas — and vice versa. One concept, one definition, one place to update.

## The Problem

Inside the Context Plane, multiple canvases work with the same business concepts: the Business Event Matrix maps concepts to events, the Concept Model defines their relationships, the Glossary curates their definitions, the Data Dictionary maps them to columns. Until now, each canvas had its own concept entities (`bem_dimension`, `glossary_term`, etc.), so creating "Customer" on the BEM did nothing for the Glossary — users had to recreate the same concept on every canvas, with the inevitable drift in spelling, definition, and W classification.

## The Solution

BEM concepts now use the `global_concept` entity type when running inside the Context Plane (the standalone app is unchanged). A concept created on any canvas — BEM, Concept Model, Glossary, Dictionary — becomes visible to all the others. Editing the definition in the Glossary updates what the BEM tooltip shows, because they're the same node.

## How It Works

When a user adds a concept on the BEM, the **Add Concept** typeahead first searches all existing `global_concept` nodes by name. If a match is found, the existing concept is linked into the matrix instead of duplicating. If the existing concept already has a W's category assigned, it's linked immediately without prompting.

Removing a concept from a matrix only removes the link — the concept node itself stays, preserving its presence on other canvases. JSON imports also match existing concepts by name (case-insensitive) before creating new ones, and duplicate links are prevented on re-import.

Export is unchanged on the wire — exporting BEM JSON correctly includes concepts whether they're labelled `bem_dimension` (legacy) or `global_concept` (new).

## Key Benefits

- **One concept, one definition** — change the definition in any canvas, see it everywhere
- **Typeahead on add** — start typing, pick an existing concept, link it — no more duplicates
- **Safe removal** — taking a concept off the matrix doesn't blow it away on the Glossary
- **Backwards compatible** — old `bem_dimension` files still load and re-export cleanly
- **Standalone unchanged** — single-app users see no behaviour change

Cross-canvas concept sharing is available now in the latest release.
