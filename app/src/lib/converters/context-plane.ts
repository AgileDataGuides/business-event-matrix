/**
 * Bidirectional converter between BEM native JSON and Context Plane { nodes, links } format.
 * Marks (check/star) are stored as properties on event_involves_domain/event_involves_concept links.
 */
import type { ContextNode, ContextLink } from '$lib/cp-shared';
import type { DomainModel, EventDimensionMark } from '$lib/types';

function createId(prefix: string): string {
	const rand = typeof crypto !== 'undefined' && crypto.randomUUID
		? crypto.randomUUID().slice(0, 8)
		: Math.random().toString(36).slice(2, 10);
	return `${prefix}-${rand}`;
}

function now(): string {
	return new Date().toISOString();
}

/**
 * Convert a DomainModel to Context Plane nodes + links format.
 */
export function bemToContextPlane(m: DomainModel): { nodes: ContextNode[]; links: ContextLink[] } {
	const nodes: ContextNode[] = [];
	const links: ContextLink[] = [];
	const ts = now();

	// Model node
	const modelNodeId = `bem-model-${m.id}`;
	nodes.push({
		id: modelNodeId,
		label: 'bem_model',
		name: m.name,
		description: m.description,
		properties: { version: m.version },
		created_at: ts,
		updated_at: ts
	});

	// Domain nodes
	const domainIdMap = new Map<string, string>();
	for (const dom of m.domains || []) {
		const nodeId = `bem-domain-${m.id}-${dom.id}`;
		domainIdMap.set(dom.id, nodeId);
		nodes.push({
			id: nodeId,
			label: 'bem_domain',
			name: dom.name,
			description: dom.description,
			properties: { order: dom.order, aliases: dom.aliases, owner: dom.owner, notes: dom.notes, sourceId: dom.id },
			created_at: ts,
			updated_at: ts
		});
		links.push({
			id: `link-${m.id}-has-domain-${dom.id}`,
			source_id: modelNodeId,
			destination_id: nodeId,
			label: 'has_domain',
			created_at: ts,
			updated_at: ts
		});
	}

	// Concept nodes (using global_concept label + has_concept link)
	const conceptIdMap = new Map<string, string>();
	for (const concept of m.concepts) {
		const nodeId = `bem-concept-${m.id}-${concept.id}`;
		conceptIdMap.set(concept.id, nodeId);
		nodes.push({
			id: nodeId,
			label: 'global_concept,global_glossary_term',
			name: concept.name,
			description: concept.description,
			properties: { w: concept.w, order: concept.order, aliases: concept.aliases, notes: concept.notes, sourceId: concept.id, definitionCategory: concept.definitionCategory || '', definitionDifferentiator: concept.definitionDifferentiator || '' },
			created_at: ts,
			updated_at: ts
		});
		links.push({
			id: `link-${m.id}-has-concept-${concept.id}`,
			source_id: modelNodeId,
			destination_id: nodeId,
			label: 'has_concept',
			created_at: ts,
			updated_at: ts
		});
	}

	// Event nodes + mark links
	for (const ev of m.events) {
		const eventNodeId = `bem-event-${m.id}-${ev.id}`;
		nodes.push({
			id: eventNodeId,
			label: 'bem_event',
			name: ev.name,
			description: ev.description,
			properties: { order: ev.order, importance: ev.importance, estimate: ev.estimate, sourceId: ev.id },
			created_at: ts,
			updated_at: ts
		});
		links.push({
			id: `link-${m.id}-has-event-${ev.id}`,
			source_id: modelNodeId,
			destination_id: eventNodeId,
			label: 'has_event',
			created_at: ts,
			updated_at: ts
		});

		// Domain marks
		for (const [domId, mark] of Object.entries(ev.domains || {})) {
			if (mark) {
				const domNodeId = domainIdMap.get(domId);
				if (domNodeId) {
					links.push({
						id: `link-${m.id}-${ev.id}-involves-domain-${domId}`,
						source_id: eventNodeId,
						destination_id: domNodeId,
						label: 'event_involves_domain',
						properties: { mark },
						created_at: ts,
						updated_at: ts
					});
				}
			}
		}

		// Concept marks
		for (const [conceptId, mark] of Object.entries(ev.concepts)) {
			if (mark) {
				const conceptNodeId = conceptIdMap.get(conceptId);
				if (conceptNodeId) {
					links.push({
						id: `link-${m.id}-${ev.id}-involves-concept-${conceptId}`,
						source_id: eventNodeId,
						destination_id: conceptNodeId,
						label: 'event_involves_concept',
						properties: { mark },
						created_at: ts,
						updated_at: ts
					});
				}
			}
		}
	}

	return { nodes, links };
}

/**
 * Convert Context Plane nodes + links back to a DomainModel.
 * Accepts both old (has_dimension, event_involves_dimension, bem_dimension)
 * and new (has_concept, event_involves_concept, global_concept) names.
 */
