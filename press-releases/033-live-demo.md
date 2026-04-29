# Try the Business Event Matrix Online — No Install Required

**29 April 2026**

AgileDataGuides today released a live demo of the Business Event Matrix, available instantly at [agiledataguides.github.io/business-event-matrix](https://agiledataguides.github.io/business-event-matrix). No download, no install, no sign-up — just open the link and start mapping events.

## The Problem

Until now, the only way to try the Business Event Matrix was to download the repository, install Node.js, and run it locally. That's a real barrier for people who just want to see what it does — especially business analysts, product owners, and data leaders who might benefit from the matrix but aren't going to spin up a dev environment to find out.

## The Solution

The live demo runs entirely in the browser as a static site hosted on GitHub Pages. It includes the full set of three example matrices — **Ice Cream Shop**, **Lawrence Corr BEAM**, and **SaaS Revenue Events** — so visitors immediately have populated matrices to explore and learn from.

All data is saved in the browser's localStorage — nothing is sent to any server, and nothing leaves the visitor's device. The demo is functionally identical to the local version, minus the file-based storage and Claude Code integration.

## How It Works

The app detects demo mode at build time via an environment variable. In demo mode, the persistence layer swaps from server API routes (which write JSON files to disk) to browser localStorage. The SvelteKit app is compiled with `adapter-static` to produce a pure client-side single-page application, then automatically deployed to GitHub Pages via a GitHub Actions workflow on every push to main.

The three example matrices are bundled at build time and seeded into localStorage on first visit, so visitors land on a populated app rather than an empty one.

## Key Benefits

- **Zero friction** — share a link, the recipient is using it in seconds
- **Safe to share** — no server, no API, no file system access, nothing to attack
- **Three examples preloaded** — Ice Cream Shop, Lawrence Corr BEAM, SaaS Revenue Events
- **Full experience** — create matrices, edit cells, mark intersections, export JSON/PDF/CSV/Excel, switch between matrices, search, hide unmarked
- **Private by design** — all data stays in the visitor's browser
- **Always up to date** — auto-deployed from the latest code on every release

## Embedding in Your Site

The demo can be embedded in any website using an iframe:

```html
<iframe src="https://agiledataguides.github.io/business-event-matrix"
        width="100%" height="800" frameborder="0"
        style="border: 1px solid #e2e8f0; border-radius: 8px;">
</iframe>
```

## What's Next

The live demo makes it easy to share the Business Event Matrix with colleagues and stakeholders. Download the [full local version](https://github.com/AgileDataGuides/business-event-matrix) when you're ready for file-based storage and Claude Code integration.

The live demo is available now at [agiledataguides.github.io/business-event-matrix](https://agiledataguides.github.io/business-event-matrix).
