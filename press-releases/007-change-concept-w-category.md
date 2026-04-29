# Business Event Matrix Lets You Reassign a Concept's W Category

**24 March 2026**

AgileDataGuides today released the ability to change a concept's W's category in the Business Event Matrix, fixing a small but persistent friction in the original design.

## The Problem

When users created a concept they had to pick its W's category — Who, What, Where, When, Why, How, or How Many — on the spot. If they got it wrong, there was no way to fix it without deleting the concept (losing all its tick marks across events) and recreating it under the right category.

## The Solution

The "Edit details" modal for concepts now includes a W's dropdown. Pick a different W, click Save, and the concept moves to the correct column group in the matrix without losing its existing event marks.

## How It Works

The dropdown lists the seven W's categories. On save, the concept's `w` field updates to the new value, and the matrix re-renders with the concept now living under the new category's pastel colour band. All existing ticks and stars in the concept's column carry across.

## Key Benefits

- **Reversible decisions** — the W choice is no longer permanent at create time
- **Keeps your work** — event marks survive the recategorisation
- **Same edit modal** — uses the existing concept details dialog, no new UI to learn

Editable W's are available now in the latest release.
