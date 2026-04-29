/**
 * Standalone DataAdapter for the BEM app.
 *
 * Wraps the BEM store (DomainModel-based) behind the flat ContextNode/ContextLink
 * DataAdapter interface. The layout component talks exclusively through this adapter;
 * the adapter translates every CRUD call into the corresponding BEM store mutation
 * and keeps an in-memory mirror of ContextNode[]/ContextLink[] in sync.
 *
 * On every mutation the adapter also calls store.saveModel() so changes persist.
 */

import type { DataAdapter, ContextNode, ContextLink } from '$lib/types/shared';
import type { BemStore } from '$lib/stores/domain.svelte';
import { bemToContextPlane, contextPlaneToBem } from '$lib/converters/context-plane';

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
 * Create a DataAdapter backed by the BEM store.
 *
 * The adapter keeps a reactive snapshot of nodes/links derived from the store's
 * DomainModel. Mutations go through the store API, then the snapshot is refreshed.
 */
export function createStandaloneAdapter(store: BemStore): {
	adapter: DataAdapter;
	/** Call this to get the current nodes (reactive — call inside $derived) */
	getNodes: () => ContextNode[];
	/** Call this to get the current links (reactive — call inside $derived) */
	getLinks: () => ContextLink[];
} {
	// We keep a mutable cache that is rebuilt after every mutation.
	let cachedNodes: ContextNode[] = [];
	let cachedLinks: ContextLink[] = [];

	function refresh() {
		const model = store.getModel();
		const { nodes, links } = bemToContextPlane(model);
		cachedNodes = nodes;
		cachedLinks = links;
	}

	// Initial build
	refresh();

	const adapter: DataAdapter = {
		async getNodes(filter) {
			refresh();
			if (filter?.label) {
				return cachedNodes.filter((n) => n.label === filter.label);
			}
			return cachedNodes;
		},

		async getNode(id) {
			refresh();
			return cachedNodes.find((n) => n.id === id) ?? null;
		},

		async createNode(input) {
			const ts = now();
			const label = input.label;
			const name = input.name;

			if (label === 'bem_model') {
				await store.newModel(name);
				refresh();
				const created = cachedNodes.find((n) => n.label === 'bem_model' && n.name === name);
				return created ?? { id: createId('node'), label, name, created_at: ts, updated_at: ts };
			}

			if (label === 'bem_event') {
				store.addEvent(name);
				await store.saveModel();
				refresh();
				const created = cachedNodes.find((n) => n.label === 'bem_event' && n.name === name);
				return created ?? { id: createId('node'), label, name, properties: input.properties, created_at: ts, updated_at: ts };
			}

			if (label === 'bem_domain') {
				store.addDomain(name);
				await store.saveModel();
				refresh();
				const created = cachedNodes.find((n) => n.label === 'bem_domain' && n.name === name);
				return created ?? { id: createId('node'), label, name, properties: input.properties, created_at: ts, updated_at: ts };
			}

			if (label.includes('global_concept') || label === 'bem_dimension') {
				const w = (input.properties?.w as string) || 'who';
				store.addConcept(name, w as any);
				await store.saveModel();
				refresh();
				const created = cachedNodes.find((n) => (n.label.includes('global_concept') || n.label === 'bem_dimension') && n.name === name);
				return created ?? { id: createId('node'), label, name, properties: input.properties, created_at: ts, updated_at: ts };
			}

			// Fallback — unknown label
			const node: ContextNode = { id: createId('node'), ...input, created_at: ts, updated_at: ts };
			return node;
		},

		async updateNode(id, updates) {
			refresh();
			const existing = cachedNodes.find((n) => n.id === id);
			if (!existing) return { id, label: updates.label ?? '', name: updates.name ?? '', updated_at: now() };

			const sourceId = (existing.properties?.sourceId as string) || existing.id;

			if (existing.label === 'bem_event') {
				const evUpdates: Record<string, any> = {};
				if (updates.name) evUpdates.name = updates.name;
				if (updates.description !== undefined) evUpdates.description = updates.description;
				if (updates.properties?.order !== undefined) evUpdates.order = updates.properties.order;
				if (Object.keys(evUpdates).length > 0) store.updateEvent(sourceId, evUpdates);
				await store.saveModel();
				refresh();
			} else if (existing.label === 'bem_domain') {
				const domUpdates: Record<string, any> = {};
				if (updates.name) domUpdates.name = updates.name;
				if (updates.description !== undefined) domUpdates.description = updates.description;
				if (updates.properties?.aliases !== undefined) domUpdates.aliases = updates.properties.aliases;
				if (updates.properties?.owner !== undefined) domUpdates.owner = updates.properties.owner;
				if (updates.properties?.notes !== undefined) domUpdates.notes = updates.properties.notes;
				if (updates.properties?.order !== undefined) domUpdates.order = updates.properties.order;
				if (Object.keys(domUpdates).length > 0) store.updateDomain(sourceId, domUpdates);
				await store.saveModel();
				refresh();
			} else if (existing.label.includes('global_concept') || existing.label === 'bem_dimension') {
				const dimUpdates: Record<string, any> = {};
				if (updates.name) dimUpdates.name = updates.name;
				if (updates.description !== undefined) dimUpdates.description = updates.description;
				if (updates.properties?.w) dimUpdates.w = updates.properties.w;
				if (updates.properties?.aliases !== undefined) dimUpdates.aliases = updates.properties.aliases;
				if (updates.properties?.notes !== undefined) dimUpdates.notes = updates.properties.notes;
				if (updates.properties?.order !== undefined) dimUpdates.order = updates.properties.order;
				if (updates.properties?.definitionCategory !== undefined) dimUpdates.definitionCategory = updates.properties.definitionCategory;
				if (updates.properties?.definitionDifferentiator !== undefined) dimUpdates.definitionDifferentiator = updates.properties.definitionDifferentiator;
				if (Object.keys(dimUpdates).length > 0) store.updateConcept(sourceId, dimUpdates);
				await store.saveModel();
				refresh();
			} else if (existing.label === 'bem_model') {
				if (updates.name) store.renameModel(updates.name);
				if (updates.description !== undefined) store.updateDescription(updates.description || '');
				await store.saveModel();
				refresh();
			}

			return cachedNodes.find((n) => n.id === id) ?? { ...existing, ...updates, updated_at: now() };
		},

		async deleteNode(id) {
			refresh();
			const existing = cachedNodes.find((n) => n.id === id);
			if (!existing) return;

			const sourceId = (existing.properties?.sourceId as string) || existing.id;

			if (existing.label === 'bem_event') {
				store.removeEvent(sourceId);
			} else if (existing.label === 'bem_domain') {
				store.removeDomain(sourceId);
			} else if (existing.label.includes('global_concept') || existing.label === 'bem_dimension') {
				store.removeConcept(sourceId);
			} else if (existing.label === 'bem_model') {
				await store.deleteModel(existing.id);
			}

			await store.saveModel();
			refresh();
		},

		async getLinks(filter) {
			refresh();
			let result = cachedLinks;
			if (filter?.label) result = result.filter((l) => l.label === filter.label);
			if (filter?.source_id) result = result.filter((l) => l.source_id === filter.source_id);
			if (filter?.destination_id) result = result.filter((l) => l.destination_id === filter.destination_id);
			return result;
		},

		async createLink(input) {
			const ts = now();

			// Mark links: event_involves_domain or event_involves_concept
			if (input.label === 'event_involves_domain') {
				const eventNode = cachedNodes.find((n) => n.id === input.source_id);
				const domainNode = cachedNodes.find((n) => n.id === input.destination_id);
				if (eventNode && domainNode) {
					const eventSourceId = (eventNode.properties?.sourceId as string) || eventNode.id;
					const domainSourceId = (domainNode.properties?.sourceId as string) || domainNode.id;
					const mark = (input.properties?.mark as string) || 'check';
					// We need to set the mark directly. The store's toggleDomainMark cycles,
					// so we use the model directly via setMark-like approach.
					// The BEM store doesn't have setDomainMark, so we toggle until we hit the right state.
					const model = store.getModel();
					const ev = model.events.find((e) => e.id === eventSourceId);
					if (ev) {
						if (!ev.domains) ev.domains = {};
						ev.domains[domainSourceId] = mark as any;
					}
					await store.saveModel();
					refresh();
				}
				const link: ContextLink = { id: createId('link'), ...input, created_at: ts, updated_at: ts };
				return cachedLinks.find((l) =>
					l.source_id === input.source_id &&
					l.destination_id === input.destination_id &&
					l.label === input.label
				) ?? link;
			}

			if (input.label === 'event_involves_concept' || input.label === 'event_involves_dimension') {
				const eventNode = cachedNodes.find((n) => n.id === input.source_id);
				const dimNode = cachedNodes.find((n) => n.id === input.destination_id);
				if (eventNode && dimNode) {
					const eventSourceId = (eventNode.properties?.sourceId as string) || eventNode.id;
					const dimSourceId = (dimNode.properties?.sourceId as string) || dimNode.id;
					const mark = (input.properties?.mark as string) || 'check';
					store.setMark(eventSourceId, dimSourceId, mark as any);
					await store.saveModel();
					refresh();
				}
				const link: ContextLink = { id: createId('link'), ...input, created_at: ts, updated_at: ts };
				return cachedLinks.find((l) =>
					l.source_id === input.source_id &&
					l.destination_id === input.destination_id &&
					l.label === input.label
				) ?? link;
			}

			// Structural links (has_event, has_domain, has_concept) are already created
			// by createNode — the BEM store auto-adds entities to the current model.
			// Just return a synthetic link.
			const link: ContextLink = { id: createId('link'), ...input, created_at: ts, updated_at: ts };
			refresh();
			return cachedLinks.find((l) =>
				l.source_id === input.source_id &&
				l.destination_id === input.destination_id &&
				l.label === input.label
			) ?? link;
		},

		async deleteLink(id) {
			refresh();
			const link = cachedLinks.find((l) => l.id === id);
			if (!link) return;

			if (link.label === 'event_involves_domain') {
				const eventNode = cachedNodes.find((n) => n.id === link.source_id);
				const domainNode = cachedNodes.find((n) => n.id === link.destination_id);
				if (eventNode && domainNode) {
					const eventSourceId = (eventNode.properties?.sourceId as string) || eventNode.id;
					const domainSourceId = (domainNode.properties?.sourceId as string) || domainNode.id;
					const model = store.getModel();
					const ev = model.events.find((e) => e.id === eventSourceId);
					if (ev && ev.domains) {
						delete ev.domains[domainSourceId];
					}
					await store.saveModel();
					refresh();
				}
				return;
			}

			if (link.label === 'event_involves_concept' || link.label === 'event_involves_dimension') {
				const eventNode = cachedNodes.find((n) => n.id === link.source_id);
				const dimNode = cachedNodes.find((n) => n.id === link.destination_id);
				if (eventNode && dimNode) {
					const eventSourceId = (eventNode.properties?.sourceId as string) || eventNode.id;
					const dimSourceId = (dimNode.properties?.sourceId as string) || dimNode.id;
					const model = store.getModel(); const ev = model.events.find((e) => e.id === eventSourceId); if (ev) { delete ev.concepts[dimSourceId]; }
					await store.saveModel();
					refresh();
				}
				return;
			}

			// Structural links — deletion of has_event/has_domain/has_concept
			// is handled by deleteNode, so nothing extra needed here.
			refresh();
		},

		async exportAll() {
			refresh();
			return { nodes: [...cachedNodes], links: [...cachedLinks] };
		},

		async importAll(data) {
			const model = contextPlaneToBem(data);
			// Import as a new model
			const json = JSON.stringify(model, null, 2);
			await store.importJSON(json);
			refresh();
		}
	};

	return {
		adapter,
		getNodes: () => {
			refresh();
			return cachedNodes;
		},
		getLinks: () => {
			refresh();
			return cachedLinks;
		}
	};
}
