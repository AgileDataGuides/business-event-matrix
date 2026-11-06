// THE one file for the guided steps' wording.
//
// Every step name, question, one-line description and line of step guidance
// lives here, so a change to the wording is a one-file edit.
//
// No written method for the Business Event Matrix exists yet, so the steps
// follow the matrix itself and the BEAM 7W's pattern it already uses: the
// Scope, the Domains, the Core Business Events, where each Event happens,
// the Concepts by 7W, which Concepts each Event involves, which one it
// creates, then a check for gaps.
//
// Copy rules for anything a person reads: British spelling, "the
// organisation" never "the business", no em dashes, step labels in the form
// "Step 4 - Place the Events in their Domains".

export type StepId =
	| 'scope'
	| 'domains'
	| 'events'
	| 'event-domains'
	| 'concepts'
	| 'event-concepts'
	| 'driving'
	| 'check';

export interface StepCanon {
	id: StepId;
	number: number;
	name: string;
	/** The question the step asks, the most prominent line of its panel. */
	question: string;
	/** One or two lines on what the step captures. */
	description: string;
	/** More help under the description, where a step needs it. */
	guide?: string;
}

export const STEPS: StepCanon[] = [
	{
		id: 'scope',
		number: 1,
		name: 'Identify the Scope',
		question: 'What part of the organisation does this matrix cover?',
		description: 'A name for the matrix and one line on its boundary, so everyone knows which Events belong in it.'
	},
	{
		id: 'domains',
		number: 2,
		name: 'Identify the Domains',
		question: 'Which areas of the organisation do the Events happen in?',
		description: 'The big areas of the organisation, for example Marketing, Finance or Customer Success.'
	},
	{
		id: 'events',
		number: 3,
		name: 'Identify the Core Business Events',
		question: 'What happens that the organisation cares about?',
		description: 'The moments that matter, each said as who does what, for example "Customer Subscribes to a Paid Plan".',
		guide: 'Write each Event as Subject Verb Object. Add them in the order they happen, from the first moment to the last.'
	},
	{
		id: 'event-domains',
		number: 4,
		name: 'Place the Events in their Domains',
		question: 'Which Domains does each Event happen in?',
		description: 'Mark the Domains each Core Business Event happens in. An Event can sit in more than one Domain.'
	},
	{
		id: 'concepts',
		number: 5,
		name: 'Identify the Concepts',
		question: 'Who, what, when, where, why, how and how many?',
		description: "The things the Events involve, each sorted by the 7W's: Who, What, When, Where, Why, How and How Many.",
		guide: 'Read each Event and ask the seven questions. "Customer Subscribes to a Paid Plan": who subscribes? Customer. What do they subscribe to? Plan. When? Subscription Date. Pick the W, type the Concept and press Enter.'
	},
	{
		id: 'event-concepts',
		number: 6,
		name: 'Link the Concepts to the Events',
		question: 'Which Concepts does each Event involve?',
		description: 'Mark every Concept each Core Business Event involves. Each mark is a ✓ in the matrix.'
	},
	{
		id: 'driving',
		number: 7,
		name: 'Mark the Driving Concepts',
		question: 'Which Concept does each Event create?',
		description: 'Of the Concepts an Event involves, star the one the Event creates. "Customer Subscribes to a Paid Plan" creates a Subscription. Each star is a ✭ in the matrix, and each Event should have one.'
	},
	{
		id: 'check',
		number: 8,
		name: 'Check the Matrix',
		question: 'Does the matrix tell the whole story?',
		description: 'Look for gaps before you use the matrix: Events with no Domain or no driving Concept, and Domains or Concepts no Event uses.'
	}
];

/** "Step 4 - Place the Events in their Domains" */
export function stepLabel(step: StepCanon): string {
	return `Step ${step.number} - ${step.name}`;
}

export function getStep(id: StepId): StepCanon {
	const step = STEPS.find((s) => s.id === id);
	if (!step) throw new Error(`Unknown step: ${id}`);
	return step;
}

// ── Vocabulary ───────────────────────────────────────────────────────

/** The add fields' placeholders. Enter adds and keeps the cursor in the field. */
export const ADD_PLACEHOLDER = {
	domain: 'Add a Domain, for example Finance, press Enter',
	event: 'Add an Event, for example Customer Subscribes to a Paid Plan, press Enter',
	concept: 'Add a Concept, for example Customer, press Enter'
} as const;

/** A line in a marking step when an earlier step has nothing in it yet. */
export const NEEDS_EARLIER_STEP = {
	events: 'No Core Business Events yet. Add them in Step 3.',
	domains: 'No Domains yet. Add them in Step 2.',
	concepts: 'No Concepts yet. Add them in Step 5.',
	linked: 'No Concepts linked yet. Link them in Step 6.'
} as const;
