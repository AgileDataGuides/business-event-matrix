# The Business Event Matrix Now Suggests Concepts From Your Other Matrices

**6 November 2026**

AgileDataGuides today released Concept suggestions across matrices in the Business Event Matrix app, so a team can add a Concept it already defined in another matrix with one click, its W and aliases included.

## The Problem

A team that builds more than one Business Event Matrix uses the same Concepts again and again: Customer, Product, Order, Payment. The **+ Concept** box on the Matrix tab was meant to suggest the Concepts from the other matrices as you typed. In the standalone app it never did. The suggestions were filtered out before they reached the box, and in the live demo the app also asked a server the demo does not have for the other matrices, which returned an error each time. So people typed every Concept again, picked its W again, and often spelled it a little differently from the matrix next door, which is exactly the drift a shared Concept is meant to stop.

## The Solution

Type in the **+ Concept** box and the app now suggests the matching Concepts from every other saved matrix, with the W of each one beside it. Pick a suggestion and the Concept joins this matrix with its name, its W, its description, its aliases and its definition. Each name is suggested once, and the app never suggests a Concept this matrix already has. The other matrix is not changed.

## How It Works

The suggestions come from your other saved matrices, read from the same place the app saves them: the `data/` folder in an installed app, the browser in the live demo. When you open a different matrix, the suggestions reload from the matrices that are now the other ones. Picking a suggestion makes a copy in this matrix, so later edits to it do not change the matrix it came from. The Canvas tab shows only this matrix's own Concepts.

## Key Benefits

- **Define a Concept once**: a Concept from another matrix arrives with its W, description, aliases and definition
- **Fewer near-duplicates**: picking "Customer" from a list beats typing "Customers" or "Cust" in the next matrix
- **No errors in the live demo**: the demo reads the other matrices from the browser and no longer asks for a server it does not have

Concept suggestions are available now in the Business Event Matrix app in the Context Plane monorepo, the public app at [github.com/AgileDataGuides/business-event-matrix](https://github.com/AgileDataGuides/business-event-matrix), and its [live demo](https://agiledataguides.github.io/business-event-matrix).
