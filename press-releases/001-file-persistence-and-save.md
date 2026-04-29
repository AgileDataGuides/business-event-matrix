# File-Based Persistence & Save Button

**Date:** 2026-03-24

## What's New

- **Save Button** — A new "Save" button in the toolbar persists your current model to disk. The button shows "Saved" (greyed out) when no changes are pending, and lights up as "Save" (blue) whenever you have unsaved changes.

- **File-Based Persistence** — Models are now stored as individual JSON files in the `data/` directory instead of browser localStorage. This means your models survive browser cache clears and can be version-controlled, backed up, or shared.

- **New Model Fix** — Creating a new model now correctly appears in the dropdown selector immediately.

- **Ice Cream Shop Example** — The example model is pre-seeded in the `data/` directory so it's always available on first launch.

- **Dirty State Tracking** — The app now tracks whether you have unsaved changes. Switching models auto-saves if needed.
