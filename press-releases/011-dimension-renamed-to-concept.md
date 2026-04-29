# Business Event Matrix Renames "Dimension" to "Concept"

**27 March 2026**

AgileDataGuides today released a vocabulary change in the Business Event Matrix — "Dimension" is now "Concept" everywhere users see it, aligning the app with how business modellers actually talk about their domain.

## The Problem

The original app borrowed "Dimension" from data warehousing — the things you slice facts by. That's the right word for a star schema, but the wrong word for a business event matrix. Business people don't think about "Customer Dimension" — they think about the **Customer concept**. Using BI vocabulary for a business modelling tool was creating a translation step every time someone explained the matrix.

## The Solution

Every UI label, column header, button, and tooltip that previously read "Dimension" now reads "Concept". The "Add Dimension" button is now "Add Concept". The W's column groups still organise the same way; only the term changes.

## How It Works

The TypeScript types remain `Dimension` internally for backwards compatibility — saved JSON files from before the rename still load without migration, and the import path treats `dimensions` and `concepts` as the same field. Users see "Concept" everywhere; the file format keeps both names valid.

## Key Benefits

- **Speaks the user's language** — business modellers don't have to translate "Dimension" to "Concept" in their heads
- **No data migration needed** — old saved files keep working, the import path accepts either field name
- **Same W's grouping** — concepts still cluster by Who / What / Where / When / Why / How / How Many

The rename is available now in the latest release.
