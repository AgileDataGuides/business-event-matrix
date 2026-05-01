import type { DataAdapter, ContextNode, ContextLink } from '$lib/cp-shared';
import type { DomainModel, EventDimensionMark } from '$lib/types';

function createId(): string {
	const rand = typeof crypto !== 'undefined' && crypto.randomUUID
		? crypto.randomUUID().slice(0, 8)
		: Math.random().toString(36).slice(2, 10);
	return `node-${rand}`;
}

function now(): string {
	return new Date().toISOString();
}

/**
 * BemJsonAdapter — implements DataAdapter by storing BEM data as
 * ContextNode/ContextLink in memory.
 *
 * Node types:
 * - bem_model: one per domain model (properties: { version, description })
 * - bem_domain: one per domain (properties: { order, aliases, owner })
 * - global_concept: one per concept (properties: { w, order, aliases })
 * - bem_event: one per event (properties: { order, importance, estimate })
 *
 * Link types:
 * - has_domain: model → domain
 * - has_event: model → event
 * - has_concept: model → concept
 * - event_involves_domain: event → domain (properties: { mark: "check"|"star" })
 * - event_involves_concept: event → concept (properties: { mark: "check"|"star" })
 */
export class BemJsonAdapter implements DataAdapter {
	private nodes: ContextNode[] = [];
	private links: ContextLink[] = [];

	async getNodes(filter?: { label?: string }): Promise<ContextNode[]> {
		if (!filter?.label) return [...this.nodes];
		return this.nodes.filter((n) => n.label === filter.label);
	}

	async getNode(id: string): Promise<ContextNode | null> {
		return this.nodes.find((n) => n.id === id) ?? null;
	}

	async createNode(
		node: Omit<ContextNode, 'id' | 'created_at' | 'updated_at'>
	): Promise<ContextNode> {
		const newNode: ContextNode = {
			...node,
			id: createId(),
			created_at: now(),
			updated_at: now()
		};
		this.nodes.push(newNode);
		return newNode;
	}

	async updateNode(id: string, updates: Partial<ContextNode>): Promise<ContextNode> {
		const idx = this.nodes.findIndex((n) => n.id === id);
		if (idx === -1) throw new Error(`Node ${id} not found`);
		this.nodes[idx] = { ...this.nodes[idx], ...updates, updated_at: now() };
		return this.nodes[idx];
	}

	async deleteNode(id: string): Promise<void> {
		this.nodes = this.nodes.filter((n) => n.id !== id);
		this.links = this.links.filter((l) => l.source_id !== id && l.destination_id !== id);
	}

	async getLinks(filter?: {
		label?: string;
		source_id?: string;
		destination_id?: string;
	}): Promise<ContextLink[]> {
		let result = [...this.links];
		if (filter?.label) result = result.filter((l) => l.label === filter.label);
		if (filter?.source_id) result = result.filter((l) => l.source_id === filter.source_id);
		if (filter?.destination_id)
			result = result.filter((l) => l.destination_id === filter.destination_id);
		return result;
	}

	async createLink(
		link: Omit<ContextLink, 'id' | 'created_at' | 'updated_at'>
	): Promise<ContextLink> {
		const newLink: ContextLink = {
			...link,
			id: createId(),
			created_at: now(),
			updated_at: now()
		};
		this.links.push(newLink);
		return newLink;
	}

	async deleteLink(id: string): Promise<void> {
		this.links = this.links.filter((l) => l.id !== id);
	}

	async exportAll(): Promise<{ nodes: ContextNode[]; links: ContextLink[] }> {
		return { nodes: [...this.nodes], links: [...this.links] };
	}

	async importAll(data: { nodes: ContextNode[]; links: ContextLink[] }): Promise<void> {
		this.nodes = [...data.nodes];
		this.links = [...data.links];
	}

	// --- BEM-specific helpers ---

