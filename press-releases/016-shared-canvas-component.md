# Business Event Matrix Now Uses a Single Shared Canvas Component

**27 March 2026**

AgileDataGuides today released a major architectural change to the Business Event Matrix — the standalone app and the embedded Context Plane version now share a single canvas component. Behaviour that used to drift between the two modes now lands in one place and propagates everywhere.

## The Problem

The Business Event Matrix runs in two places: as a standalone app at `localhost:5121` for solo modelling, and embedded inside the Context Plane app at `localhost:5173` for cross-canvas work. Until now, those two surfaces had separate copies of the canvas code. New features — inline rename, hover tooltips, edit modals — would land in one and slowly get ported to the other, with subtle behaviour differences in the gap.

## The Solution

There's now one canvas component (`BusinessEventMatrixLayout.svelte`) that both modes consume. The standalone app imports it directly. The Context Plane imports it via the `business-domain-models` workspace package. A shared `DataAdapter` interface decouples the canvas from its persistence layer — standalone uses file-based storage, Context Plane uses DuckDB, neither concerns the canvas.

## How It Works

The canvas component takes a `DataAdapter` from Svelte context. The standalone app provides an adapter that talks to the SvelteKit `/api/models` routes; the Context Plane provides one that talks to DuckDB via the FastAPI backend. From the canvas's point of view, they look identical — same methods, same return shapes.

## Key Benefits

- **Behaviour parity** — inline rename, tooltips, edit modals work identically in both modes
- **One place to fix bugs** — a fix in the canvas lands in both surfaces immediately
- **Faster feature delivery** — new features ship to both modes without porting work
- **Adapter pattern** — clean separation of canvas from persistence so future modes (browser-only demo, mobile, etc.) plug in cheaply

The shared canvas is available now in the latest release.