export function contextPlaneToBem(
	data: { nodes: ContextNode[]; links: ContextLink[] }
): DomainModel {
	const { nodes, links } = data;

	const modelNode = nodes.find((n) => n.label === 'bem_model');
	if (!modelNode) {
		return { version: '1.0', id: 'empty', name: 'New Model', description: '', domains: [], concepts: [], events: [] };
	}

	// Domains
	const domainLinks = links.filter((l) => l.source_id === modelNode.id && l.label === 'has_domain');
	const domainNodeIds = new Set(domainLinks.map((l) => l.destination_id));
	const domainNodes = nodes
		.filter((n) => domainNodeIds.has(n.id) && n.label === 'bem_domain')
		.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

	const domains = domainNodes.map((n) => ({
		id: (n.properties?.sourceId as string) || n.id,
		name: n.name,
		description: n.description || '',
		aliases: (n.properties?.aliases as string[]) || [],
		owner: (n.properties?.owner as string) || '',
		order: (n.properties?.order as number) || 0,
		notes: (n.properties?.notes as string) || ''
	}));

	// Build nodeId → sourceId map for marks
	const domainNodeToSourceId = new Map<string, string>();
	for (const n of domainNodes) {
		domainNodeToSourceId.set(n.id, (n.properties?.sourceId as string) || n.id);
	}

	// Concepts (accept both old bem_dimension and new global_concept labels, plus has_concept and has_dimension links)
	const conceptLinkLabels = new Set(['has_concept', 'has_dimension']);
	const conceptLinks = links.filter((l) => l.source_id === modelNode.id && conceptLinkLabels.has(l.label));
	const conceptNodeIds = new Set(conceptLinks.map((l) => l.destination_id));
	const conceptNodes = nodes
		.filter((n) => conceptNodeIds.has(n.id) && (n.label === 'bem_dimension' || n.label === 'global_concept' || n.label?.includes('bem_dimension') || n.label?.includes('global_concept')))
		.sort((a, b) => ((a.properties?.order as number) || 0) - ((b.properties?.order as number) || 0));

	const concepts = conceptNodes.map((n) => ({
		id: (n.properties?.sourceId as string) || n.id,
		name: n.name,
		description: n.description || '',
		aliases: (n.properties?.aliases as string[]) || [],
		w: ((n.properties?.w as string) || (n.properties?.wType as string) || 'who') as any,
		order: (n.properties?.order as number) || 0,
		notes: (n.properties?.notes as string) || '',
		definitionCategory: (n.properties?.definitionCategory as string) || undefined,
		definitionDifferentiator: (n.properties?.definitionDifferentiator as string) || undefined
	}));

	const conceptNodeToSourceId = new Map<string, string>();
	for (const n of conceptNodes) {
		conceptNodeToSourceId.set(n.id, (n.properties?.sourceId as string) || n.id);
	}

	// Events
	const eventLinks = links.filter((l) => l.source_id === modelNode.id && l.label === 'has_event');
	const eventNodeIds = new Set(eventLinks.map((l) => l.destination_id));
	const eventNodes = nodes
		.filter((n) => eventNodeIds.has(n.id) && n.label === 'bem_event')
		.sort((a, b) => ((a.properties?.order as number) || 0) - ((b.properties?.order as number) || 0));

	const events = eventNodes.map((evNode) => {
		// Domain marks
		const domainMarkLinks = links.filter((l) => l.source_id === evNode.id && l.label === 'event_involves_domain');
		const domainMarks: Record<string, EventDimensionMark> = {};
		for (const link of domainMarkLinks) {
			const sourceId = domainNodeToSourceId.get(link.destination_id) || link.destination_id;
			domainMarks[sourceId] = (link.properties?.mark as EventDimensionMark) || '';
		}

		// Concept marks (accept both old event_involves_dimension and new event_involves_concept)
		const conceptMarkLinks = links.filter((l) => l.source_id === evNode.id && (l.label === 'event_involves_concept' || l.label === 'event_involves_dimension'));
		const conceptMarks: Record<string, EventDimensionMark> = {};
		for (const link of conceptMarkLinks) {
			const sourceId = conceptNodeToSourceId.get(link.destination_id) || link.destination_id;
			conceptMarks[sourceId] = (link.properties?.mark as EventDimensionMark) || '';
		}

		return {
			id: (evNode.properties?.sourceId as string) || evNode.id,
			name: evNode.name,
			description: evNode.description || '',
			order: (evNode.properties?.order as number) || 0,
			importance: (evNode.properties?.importance as number) || 0,
			estimate: (evNode.properties?.estimate as number) || 0,
			concepts: conceptMarks,
			domains: domainMarks
		};
	});

	return {
		version: (modelNode.properties?.version as string) || '1.0',
		id: modelNode.id,
		name: modelNode.name,
		description: modelNode.description || '',
		domains,
		concepts,
		events
	};
}