	/** Load a DomainModel and populate the adapter's node/link storage */
	loadFromDomainModel(m: DomainModel): void {
		this.nodes = [];
		this.links = [];

		const ts = now();

		// Model node
		const modelNode: ContextNode = {
			id: `bem-model-${m.id}`,
			label: 'bem_model',
			name: m.name,
			description: m.description,
			properties: { version: m.version },
			created_at: ts,
			updated_at: ts
		};
		this.nodes.push(modelNode);

		// Domain nodes + has_domain links
		const domainIdMap = new Map<string, string>();
		for (const dom of m.domains || []) {
			const nodeId = `bem-domain-${m.id}-${dom.id}`;
			domainIdMap.set(dom.id, nodeId);
			this.nodes.push({
				id: nodeId,
				label: 'bem_domain',
				name: dom.name,
				description: dom.description,
				properties: { order: dom.order, aliases: dom.aliases, owner: dom.owner },
				created_at: ts,
				updated_at: ts
			});
			this.links.push({
				id: `link-${modelNode.id}-${nodeId}`,
				source_id: modelNode.id,
				destination_id: nodeId,
				label: 'has_domain',
				created_at: ts,
				updated_at: ts
			});
		}

		// Concept nodes + has_concept links
		const dimIdMap = new Map<string, string>();
		for (const dim of m.concepts) {
			const nodeId = `bem-dim-${m.id}-${dim.id}`;
			dimIdMap.set(dim.id, nodeId);
			this.nodes.push({
				id: nodeId,
				label: 'global_concept',
				name: dim.name,
				description: dim.description,
				properties: { w: dim.w, order: dim.order, aliases: dim.aliases },
				created_at: ts,
				updated_at: ts
			});
			this.links.push({
				id: `link-${modelNode.id}-${nodeId}`,
				source_id: modelNode.id,
				destination_id: nodeId,
				label: 'has_concept',
				created_at: ts,
				updated_at: ts
			});
		}

		// Event nodes + has_event links + mark links
		for (const ev of m.events) {
			const eventNodeId = `bem-event-${m.id}-${ev.id}`;
			this.nodes.push({
				id: eventNodeId,
				label: 'bem_event',
				name: ev.name,
				description: ev.description,
				properties: { order: ev.order, importance: ev.importance, estimate: ev.estimate },
				created_at: ts,
				updated_at: ts
			});
			this.links.push({
				id: `link-${modelNode.id}-${eventNodeId}`,
				source_id: modelNode.id,
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
						this.links.push({
							id: `link-${eventNodeId}-${domNodeId}`,
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
			for (const [dimId, mark] of Object.entries(ev.concepts)) {
				if (mark) {
					const dimNodeId = dimIdMap.get(dimId);
					if (dimNodeId) {
						this.links.push({
							id: `link-${eventNodeId}-${dimNodeId}`,
							source_id: eventNodeId,
							destination_id: dimNodeId,
							label: 'event_involves_concept',
							properties: { mark },
							created_at: ts,
							updated_at: ts
						});
					}
				}
			}
		}
	}

	/** Reconstruct a DomainModel from the adapter's nodes/links */
	toDomainModel(): DomainModel {
		const modelNode = this.nodes.find((n) => n.label === 'bem_model');
		if (!modelNode) {
			return {
				version: '1.0',
				id: 'empty',
				name: 'New Model',
				description: '',
				domains: [],
				concepts: [],
				events: []
			};
		}

		// Domains
		const domainLinks = this.links.filter(
			(l) => l.source_id === modelNode.id && l.label === 'has_domain'
		);
		const domainNodeIds = new Set(domainLinks.map((l) => l.destination_id));
		const domainNodes = this.nodes
			.filter((n) => domainNodeIds.has(n.id) && n.label === 'bem_domain')
			.sort((a, b) => ((a.properties?.order as number) || 0) - ((b.properties?.order as number) || 0));

		const domains = domainNodes.map((n) => ({
			id: n.id,
			name: n.name,
			description: n.description || '',
			aliases: (n.properties?.aliases as string[]) || [],
			owner: (n.properties?.owner as string) || '',
			order: (n.properties?.order as number) || 0
		}));

		// Concepts
		const dimLinks = this.links.filter(
			(l) => l.source_id === modelNode.id && l.label === 'has_concept'
		);
		const dimNodeIds = new Set(dimLinks.map((l) => l.destination_id));
		const dimNodes = this.nodes
			.filter((n) => dimNodeIds.has(n.id) && n.label === 'global_concept')
			.sort((a, b) => ((a.properties?.order as number) || 0) - ((b.properties?.order as number) || 0));

		const concepts = dimNodes.map((n) => ({
			id: n.id,
			name: n.name,
			description: n.description || '',
			aliases: (n.properties?.aliases as string[]) || [],
			w: (n.properties?.w as string) || 'who',
			order: (n.properties?.order as number) || 0
		}));

		// Events
		const eventLinks = this.links.filter(
			(l) => l.source_id === modelNode.id && l.label === 'has_event'
		);
		const eventNodeIds = new Set(eventLinks.map((l) => l.destination_id));
		const eventNodes = this.nodes
			.filter((n) => eventNodeIds.has(n.id) && n.label === 'bem_event')
			.sort((a, b) => ((a.properties?.order as number) || 0) - ((b.properties?.order as number) || 0));

		const events = eventNodes.map((n) => {
			// Collect domain marks
			const domainMarkLinks = this.links.filter(
				(l) => l.source_id === n.id && l.label === 'event_involves_domain'
			);
			const domainMarks: Record<string, EventDimensionMark> = {};
			for (const link of domainMarkLinks) {
				domainMarks[link.destination_id] = (link.properties?.mark as EventDimensionMark) || '';
			}

			// Collect concept marks
			const dimMarkLinks = this.links.filter(
				(l) => l.source_id === n.id && l.label === 'event_involves_concept'
			);
			const conceptMarks: Record<string, EventDimensionMark> = {};
			for (const link of dimMarkLinks) {
				conceptMarks[link.destination_id] = (link.properties?.mark as EventDimensionMark) || '';
			}

			return {
				id: n.id,
				name: n.name,
				description: n.description || '',
				order: (n.properties?.order as number) || 0,
				importance: (n.properties?.importance as number) || 0,
				estimate: (n.properties?.estimate as number) || 0,
				concepts: conceptMarks,
				domains: domainMarks
			};
		});

		return {
			version: (modelNode.properties?.version as string) || '1.0',
			id: modelNode.id,
			name: modelNode.name,
			description: modelNode.description || '',
			domains: domains as any,
			concepts: concepts as any,
			events
		};
	}
}
