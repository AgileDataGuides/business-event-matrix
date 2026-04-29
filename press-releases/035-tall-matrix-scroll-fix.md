# Business Event Matrix Now Scrolls Through Tall Matrices

**29 April 2026**

AgileDataGuides today released a fix for a scroll bug in the Business Event Matrix that prevented users from seeing all their events when a matrix was taller than the viewport.

## The Problem

A user reported that when they had more event rows than the screen could fit, they couldn't scroll up or down to see the rest. The matrix would simply cut off at the bottom of the visible area, with no scrollbar and no way to navigate to the hidden events. For matrices like the SaaS Revenue Events Matrix (30+ events) or any project-specific matrix that grew over time, this meant a real chunk of work was effectively invisible — there but unreachable.

## The Solution

The matrix now scrolls cleanly inside its bounds when content overflows the viewport. The dark App Header and white toolbar stay fixed at the top; only the matrix area scrolls. Wheel, touch, scrollbar, keyboard arrow keys — all the usual scroll mechanisms work as expected.

## How It Works

The bug was a single missing CSS class on the wrapper around the matrix layout. The matrix's internal scroll container used Tailwind's `flex-1` utility to claim available vertical space — but `flex-1` only takes effect when its parent is a flex container. The wrapper above had `overflow-hidden` but wasn't a flex container, so `flex-1` was inert, the matrix grew to its natural (tall) content height, and the parent clipped the overflow without a scrollbar to compensate.

Adding `flex flex-col` to the wrapper activates the matrix's existing scroll machinery. One-class change in CSS; big quality-of-life difference for anyone with a matrix that won't fit on screen.

## Key Benefits

- **All your events are reachable** — no more matrices where the bottom rows are silently invisible
- **Header stays fixed** — the App Header and toolbar don't scroll out of view; only the matrix area moves
- **Standard scroll mechanics work** — wheel, touch, keyboard arrows, and the scrollbar itself all behave as expected
- **Verified live** — fix tested by programmatically scrolling the matrix in a constrained-height browser and confirming the scroll moved (no more shipping CSS fixes on type-check alone)

The scroll fix is available now in the latest release.
