# Business Event Matrix Adds File-Based Persistence

**24 March 2026**

AgileDataGuides today released file-based persistence for the Business Event Matrix, replacing browser localStorage with on-disk JSON files that survive cache clears, get version-controlled, and stay readable by Claude.

## The Problem

The first version of the app stored matrices in the browser's localStorage. That was fine for a quick demo but had two real problems: clearing cache deleted everyone's work, and there was no way for Claude to read the matrix file directly when paired with the app via Claude Code.

## The Solution

Every matrix is now stored as an individual JSON file in the `data/` directory. The app reads and writes those files via small SvelteKit API routes during `npm run dev`. A new **Save** button in the toolbar persists the current matrix to disk on demand.

A dirty-state tracker watches for unsaved changes — the Save button shows greyed-out **Saved** when nothing's pending, and lights up blue as **Save** when there are uncommitted edits. Switching matrices auto-saves first, so nothing is lost.

## How It Works

Files land at `data/<matrix-id>.json` — one file per matrix, named after its slug. Anyone can hand-edit them, version-control them, back them up, or share them. The included Claude skill reads them directly so paired conversations always see the latest matrix without any export step.

## Key Benefits

- **Survives cache clears** — your matrices live on disk, not in the browser
- **Version-controllable** — drop the `data/` folder into git and you have a change history
- **Claude can read them** — pairs with Claude Code without an export round-trip
- **Clear save state** — dirty / saved indicator removes any doubt about whether your work is safe
- **Auto-save on switch** — switching matrices commits in-flight changes before loading the new one

File-based persistence is available now in the latest release.
