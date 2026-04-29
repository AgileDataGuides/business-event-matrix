# Business Event Matrix Adds Aliases for Concepts

**24 March 2026**

AgileDataGuides today released concept aliases for the Business Event Matrix, letting users record the alternative names a concept goes by across different parts of the business.

## The Problem

Different teams call the same concept different things. The Sales team's "Customer" is the Marketing team's "Lead" the moment they show up on a landing page, and the Operations team's "Account" once they've been billed. The matrix only had one name field per concept, so users either picked one and lost the others, or invented duplicate concepts that fragmented the model.

## The Solution

Concepts now carry an aliases array. Each alias is an alternative name the concept is known by. They show up as small pill badges in the concept's hover tooltip, beneath the description.

The "Edit details" modal for concepts now includes an aliases field — enter comma-separated alternative names, hit Save, and the aliases are parsed, trimmed, and stored as an array.

## How It Works

The Ice Cream Shop example matrix has been updated with sample aliases for every concept (e.g. *Product*: Item, SKU, Flavour) so visitors see the feature in action immediately.

## Key Benefits

- **One concept, many names** — capture how different teams refer to the same thing without splitting the matrix
- **Visible in tooltips** — pill badges make aliases easy to spot during hover
- **Parsed on save** — comma-separated input is normalised into a clean array
- **Saved with the matrix** — aliases persist alongside everything else in the JSON file

Concept aliases are available now in the latest release.
