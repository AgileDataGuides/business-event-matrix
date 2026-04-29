# Business Event Matrix Adds Typeahead Search When Adding Domains

**26 April 2026**

AgileDataGuides today released typeahead search for the **+ Domain** button, completing the same treatment that **+ Event** and **+ Concept** already had. Domains can now be picked from existing global domains across the Context Plane instead of accidentally creating duplicates.

## The Problem

Two of the three add buttons (**+ Event** and **+ Concept**) already had typeahead pickers that searched existing global entities. **+ Domain** was the odd one out — it always created a fresh domain, regardless of whether the same domain already existed on the Concept Model or another matrix. Users ended up with "Sales", "Sales Domain", and "SALES" living as three separate nodes.

## The Solution

Clicking **+ Domain** now opens an inline search-or-create input identical to **+ Event** and **+ Concept**. Start typing and a typeahead dropdown searches every existing `global_domain` node by name. Pick a result to link the existing domain into the current matrix. Type a new name and hit Enter to create a fresh domain.

## How It Works

The typeahead matches on case-insensitive substring against `global_domain` nodes from any canvas in the Context Plane. Picked domains are *linked*, not copied — editing a domain's description or owner on any matrix updates it everywhere. This release also fixed a small bug in the matrix switcher where files whose internal `id` no longer matched their filename failed to load; the switcher now normalises the id at read time.

## Key Benefits

- **Three-way parity** — Event, Domain, and Concept all use the same typeahead pattern
- **Reuse beats invent** — link existing domains instead of creating duplicates
- **Cross-canvas sharing** — domains created on the Concept Model are immediately linkable from the BEM
- **Fewer paper-cuts** — switcher fix means renamed files load correctly

The Add Domain typeahead is available now in the latest release.
