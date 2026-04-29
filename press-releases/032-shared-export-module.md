# Business Event Matrix Now Has Four Export Buttons in Both Modes

**29 April 2026**

AgileDataGuides today released full export parity between the standalone Business Event Matrix and the embedded Context Plane version. The Context Plane canvas now exposes the same four export buttons (JSON, PDF, CSV, Excel) as the standalone app, all driven by a single shared export module so a future change to the file format lands in both modes at once.

## The Problem

The standalone BEM had four export buttons: JSON, PDF, CSV, Excel. The Context Plane canvas only had two — JSON and PDF — because the CSV and Excel logic lived inside the standalone store and was not consumable from the Context Plane's frontend. This forced Context Plane users to export to JSON, switch to the standalone app, import the JSON, and re-export as CSV or Excel from there. That round-trip was friction every team hit at least once.

A second concern was duplication. The CSV and XLSX builders lived inside the SA store. If we'd added them to the Context Plane too without refactoring, we'd have had two copies of the same logic — and they'd have drifted within months.

## The Solution

The CSV and XLSX building logic was extracted into a new `export-bem.ts` module that takes a model-shaped input and returns the exported CSV string or XLSX `Blob`. Both the SA store and the Context Plane frontend call it.

The Context Plane canvas now exposes all four export buttons (JSON, PDF, CSV, Excel) — same styling, same behaviour, same output format as the standalone app.

## How It Works

Three pieces of work:

1. **New `export-bem.ts` module** with pure functions: `bemModelToCsv`, `bemModelToXlsxBlob`, `downloadBemBlob`, `bemExportFilename`. Model-shaped input, no store / DOM coupling — the SA passes its store's model, the Context Plane computes a model-shaped object from the graph and passes that.
2. **SA store refactored** — `exportAsCsv()` and `exportAsXlsx()` are now thin wrappers calling the shared module.
3. **Shared layout component gains optional `onExportCsv` / `onExportXlsx` props** — both the standalone app and the Context Plane wire them in.

## Key Benefits

- **Four export buttons in both modes** — no more JSON-and-reimport round-trips
- **One source of truth** — change the CSV column order or XLSX sheet structure once, both modes pick it up
- **Same output format** — Context Plane and standalone exports produce identical files for the same matrix
- **No new tech debt** — the refactor avoids creating a second copy of the export logic

The shared export module is available now in the latest release.
