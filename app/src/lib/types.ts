/** W categories from BEAM pattern */
export type W = 'who' | 'what' | 'when' | 'where' | 'why' | 'how' | 'how many';

export const WS: W[] = ['who', 'what', 'when', 'where', 'why', 'how', 'how many'];

export const W_LABELS: Record<W, string> = {
	'who': 'Who',
	'what': 'What',
	'when': 'When',
	'where': 'Where',
	'why': 'Why',
	'how': 'How',
	'how many': 'How Many'
};

export const W_COLORS: Record<W, string> = {
	'who': '#16a34a',
	'what': '#2563eb',
	'when': '#d97706',
	'where': '#0891b2',
	'why': '#a855f7',
	'how': '#6b7280',
	'how many': '#f97316'
};

/** Pastel background colors for W sections (matching Context Plane style) */
export const W_BG: Record<W, string> = {
	'who': '#f0fdf4',
	'what': '#eff6ff',
	'when': '#fffbeb',
	'where': '#ecfeff',
	'why': '#faf5ff',
	'how': '#f9fafb',
	'how many': '#fff7ed'
};

/** Border colors for W sections */
export const W_BORDER: Record<W, string> = {
	'who': '#bbf7d0',
	'what': '#bfdbfe',
	'when': '#fde68a',
	'where': '#a5f3fc',
	'why': '#e9d5ff',
	'how': '#e5e7eb',
	'how many': '#fed7aa'
};

/** A concept (column header) in the Event Matrix */
export interface Concept {
	id: string;
	name: string;
	description: string;
	aliases: string[];
	w: W;
	order: number;
	notes?: string;
	/** Aristotelian definition — broader category (genus): "A [Y] that [Z]" */
	definitionCategory?: string;
	/** Aristotelian definition — distinguishing feature (differentia): "A [Y] that [Z]" */
	definitionDifferentiator?: string;
}

/** Relationship between an event and a concept */
export type EventDimensionMark = '' | 'check' | 'star';

/** A business event (row) in the Event Matrix */
export interface BusinessEvent {
	id: string;
	name: string;
	description: string;
	order: number;
	importance: number;
	estimate: number;
	/** Map of concept id -> mark (check or star) */
	concepts: Record<string, EventDimensionMark>;
	/** Map of domain id -> mark (check or star) */
	domains: Record<string, EventDimensionMark>;
}

/** A business data domain (e.g. Sales, Finance, HR) */
export interface Domain {
	id: string;
	name: string;
	description: string;
	aliases: string[];
	owner: string;
	order: number;
	notes?: string;
}

/** Domain color constants */
export const DOMAIN_COLOR = '#7c3aed';   // violet-600
export const DOMAIN_BG = '#f5f3ff';      // violet-50
export const DOMAIN_BORDER = '#ddd6fe';  // violet-200

/** The full domain model */
export interface DomainModel {
	version: string;
	id: string;
	name: string;
	description: string;
	domains: Domain[];
	concepts: Concept[];
	events: BusinessEvent[];
}

/** @deprecated Use Concept instead */
export type Dimension = Concept;
