# Business Event Matrix Moves Import to the Context Plane Sidebar

**18 April 2026**

AgileDataGuides today released a Context-Plane-specific change to the Business Event Matrix's import action — when running embedded inside the Context Plane app, **Import** now lives in the dark sidebar rail rather than inside the canvas body.

## The Problem

The standalone BEM app has its own three-tier header with Import in Tier 1 (the dark App Header). When the same canvas was embedded inside the Context Plane, it was rendering its own Tier 1 strip *inside* the Context Plane's canvas area, producing two header strips: the Context Plane's dark sidebar with the model controls, and the BEM's own white header strip on top of the canvas. Users got confused about which header to use, and the duplicate switcher could fall out of sync.

## The Solution

When running inside the Context Plane, the BEM canvas now hides its own Tier 1 strip entirely. The matrix switcher, **New**, **Import**, and **Delete** all live in the dark Context Plane sidebar rail — matching the pattern Data Contract, Dictionary, Metric Trees, IPC, and the Checklist already use. The standalone app is unchanged: it still has its own dark App Header at the top.

## How It Works

The shared `BusinessEventMatrixLayout` component takes a `showSwitcher` prop. The standalone app passes `true` (render the Tier 1 dark header). The Context Plane passes `false` (hide it; the sidebar handles those actions). The Tier 2 white toolbar (name, description, exports) and Tier 3 tabs render in both modes.

This release also migrated the Glossary and Concept Model canvases to the same pattern, so all three canvases now look and feel identical in the Context Plane.

## Key Benefits

- **One header, not two** — the Context Plane sidebar is the single source of truth for switcher / new / import / delete
- **Consistent across canvases** — BEM, Glossary, and Concept Model now match Data Contract, Dictionary, Metric Trees, IPC, and the Checklist
- **Standalone unchanged** — single-app users still get the dark App Header at the top
- **Single component, two modes** — driven by the `showSwitcher` prop with no code duplication

The Context Plane sidebar import pattern is available now in the latest release.
