# Global Concept Integration — Shared Concepts Across Canvases

**Date:** 2026-03-27

## What's New

- **Concepts are now global entities in Context Plane mode** — When running inside the Context Plane, BEM concepts use the `global_concept` entity type instead of `bem_dimension`. This means concepts created in BEM are automatically visible on the Concept Model, Glossary, Dictionary, and Context Canvas.

- **Typeahead search for existing concepts** — When adding a concept to a matrix, a typeahead dropdown searches all existing `global_concept` nodes by name. Selecting an existing concept links it to the matrix instead of creating a duplicate. If the concept already has a W's assigned, it is linked immediately without requiring an extra click.

- **Safe concept removal** — Removing a concept from a matrix now only removes the links (not the concept node itself), preserving shared global concepts that may be used by other canvases.

- **JSON import deduplication** — Importing BEM JSON into the Context Plane matches dimensions against existing `global_concept` nodes by name (case-insensitive) before creating new ones. Duplicate `has_dimension` links are prevented on re-import.

- **Export handles both label types** — Exporting BEM JSON from the Context Plane correctly includes concepts regardless of whether they are labelled `bem_dimension` or `global_concept`.
