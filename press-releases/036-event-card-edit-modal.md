# Click an Event to Edit or Delete It

**1 May 2026**

AgileDataGuides today released a new edit popup on every event row of the Business Event Matrix. Click an event name in the matrix and a popup opens showing the event's name and description with Cancel, Save, and Delete actions. The same shared component shipped to the Information Product Canvas and Data Contract on the same day, so the experience is identical wherever users go.

## The Problem

Until now, the only way to delete an event from the matrix was to fish around for the right affordance — and there wasn't a great one. Renaming an event was a double-click on its name (inline edit), but the event's description had no editing affordance at all. The column-header edit modal that already worked for domains and concepts didn't extend to events because events were structurally different from columns — they're rows in the matrix grid.

Users who wanted to remove an event they'd added by mistake were left with no clean way to do it.

## The Solution

A single click on an event row's name now opens the new shared **CardEditModal**:

- **Name** — text input, pre-filled with the current event name
- **Description** — textarea, pre-filled with the current description (event descriptions previously had no UI to edit them)
- **Delete** on the left (red, isolated from Save to reduce mis-click risk)
- **Cancel** + **Save** on the right

The existing double-click inline rename still works for fast renames — that path is preserved exactly. The new single-click path opens the modal for the cases where the user wants to do anything other than rename.

## How It Works

The modal is implemented as one shared Svelte component in `packages/shared/src/components/CardEditModal.svelte`. The Business Event Matrix passes the selected event node, a `typeLabel="Event"`, and adapter-backed save/delete callbacks. The DataAdapter writes through the existing autosave debounce so changes land in the matrix's JSON file (or localStorage in demo mode) within 300ms.

The existing column-header modal for domains and concepts is unchanged — those have richer fields (W category, definition genus + differentiator, aliases, owner, notes) so they keep their dedicated modal. Events now get the lightweight modal since they only need name + description.

## Key Benefits

- **Events finally get a description editor** — every event can carry a proper description, not just a name
- **One-click delete** — open the popup, hit Delete, confirm, gone
- **Click + double-click both work** — single click for the modal, double click for inline rename
- **Same modal across every SA app** — users moving between IPC, BEM, and Data Contract see the same popup with the same buttons in the same places

The release is available now at [github.com/AgileDataGuides/business-event-matrix](https://github.com/AgileDataGuides/business-event-matrix) and via the [live demo](https://agiledataguides.github.io/business-event-matrix/).
