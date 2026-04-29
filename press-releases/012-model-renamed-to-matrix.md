# Business Event Matrix Renames "Model" to "Matrix"

**27 March 2026**

AgileDataGuides today released a follow-up vocabulary change in the Business Event Matrix — "Model" is now "Matrix" in every action button and label. The app's name was Business Event **Matrix**, but the buttons all said "New Model" / "Switch Model" / "Delete Model". This release closes that gap.

## The Problem

Two terms for the same thing in the same app is a small but persistent paper-cut. Users would read "Business Event Matrix" at the top of the page, click a button labelled "New Model", and have to mentally reconcile that the two words meant the same thing. Worse, paired Claude conversations would slip between "model" and "matrix" depending on which the conversation had picked up first.

## The Solution

Every action button and label now uses "Matrix": **New Matrix**, **Delete**, **Switch matrix**. The dropdown that switches between saved matrices got a small visual upgrade at the same time — replacing the native `<select>` with a custom dropdown that shows the current matrix name, a "Switch matrix" subtitle, and a chevron.

The custom dropdown highlights the active matrix, supports click-outside-to-close, and matches the design system used by the new buttons.

## Key Benefits

- **One word for the thing** — no more mental translation between "model" and "matrix"
- **Cleaner switcher** — the custom dropdown reads better than the native select element
- **Click-outside dismiss** — fits the rest of the app's interaction patterns
- **Saved files unaffected** — the rename is purely cosmetic

The rename is available now in the latest release.
