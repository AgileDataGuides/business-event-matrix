# Business Event Matrix Now Exports to CSV and Excel

**4 April 2026**

AgileDataGuides today announced CSV and Excel export for the Business Event Matrix, giving teams two more ways to share matrices with stakeholders who live in spreadsheet land.

## The Problem

Some stakeholders won't open a JSON file. Some won't open a PDF either — they want to filter, sort, pivot, or merge the matrix with other data they already have in a spreadsheet. Telling them "open the app and recreate it" wasn't going to fly.

## The Solution

The Business Event Matrix now offers two new export buttons: **Export CSV** and **Export Excel**. Both produce the same matrix data in spreadsheet-readable form, with consistent column ordering and the same ✓ / ★ glyphs the app uses.

- **CSV** is a flat single-sheet export — events as rows, then Event Description, then one column per Domain, then concept columns grouped by W's category. Perfect for piping into other tools.
- **Excel** (`.xlsx`) is a workbook with three sheets:
  - **Matrix** — same shape as the CSV
  - **Domains** — name, description, owner, aliases
  - **Concepts** — name, W's category, description, aliases

## How It Works

Both formats share the same column ordering: Event Name, Event Description, Domain columns alphabetically, Concept columns grouped by W's category. Mark glyphs are preserved verbatim — `★` for "drives the creation of", `✓` for "involved", empty for "not involved".

The export runs entirely in the browser — no server-side processing, no uploads. Files download directly to the user's machine.

## Key Benefits

- **Spreadsheet-friendly** — open in Excel, Google Sheets, Numbers, Apple Numbers, or any CSV reader
- **Three sheets in one workbook** — the Excel export packages domains and concepts as separate sheets so reviewers can see metadata without leaving the file
- **Consistent ordering** — the same columns in the same order across CSV, Excel, and PDF
- **Runs locally** — no data leaves your machine
- **Works in both modes** — same buttons in the standalone app and the embedded Context Plane version

CSV and Excel export are available now in the latest release.
