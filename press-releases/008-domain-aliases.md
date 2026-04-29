# Business Event Matrix Adds Aliases for Domains

**24 March 2026**

AgileDataGuides today extended aliases to domains in the Business Event Matrix, completing the same treatment that concepts received earlier today.

## The Problem

Domains have the same naming-overlap problem as concepts. The "Sales" domain might be called "Revenue" by Finance, "Commerce" by the platform team, and "Go-To-Market" by Strategy. Picking one canonical name leaves the others stranded, and inventing duplicate domains fragments the matrix.

## The Solution

Domains now carry an aliases array, mirroring concepts. Aliases appear as pill badges in the domain's hover tooltip, beneath the description. The "Edit details" modal now shows the aliases field for both domains and concepts — same input, same parsing, same storage shape.

## Key Benefits

- **One domain, many names** — capture how different parts of the business refer to the same domain
- **Visible in tooltips** — pill badges make aliases easy to spot during hover
- **Same UX as concepts** — aliases editing works identically across both entity types
- **Saved with the matrix** — aliases persist alongside everything else in the JSON file

Domain aliases are available now in the latest release.
