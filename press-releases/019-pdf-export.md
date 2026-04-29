# Business Event Matrix Now Exports to PDF

**4 April 2026**

AgileDataGuides today announced PDF export for the Business Event Matrix, making it possible to share a complete matrix as a polished, print-ready document — no spreadsheet imports, no screenshots stitched together.

## The Problem

Sharing a Business Event Matrix with stakeholders who don't open the app was awkward. Screenshots cropped off the right edge of wide matrices. Exported JSON was unreadable to non-technical reviewers. Pasting into a Word doc lost the colour coding. Teams ended up rebuilding the matrix as a slide every time they needed to present it.

## The Solution

The Business Event Matrix now generates a PDF report directly from the matrix with a single click. The output includes a title page with the matrix name and description, the full matrix grid with domain-grouped concept columns, and a clean print layout that handles wide matrices by laying them out across multiple landscape pages.

The export runs entirely in the browser — no server-side processing, no uploads, no external services. The PDF downloads directly to the user's machine.

## How It Works

Click **Export PDF** in the toolbar. The app uses jsPDF + jsPDF-AutoTable to build the document client-side. Concept columns are grouped under their parent W's category, and domains form a separate column block on the left. The mark glyphs (✓ for "involved", ★ for "drives the creation of") are preserved.

PDF export is wired in both the standalone app and the embedded Context Plane version, so the same button works in both modes.

## Key Benefits

- **One click to PDF** — no manual layout, no slide rebuilding
- **Print-ready** — landscape layout handles wide matrices
- **Runs locally** — no data leaves your machine
- **Same in both modes** — works in the standalone app and inside the Context Plane

PDF export is available now in the latest release.
