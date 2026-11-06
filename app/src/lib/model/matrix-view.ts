// The selected matrix as the Steps tab reads it, and every line the Steps
// tab derives from it: each step's status, and the gaps Step 8 lists.
// Pure functions over { nodes, links }, so nothing about a step is stored.

import type { ContextLink, ContextNode } from '$lib/cp-shared';
import type { StepId } from '../canon/steps';
import type { W } from '../types';

export type Mark = '' | 'check' | 'star';

export interface MatrixView {
	model: ContextNode;
	/** Alphabetical, as in the matrix. */
	domains: ContextNode[];
	/** In Event order, as in the matrix. */
	events: ContextNode[];
	/** By 7W, then alphabetical, as in the matrix. */
	concepts: ContextNode[];
	/** Event id to Domain id to mark. */
	domainMarks: Map<string, Map<string, Mark>>;
	/** Event id to Concept id to mark. */
	conceptMarks: Map<string, Map<string, Mark>>;
}

/**
 * The writes a step makes. The layout supplies them, so a step writes the
 * same links the matrix writes, through the DataAdapter, in either mode.
 * An add also links the new node to the selected matrix.
 */
export interface MatrixActions {
	updateModel: (updates: { name?: string; description?: string }) => Promise<void>;
	addDomain: (name: string) => Promise<void>;
	addEvent: (name: string) => Promise<void>;
	addConcept: (name: string, w: W) => Promise<void>;
	/** '' removes the mark. */
	setDomainMark: (eventId: string, domainId: string, mark: Mark) => Promise<void>;
	setConceptMark: (eventId: string, conceptId: string, mark: Mark) => Promise<void>;
}

/** A Concept's 7W. A Concept saved without one reads as Who, as in the matrix. */
export function conceptW(concept: ContextNode): W {
	return (concept.properties?.w as W) || 'who';
}

/** The marks on one kind of link, keyed by Event then by the Domain or Concept. */
export function readMarks(links: ContextLink[], labels: string[]): Map<string, Map<string, Mark>> {
	const marks = new Map<string, Map<string, Mark>>();
	for (const link of links) {
		if (!labels.includes(link.label)) continue;
		const mark = link.properties?.mark;
		if (mark !== 'check' && mark !== 'star') continue;
		const row = marks.get(link.source_id) ?? new Map<string, Mark>();
		row.set(link.destination_id, mark);
		marks.set(link.source_id, row);
	}
	return marks;
}

export function markOf(marks: Map<string, Map<string, Mark>>, eventId: string, targetId: string): Mark {
	return marks.get(eventId)?.get(targetId) ?? '';
}

function marksFor(marks: Map<string, Map<string, Mark>>, eventId: string): Mark[] {
	return [...(marks.get(eventId)?.values() ?? [])];
}

/** "1 Domain", "3 Domains" */
export function count(n: number, one: string, many: string): string {
	return `${n} ${n === 1 ? one : many}`;
}

// ── Gaps ─────────────────────────────────────────────────────────────

export interface Gap {
	id: string;
	/** What is missing, for example "Core Business Events in no Domain". */
	heading: string;
	items: ContextNode[];
	/** The step that fills the gap. */
	fixStep: StepId;
}

/** Step 8: what to look at before the matrix is used. Only gaps that hold items. */
export function findGaps(m: MatrixView): Gap[] {
	const noConcept = m.events.filter((e) => marksFor(m.conceptMarks, e.id).length === 0);
	const gaps: Gap[] = [
		{
			id: 'event-no-domain',
			heading: 'Core Business Events in no Domain',
			items: m.events.filter((e) => marksFor(m.domainMarks, e.id).length === 0),
			fixStep: 'event-domains'
		},
		{
			id: 'event-no-concept',
			heading: 'Core Business Events with no Concepts',
			items: noConcept,
			fixStep: 'event-concepts'
		},
		{
			// An Event with no Concepts is already listed above, so it is not listed twice
			id: 'event-no-driving',
			heading: 'Core Business Events with no driving Concept',
			items: m.events.filter((e) => !noConcept.includes(e) && !marksFor(m.conceptMarks, e.id).includes('star')),
			fixStep: 'driving'
		},
		{
			id: 'domain-unused',
			heading: 'Domains no Event happens in',
			items: m.domains.filter((d) => !m.events.some((e) => markOf(m.domainMarks, e.id, d.id))),
			fixStep: 'event-domains'
		},
		{
			id: 'concept-unused',
			heading: 'Concepts no Event involves',
			items: m.concepts.filter((c) => !m.events.some((e) => markOf(m.conceptMarks, e.id, c.id))),
			fixStep: 'event-concepts'
		}
	];
	return gaps.filter((g) => g.items.length > 0);
}

// ── Step status ──────────────────────────────────────────────────────

export interface StepStatus {
	/** The rail's status line under the step name. */
	line: string;
	/** The rail's dot fills once the step has anything in it. */
	started: boolean;
}

/** "5 of 7 Events placed", or the line for an empty matrix. */
function ofEvents(m: MatrixView, done: number, what: string): StepStatus {
	if (m.events.length === 0) return { line: 'No Core Business Events yet', started: false };
	return { line: `${done} of ${m.events.length} Events ${what}`, started: done > 0 };
}

export function stepStatus(m: MatrixView, id: StepId): StepStatus {
	switch (id) {
		case 'scope': {
			const described = !!m.model.description?.trim();
			return { line: described ? 'Scope described' : 'No scope line yet', started: described };
		}
		case 'domains':
			return m.domains.length === 0
				? { line: 'No Domains yet', started: false }
				: { line: count(m.domains.length, 'Domain', 'Domains'), started: true };
		case 'events':
			return m.events.length === 0
				? { line: 'No Core Business Events yet', started: false }
				: { line: count(m.events.length, 'Core Business Event', 'Core Business Events'), started: true };
		case 'event-domains':
			return ofEvents(m, m.events.filter((e) => marksFor(m.domainMarks, e.id).length > 0).length, 'placed');
		case 'concepts': {
			if (m.concepts.length === 0) return { line: 'No Concepts yet', started: false };
			const ws = new Set(m.concepts.map(conceptW)).size;
			return { line: `${count(m.concepts.length, 'Concept', 'Concepts')} in ${ws} of the 7W's`, started: true };
		}
		case 'event-concepts':
			return ofEvents(m, m.events.filter((e) => marksFor(m.conceptMarks, e.id).length > 0).length, 'linked');
		case 'driving':
			return ofEvents(m, m.events.filter((e) => marksFor(m.conceptMarks, e.id).includes('star')).length, 'have a driving Concept');
		case 'check': {
			if (m.events.length === 0) return { line: 'Nothing to check yet', started: false };
			// One gap per card in Step 8, so the rail and the step say the same number
			const open = findGaps(m).length;
			return { line: open === 0 ? 'No gaps found' : `${count(open, 'gap', 'gaps')} to look at`, started: true };
		}
	}
}
