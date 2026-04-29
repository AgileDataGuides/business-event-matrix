# Business Event Matrix Cleans Up Headers and Renames the Context Plane Canvas Tab

**24 April 2026**

AgileDataGuides today released a small but meaningful header cleanup across the Business Event Matrix. Import moves out of the Tier 2 toolbar and into the dark App Header, the rare double-header rendering bug is squashed, and the Context Plane canvas tab is renamed from "Canvas" to "Matrix" to match the rest of the vocabulary.

## The Problem

Three small things had been gnawing at the experience:

1. **Import sat in Tier 2 — the wrong tier.** Import affects which matrix you're working on (Tier 1 / global concern), not the current matrix's content (Tier 2 / per-matrix concern). Users would look for it next to **New Matrix** and **Delete** and not find it there.
2. **Double-header bug** — under certain re-mount sequences, both the SA app's dark App Header and the canvas's own header could render at once, briefly showing the user two switchers.
3. **Tab labelled "Canvas"** — the Context Plane canvas tab was labelled "Canvas" rather than "Matrix", which was inconsistent with the standalone app and with how users actually referred to the artefact.

## The Solution

Three matched fixes:

1. **Import moves to the dark App Header** in every SA app, sitting alongside **New Matrix** and **Delete**. The Tier 2 white toolbar now hosts only the export buttons and the matrix name / description.
2. **Double-header bug fixed** — only one header strip ever renders, regardless of mount order.
3. **CP BEM tab renamed "Canvas" → "Matrix"** — matches the standalone app and the conversational name users actually use.

## Key Benefits

- **Right action in the right tier** — import lives with new and delete (Tier 1 globals)
- **No more double headers** — clean re-mount behaviour
- **Consistent vocabulary** — "Matrix" everywhere, no more "Canvas" tab oddly labelled
- **Same change across SA apps** — Import-to-App-Header was applied across the whole AgileDataGuides Pattern Template family, not just BEM

The header cleanup is available now in the latest release.
