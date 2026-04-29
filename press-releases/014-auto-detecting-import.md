# Business Event Matrix Auto-Detects JSON Import Format

**27 March 2026**

AgileDataGuides today released auto-detecting JSON import for the Business Event Matrix, replacing two separate import buttons with a single one that figures out the file format on its own.

## The Problem

The toolbar previously had two import buttons: **Import JSON** (for native BEM matrix files) and **Import Graph** (for Context Plane graph format files with `nodes` and `links`). Users had to know which format their file was in before clicking — and clicking the wrong button gave a cryptic error rather than a helpful redirect.

## The Solution

The two buttons collapse into one **Import JSON** button. When a file is selected, the app inspects its top-level shape:

- If it has `nodes` and `links` arrays, it's a Context Plane graph export — the graph importer is used and the graph gets converted back into native BEM shape.
- Otherwise it's treated as native BEM JSON.

The user doesn't see the detection happening — it just works.

## Key Benefits

- **One button, both formats** — no need to know what shape your file is in
- **Round-trips with the Context Plane** — graph exports re-import cleanly without manual conversion
- **Helpful errors** — invalid files surface a clear message instead of cryptic parse errors
- **Less toolbar clutter** — one button instead of two

Auto-detecting import is available now in the latest release.
