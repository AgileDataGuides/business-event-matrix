# Business Event Matrix Adds Domain Descriptions and Hover Tooltips

**24 March 2026**

AgileDataGuides today released domain descriptions and hover tooltips for the Business Event Matrix, giving users a place to capture what each domain actually means and a fast way to read it back later.

## The Problem

Domain names alone aren't enough to convey meaning. "Sales" means different things to different teams — is that the pre-sales pipeline, the booking moment, the post-sales servicing? Without a written definition next to the name, the matrix becomes ambiguous within weeks of being built.

## The Solution

Every domain now has a description field. Hover over a domain column header and a light-themed tooltip appears showing the domain name and its description. Click **Edit description** in the tooltip to open a modal with a textarea for editing.

## How It Works

The tooltip uses a `mouseenter` / `mouseleave` pair on the domain header. It stays visible while the cursor is over either the header or the tooltip itself, so users can move smoothly from header to **Edit description** without the tooltip disappearing.

The edit modal is a clean dialog with Save and Cancel buttons. Saving writes the new description to the matrix file (which Claude can then read and reason about).

## Key Benefits

- **Disambiguates domain names** — the description is the source of truth, not the column header
- **Fast read-back** — hover, read, move on
- **Smooth interaction** — tooltip doesn't vanish when you reach for the edit link
- **Saved with the matrix** — descriptions persist alongside everything else in the JSON file

Domain descriptions are available now in the latest release.
