<script lang="ts">
	/**
	 * BusinessEventMatrixLayout — renders the Business Event Matrix as a canvas.
	 * This is the single source of truth component, used by both the standalone
	 * BEM app and the Context Plane (embedded via package export).
	 *
	 * Marks (check/star) are stored as properties on event_involves_domain and
	 * event_involves_concept links, following the mark-as-link-properties pattern.
	 */
	import { getContext } from 'svelte';
	import type { DataAdapter, ContextNode, ContextLink } from '$lib/types/shared';
	import { getNodeLabels } from '$lib/types/shared';

	// W constants (duplicated from BEM app to avoid cross-app import)
	type W = 'who' | 'what' | 'when' | 'where' | 'why' | 'how' | 'how many';
	const WS: W[] = ['who', 'what', 'when', 'where', 'why', 'how', 'how many'];
	const W_LABELS: Record<W, string> = { 'who': 'Who', 'what': 'What', 'when': 'When', 'where': 'Where', 'why': 'Why', 'how': 'How', 'how many': 'How Many' };
	const W_COLORS: Record<W, string> = { 'who': '#16a34a', 'what': '#2563eb', 'when': '#d97706', 'where': '#0891b2', 'why': '#a855f7', 'how': '#6b7280', 'how many': '#f97316' };
	const W_BG: Record<W, string> = { 'who': '#f0fdf4', 'what': '#eff6ff', 'when': '#fffbeb', 'where': '#ecfeff', 'why': '#faf5ff', 'how': '#f9fafb', 'how many': '#fff7ed' };
	const W_BORDER: Record<W, string> = { 'who': '#bbf7d0', 'what': '#bfdbfe', 'when': '#fde68a', 'where': '#a5f3fc', 'why': '#e9d5ff', 'how': '#e5e7eb', 'how many': '#fed7aa' };
	const DOMAIN_COLOR = '#7c3aed';
	const DOMAIN_BG = '#f5f3ff';
	const DOMAIN_BORDER = '#ddd6fe';

	type EventConceptMark = '' | 'check' | 'star';

	let {
		nodes,
		links,
		onSelectNode,
		onAddNode,
		onAddExisting,
		showModelSelector = true,
		showSwitcher,
		showToolbar = true,
		showTabs = true,
		controlledModelId,
		onModelListChange,
		conceptEntityLabel = 'global_concept',
		onExportJson,
		onImportJson,
		onExportPdf,
		onExportCsv,
		onExportXlsx
	}: {
		nodes: ContextNode[];
		links: ContextLink[];
		onSelectNode: (id: string) => void;
		onAddNode: (entityLabel: string, name: string) => void;
		onAddExisting?: (entityLabel: string) => void;
		showModelSelector?: boolean;
		showSwitcher?: boolean;
		showToolbar?: boolean;
		showTabs?: boolean;
		controlledModelId?: string | null;
		onModelListChange?: (models: { id: string; name: string }[], selectedId: string | null) => void;
		conceptEntityLabel?: string;
		onExportJson?: (matrixName: string) => void;
		onImportJson?: () => Promise<void>;
		onExportPdf?: () => Promise<void>;
		onExportCsv?: () => void;
		onExportXlsx?: () => void;
	} = $props();

	// Backward-compat: legacy showModelSelector maps to showSwitcher when showSwitcher not explicitly set
	const effectiveShowSwitcher = $derived(showSwitcher ?? showModelSelector);

	let importing = $state(false);
	let exportingPdf = $state(false);

	const adapter = getContext<DataAdapter>('dataAdapter');

	// ── Derived: find BEM model nodes ──
	const modelNodes = $derived(nodes.filter((n) => getNodeLabels(n).includes('bem_model')));
	let selectedModelId = $state<string | null>(null);

	$effect(() => {
		if (controlledModelId !== undefined && controlledModelId !== null) {
			selectedModelId = controlledModelId;
		} else if (modelNodes.length > 0 && (!selectedModelId || !modelNodes.find((n) => n.id === selectedModelId))) {
			selectedModelId = modelNodes[0].id;
		}
	});

	// Notify parent of model list changes (for CP sidebar switcher)
	$effect(() => {
		if (onModelListChange) {
			const models = modelNodes.map((n) => ({ id: n.id, name: n.name }));
			onModelListChange(models, selectedModelId);
		}
	});

	const selectedModel = $derived(modelNodes.find((n) => n.id === selectedModelId) ?? null);

	// Get domain nodes linked to the selected model
	const domainLinks = $derived(
		selectedModelId ? links.filter((l) => l.source_id === selectedModelId && l.label === 'has_domain') : []
	);
	const domainNodeIds = $derived(new Set(domainLinks.map((l) => l.destination_id)));
	const domainNodes = $derived(
		nodes
			.filter((n) => domainNodeIds.has(n.id) && getNodeLabels(n).includes('bem_domain'))
			.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
	);

	// Get concept nodes linked to the selected model
	const conceptLinks = $derived(
		selectedModelId ? links.filter((l) => l.source_id === selectedModelId && (l.label === 'has_concept' || l.label === 'has_dimension')) : []
	);
	const conceptNodeIds = $derived(new Set(conceptLinks.map((l) => l.destination_id)));
	const conceptNodes = $derived(
		nodes
			.filter((n) => conceptNodeIds.has(n.id) && getNodeLabels(n).includes(conceptEntityLabel))
			.sort((a, b) => a.name.localeCompare(b.name))
	);

	// Get event nodes linked to the selected model
	const eventLinks = $derived(
		selectedModelId ? links.filter((l) => l.source_id === selectedModelId && l.label === 'has_event') : []
	);
	const eventNodeIds = $derived(new Set(eventLinks.map((l) => l.destination_id)));
	const eventNodes = $derived(
		nodes
			.filter((n) => {
				if (!eventNodeIds.has(n.id)) return false;
				const labels = getNodeLabels(n);
				return labels.includes('bem_event') || labels.includes('global_core_business_event');
			})
			.sort((a, b) => ((a.properties?.order as number) || 0) - ((b.properties?.order as number) || 0) || (a.name || '').localeCompare(b.name || ''))
	);

	// ── Search filters ──
	let eventSearchQuery = $state('');
	let domainSearchQuery = $state('');
	let conceptSearchQuery = $state('');

	// "Hide unmarked" toggle — when on, hide concept columns with no ✓/✭ from
	// any visible event, hide domain columns with no ✓/✭ from any visible
	// event, and hide event rows with no ✓/✭ to any visible concept or domain.
	// "Visible" here = post-search-filter (search filters drive what counts as
	// the universe; the toggle then prunes empty axes from that universe).
	let hideUnmarked = $state(false);

	const filteredEventNodes = $derived.by(() => {
		const q = eventSearchQuery.toLowerCase().trim();
		if (!q) return eventNodes;
		return eventNodes.filter((n) => n.name.toLowerCase().includes(q));
	});
	const filteredDomainNodes = $derived.by(() => {
		const q = domainSearchQuery.toLowerCase().trim();
		if (!q) return domainNodes;
		return domainNodes.filter((n) => n.name.toLowerCase().includes(q));
	});
	const filteredConceptNodes = $derived.by(() => {
		const q = conceptSearchQuery.toLowerCase().trim();
		if (!q) return conceptNodes;
		return conceptNodes.filter((n) => n.name.toLowerCase().includes(q));
	});

	// ── Collapsible groups ──
	let collapsedDomains = $state(false);
	let collapsedWs = $state<Set<W>>(new Set());

	function toggleCollapseDomains() {
		collapsedDomains = !collapsedDomains;
	}

	function toggleCollapseW(wt: W) {
		const next = new Set(collapsedWs);
		if (next.has(wt)) next.delete(wt);
		else next.add(wt);
		collapsedWs = next;
	}

	// ── Drag-and-drop reordering ──
	let dragType = $state<'event' | 'domain' | 'concept' | null>(null);
	let dragId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);
	let dropPosition = $state<'before' | 'after'>('before');

	function clearDragState() {
		dragType = null;
		dragId = null;
		dropTargetId = null;
		dropPosition = 'before';
	}

	function handleDragStart(e: DragEvent, type: 'event' | 'domain' | 'concept', id: string) {
		dragType = type;
		dragId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', id);
		}
	}

	function handleDragOverRow(e: DragEvent, targetId: string) {
		if (dragType !== 'event' || dragId === targetId) return;
		e.preventDefault();
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		dropPosition = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
		dropTargetId = targetId;
	}

	function handleDragOverCol(e: DragEvent, targetId: string, allowedType: 'domain' | 'concept', targetW?: string) {
		if (dragType !== allowedType || dragId === targetId) return;
		// For concepts, only allow within same W group
		if (allowedType === 'concept' && targetW) {
			const dragNode = nodes.find((n) => n.id === dragId);
			if (dragNode && (dragNode.properties?.w as string) !== targetW) return;
		}
		e.preventDefault();
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		dropPosition = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
		dropTargetId = targetId;
	}

	async function handleDrop(e: DragEvent, items: ContextNode[]) {
		e.preventDefault();
		if (!dragId || !dropTargetId || dragId === dropTargetId) { clearDragState(); return; }
		const sorted = [...items];
		const dragIdx = sorted.findIndex((n) => n.id === dragId);
		let dropIdx = sorted.findIndex((n) => n.id === dropTargetId);
		if (dragIdx === -1 || dropIdx === -1) { clearDragState(); return; }
		const [moved] = sorted.splice(dragIdx, 1);
		// Recalculate dropIdx after removal
		dropIdx = sorted.findIndex((n) => n.id === dropTargetId);
		const insertIdx = dropPosition === 'after' ? dropIdx + 1 : dropIdx;
		sorted.splice(insertIdx, 0, moved);
		// Update order for all items
		for (let i = 0; i < sorted.length; i++) {
			const node = sorted[i];
			const newOrder = i + 1;
			if ((node.properties?.order as number) !== newOrder) {
				await adapter.updateNode(node.id, { properties: { ...node.properties, order: newOrder } });
			}
		}
		clearDragState();
	}

	async function handleConceptDrop(e: DragEvent) {
		e.preventDefault();
		if (!dragId || !dropTargetId || dragId === dropTargetId || dragType !== 'concept') { clearDragState(); return; }
		const dragNode = nodes.find((n) => n.id === dragId);
		if (!dragNode) { clearDragState(); return; }
		const w = (dragNode.properties?.w as string) || 'who';
		// Get only concepts in the same W group, sorted by current order
		const group = conceptNodes
			.filter((n) => (n.properties?.w as string) === w)
			.sort((a, b) => ((a.properties?.order as number) || 0) - ((b.properties?.order as number) || 0));
		await handleDrop(e, group);
	}

		// ── Mark lookup from links ──
	// Build maps: eventId -> domainId -> mark, eventId -> dimId -> mark
	const domainMarkLinks = $derived(links.filter((l) => l.label === 'event_involves_domain'));
	const conceptMarkLinks = $derived(links.filter((l) => l.label === 'event_involves_concept' || l.label === 'event_involves_dimension'));

	// ── Marked-axis sets (for the "Hide unmarked" toggle) ──
	// A mark is a check or star on the link's properties.mark; empty/null means
	// the cell is blank. Computed against the search-filtered axes so the
	// toggle prunes only what's currently visible.
	function isMarked(mark: unknown): boolean {
		return mark === 'check' || mark === 'star';
	}
	const filteredDomainIds = $derived(new Set(filteredDomainNodes.map((n) => n.id)));
	const filteredConceptIds = $derived(new Set(filteredConceptNodes.map((n) => n.id)));

	// Filter activity flags — drives AND semantics in markedEventIds.
	const conceptFilterActive = $derived(conceptSearchQuery.trim().length > 0);
	const domainFilterActive = $derived(domainSearchQuery.trim().length > 0);

	// Events that should be visible when toggle is ON.
	// AND-semantics across active axis filters: a concept search "Customer" forces
	// each event to mark a visible concept; a domain search "Sales" forces each
	// event to mark a visible domain; both active = both required. With no axis
	// filter active, we only require any mark anywhere (so 0-mark events hide).
	const markedEventIds = $derived.by(() => {
		const ids = new Set<string>();
		for (const ev of filteredEventNodes) {
			if (conceptFilterActive) {
				const ok = conceptMarkLinks.some(
					(l) => l.source_id === ev.id && filteredConceptIds.has(l.destination_id) && isMarked(l.properties?.mark)
				);
				if (!ok) continue;
			}
			if (domainFilterActive) {
				const ok = domainMarkLinks.some(
					(l) => l.source_id === ev.id && filteredDomainIds.has(l.destination_id) && isMarked(l.properties?.mark)
				);
				if (!ok) continue;
			}
			if (!conceptFilterActive && !domainFilterActive) {
				const ok =
					conceptMarkLinks.some((l) => l.source_id === ev.id && isMarked(l.properties?.mark)) ||
					domainMarkLinks.some((l) => l.source_id === ev.id && isMarked(l.properties?.mark));
				if (!ok) continue;
			}
			ids.add(ev.id);
		}
		return ids;
	});

	// Concepts/domains visible when toggle is ON = those marked by markedEventIds
	// (the cascade-pruned event set, NOT the raw search-filtered events). This is
	// what makes "search concept Customer + toggle ON" also drop domains that no
	// Customer-event ticks.
	const markedConceptIds = $derived.by(() => {
		const ids = new Set<string>();
		for (const l of conceptMarkLinks) {
			if (markedEventIds.has(l.source_id) && isMarked(l.properties?.mark)) ids.add(l.destination_id);
		}
		return ids;
	});
	const markedDomainIds = $derived.by(() => {
		const ids = new Set<string>();
		for (const l of domainMarkLinks) {
			if (markedEventIds.has(l.source_id) && isMarked(l.properties?.mark)) ids.add(l.destination_id);
		}
		return ids;
	});

	// Final displayed axes — search filters apply first; if hideUnmarked is on,
	// also drop axes with zero marks within the visible cross-section.
	const displayedEventNodes = $derived(
		hideUnmarked ? filteredEventNodes.filter((n) => markedEventIds.has(n.id)) : filteredEventNodes
	);
	const displayedDomainNodes = $derived(
		hideUnmarked ? filteredDomainNodes.filter((n) => markedDomainIds.has(n.id)) : filteredDomainNodes
	);
	const displayedConceptNodes = $derived(
		hideUnmarked ? filteredConceptNodes.filter((n) => markedConceptIds.has(n.id)) : filteredConceptNodes
	);

	// Group concepts by W (ordered by W-type then alphabetical) — toggle-aware via displayedConceptNodes
	const orderedConcepts = $derived.by(() => {
		const result: ContextNode[] = [];
		for (const wt of WS) {
			const group = displayedConceptNodes
				.filter((n) => (n.properties?.w as string) === wt)
				.sort((a, b) => a.name.localeCompare(b.name));
			result.push(...group);
		}
		return result;
	});

	const wSpans = $derived.by(() => {
		const spans: { w: W; label: string; count: number; color: string; bg: string; border: string }[] = [];
		for (const wt of WS) {
			const count = displayedConceptNodes.filter((n) => (n.properties?.w as string) === wt).length;
			if (count > 0) {
				spans.push({ w: wt, label: W_LABELS[wt], count, color: W_COLORS[wt], bg: W_BG[wt], border: W_BORDER[wt] });
			}
		}
		return spans;
	});

	function getDomainMark(eventId: string, domainId: string): EventConceptMark {
		const link = domainMarkLinks.find((l) => l.source_id === eventId && l.destination_id === domainId);
		return (link?.properties?.mark as EventConceptMark) || '';
	}

	function getConceptMark(eventId: string, conceptId: string): EventConceptMark {
		const link = conceptMarkLinks.find((l) => l.source_id === eventId && l.destination_id === conceptId);
		return (link?.properties?.mark as EventConceptMark) || '';
	}

	function getConceptCount(eventId: string): number {
		return conceptMarkLinks.filter((l) => l.source_id === eventId && ((l.properties?.mark as string) === 'check' || (l.properties?.mark as string) === 'star')).length;
	}

	/** Returns true if an event has NO star mark in any concept (W-type) column */
	function eventMissingStar(eventId: string): boolean {
		return !conceptMarkLinks.some((l) => l.source_id === eventId && (l.properties?.mark as string) === 'star');
	}

	// ── Mutations ──

	async function toggleDomainMark(eventId: string, domainId: string) {
		const link = domainMarkLinks.find((l) => l.source_id === eventId && l.destination_id === domainId);
		const current = (link?.properties?.mark as EventConceptMark) || '';
		if (current === '') {
			// Create link with check
			await adapter.createLink({ source_id: eventId, destination_id: domainId, label: 'event_involves_domain', properties: { mark: 'check' } });
		} else if (current === 'check') {
			// Update to star
			if (link) await adapter.deleteLink(link.id);
			await adapter.createLink({ source_id: eventId, destination_id: domainId, label: 'event_involves_domain', properties: { mark: 'star' } });
		} else {
			// Remove link (back to empty)
			if (link) await adapter.deleteLink(link.id);
		}
	}

	async function toggleConceptMark(eventId: string, conceptId: string) {
		const link = conceptMarkLinks.find((l) => l.source_id === eventId && l.destination_id === conceptId);
		const current = (link?.properties?.mark as EventConceptMark) || '';
		if (current === '') {
			await adapter.createLink({ source_id: eventId, destination_id: conceptId, label: 'event_involves_concept', properties: { mark: 'check' } });
		} else if (current === 'check') {
			if (link) await adapter.deleteLink(link.id);
			await adapter.createLink({ source_id: eventId, destination_id: conceptId, label: 'event_involves_concept', properties: { mark: 'star' } });
		} else {
			if (link) await adapter.deleteLink(link.id);
		}
	}

	// ── Add Event inline form state (typeahead over existing + new) ──
	let showAddEvent = $state(false);
	let newEventName = $state('');
	let selectedExistingEventId = $state<string | null>(null);
	let eventTypeaheadIdx = $state(-1);

	/** Typeahead: existing events (bem_event OR global_core_business_event) not already linked to this matrix. */
	const existingEvents = $derived.by(() => {
		if (!newEventName.trim()) return [];
		const q = newEventName.toLowerCase();
		const alreadyLinked = new Set(eventNodes.map((n) => n.id));
		return nodes
			.filter((n) => {
				const labels = getNodeLabels(n);
				return (labels.includes('bem_event') || labels.includes('global_core_business_event'))
					&& !alreadyLinked.has(n.id)
					&& n.name.toLowerCase().includes(q);
			})
			.sort((a, b) => a.name.localeCompare(b.name))
			.slice(0, 8);
	});

	async function selectExistingEvent(ev: ContextNode) {
		selectedExistingEventId = ev.id;
		newEventName = ev.name;
		eventTypeaheadIdx = -1;
		await commitAddEvent();
	}

	function handleEventTypeaheadKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (existingEvents.length > 0) eventTypeaheadIdx = Math.min(eventTypeaheadIdx + 1, existingEvents.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			eventTypeaheadIdx = Math.max(eventTypeaheadIdx - 1, -1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (eventTypeaheadIdx >= 0 && existingEvents[eventTypeaheadIdx]) {
				selectExistingEvent(existingEvents[eventTypeaheadIdx]);
			} else {
				commitAddEvent();
			}
		} else if (e.key === 'Escape') {
			showAddEvent = false;
			newEventName = '';
			selectedExistingEventId = null;
			eventTypeaheadIdx = -1;
		}
	}

	async function commitAddEvent() {
		if (!selectedExistingEventId && !newEventName.trim()) return;
		if (selectedExistingEventId) {
			// Link an existing event (from any canvas) into this matrix
			if (selectedModelId) {
				await adapter.createLink({ source_id: selectedModelId, destination_id: selectedExistingEventId, label: 'has_event' });
			}
		} else {
			// Create a brand-new event
			const newNode = await adapter.createNode({
				label: 'bem_event',
				name: newEventName.trim(),
				properties: { order: eventNodes.length + 1, importance: 0, estimate: 0 }
			});
			if (selectedModelId) {
				await adapter.createLink({ source_id: selectedModelId, destination_id: newNode.id, label: 'has_event' });
			}
		}
		newEventName = '';
		selectedExistingEventId = null;
		eventTypeaheadIdx = -1;
		showAddEvent = false;
	}

	async function handleAddEvent() {
		showAddEvent = true;
		newEventName = '';
		selectedExistingEventId = null;
		eventTypeaheadIdx = -1;
	}

	// ── Add Domain inline form state (typeahead over existing + new) ──
	// Mirrors Add Event / Add Concept — opens an inline input in the toolbar
	// (no browser prompt), supports typeahead over both bem_domain (matrix-local)
	// and global_domain (cross-canvas, e.g. Concept Model) so picking an
	// existing domain just creates the has_domain link rather than duplicating.
	let showAddDomain = $state(false);
	let newDomainName = $state('');
	let selectedExistingDomainId = $state<string | null>(null);
	let domainTypeaheadIdx = $state(-1);

	const existingDomains = $derived.by(() => {
		if (!newDomainName.trim()) return [];
		const q = newDomainName.toLowerCase();
		const alreadyLinked = new Set(domainNodes.map((n) => n.id));
		return nodes
			.filter((n) => {
				const labels = getNodeLabels(n);
				return (labels.includes('bem_domain') || labels.includes('global_domain'))
					&& !alreadyLinked.has(n.id)
					&& n.name.toLowerCase().includes(q);
			})
			.sort((a, b) => a.name.localeCompare(b.name))
			.slice(0, 8);
	});

	async function selectExistingDomain(d: ContextNode) {
		selectedExistingDomainId = d.id;
		newDomainName = d.name;
		domainTypeaheadIdx = -1;
		await commitAddDomain();
	}

	function handleDomainTypeaheadKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (existingDomains.length > 0) domainTypeaheadIdx = Math.min(domainTypeaheadIdx + 1, existingDomains.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			domainTypeaheadIdx = Math.max(domainTypeaheadIdx - 1, -1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (domainTypeaheadIdx >= 0 && existingDomains[domainTypeaheadIdx]) {
				selectExistingDomain(existingDomains[domainTypeaheadIdx]);
			} else {
				commitAddDomain();
			}
		} else if (e.key === 'Escape') {
			showAddDomain = false;
			newDomainName = '';
			selectedExistingDomainId = null;
			domainTypeaheadIdx = -1;
		}
	}

	async function commitAddDomain() {
		if (!selectedExistingDomainId && !newDomainName.trim()) return;
		if (selectedExistingDomainId) {
			if (selectedModelId) {
				await adapter.createLink({ source_id: selectedModelId, destination_id: selectedExistingDomainId, label: 'has_domain' });
			}
		} else {
			const newNode = await adapter.createNode({
				label: 'bem_domain',
				name: newDomainName.trim(),
				properties: { order: domainNodes.length + 1, aliases: [], owner: '' }
			});
			if (selectedModelId) {
				await adapter.createLink({ source_id: selectedModelId, destination_id: newNode.id, label: 'has_domain' });
			}
		}
		newDomainName = '';
		selectedExistingDomainId = null;
		domainTypeaheadIdx = -1;
		showAddDomain = false;
	}

	async function handleAddDomain() {
		showAddDomain = true;
		newDomainName = '';
		selectedExistingDomainId = null;
		domainTypeaheadIdx = -1;
	}

	// ── Add Concept inline form state ──
	let showAddConcept = $state(false);
	let newConceptName = $state('');
	let newConceptW = $state<W>('who');
	let selectedExistingConceptId = $state<string | null>(null);
	let typeaheadFocusIndex = $state(-1);

	// Typeahead: find existing concepts (with conceptEntityLabel) not already linked to this matrix
	const existingConcepts = $derived.by(() => {
		if (!newConceptName.trim()) return [];
		const q = newConceptName.toLowerCase();
		const alreadyLinked = new Set(conceptNodes.map((n) => n.id));
		return nodes
			.filter((n) => getNodeLabels(n).includes(conceptEntityLabel) && !alreadyLinked.has(n.id) && n.name.toLowerCase().includes(q))
			.sort((a, b) => a.name.localeCompare(b.name))
			.slice(0, 8);
	});

	async function selectExistingConcept(concept: ContextNode) {
		selectedExistingConceptId = concept.id;
		newConceptName = concept.name;
		typeaheadFocusIndex = -1;
		// If concept already has a w, link immediately
		if (concept.properties?.w) {
			await handleAddConcept();
		}
		// Otherwise the W selector shows, user picks and clicks "Link Concept"
	}

	function handleTypeaheadKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (existingConcepts.length > 0) typeaheadFocusIndex = Math.min(typeaheadFocusIndex + 1, existingConcepts.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			typeaheadFocusIndex = Math.max(typeaheadFocusIndex - 1, -1);
		} else if (e.key === 'Enter') {
			if (typeaheadFocusIndex >= 0 && existingConcepts[typeaheadFocusIndex]) {
				e.preventDefault();
				selectExistingConcept(existingConcepts[typeaheadFocusIndex]);
			} else {
				handleAddConcept();
			}
		} else if (e.key === 'Escape') {
			showAddConcept = false;
		}
	}

	async function handleAddConcept() {
		if (!newConceptName.trim()) return;
		if (selectedExistingConceptId) {
			// Link existing concept to this matrix
			const existingNode = nodes.find((n) => n.id === selectedExistingConceptId);
			// If concept has no w, assign the selected one
			if (existingNode && !existingNode.properties?.w) {
				await adapter.updateNode(selectedExistingConceptId, { properties: { ...existingNode.properties, w: newConceptW, order: conceptNodes.length + 1 } });
			}
			if (selectedModelId) {
				await adapter.createLink({ source_id: selectedModelId, destination_id: selectedExistingConceptId, label: 'has_concept' });
			}
		} else {
			// Create new concept node
			const newNode = await adapter.createNode({ label: conceptEntityLabel, name: newConceptName.trim(), properties: { w: newConceptW, order: conceptNodes.length + 1, aliases: [] } });
			if (selectedModelId) {
				await adapter.createLink({ source_id: selectedModelId, destination_id: newNode.id, label: 'has_concept' });
			}
		}
		newConceptName = '';
		selectedExistingConceptId = null;
		showAddConcept = false;
	}

	async function handleRemoveEvent(eventNode: ContextNode) {
		const link = eventLinks.find((l) => l.destination_id === eventNode.id);
		if (link) await adapter.deleteLink(link.id);
		// Also remove mark links
		for (const ml of [...domainMarkLinks, ...conceptMarkLinks]) {
			if (ml.source_id === eventNode.id) await adapter.deleteLink(ml.id);
		}
		await adapter.deleteNode(eventNode.id);
	}

	async function handleRemoveDomain(domainNode: ContextNode) {
		const link = domainLinks.find((l) => l.destination_id === domainNode.id);
		if (link) await adapter.deleteLink(link.id);
		// Remove mark links
		for (const ml of domainMarkLinks) {
			if (ml.destination_id === domainNode.id) await adapter.deleteLink(ml.id);
		}
		await adapter.deleteNode(domainNode.id);
	}

	async function handleRemoveConcept(conceptNode: ContextNode) {
		const link = conceptLinks.find((l) => l.destination_id === conceptNode.id);
		if (link) await adapter.deleteLink(link.id);
		// Remove mark links
		for (const ml of conceptMarkLinks) {
			if (ml.destination_id === conceptNode.id) await adapter.deleteLink(ml.id);
		}
		// Only delete the node if it's not a global entity (global concepts are shared)
		const labels = getNodeLabels(conceptNode);
		const isGlobal = labels.some((l) => l.startsWith('global_'));
		if (!isGlobal) {
			await adapter.deleteNode(conceptNode.id);
		}
	}

	async function handleEventNameChange(eventNode: ContextNode, newName: string) {
		const trimmed = newName.trim();
		if (!trimmed || trimmed === eventNode.name) return;
		await adapter.updateNode(eventNode.id, { name: trimmed });
	}

	async function handleCreateModel() {
		const name = prompt('Matrix name:');
		if (!name) return;
		onAddNode('bem_model', name);
	}

	async function handleDeleteModel() {
		if (!selectedModel) return;
		if (!confirm(`Delete matrix "${selectedModel.name}" and all its events, domains, and concepts?`)) return;

		// Delete all mark links (event_involves_domain, event_involves_concept)
		for (const ml of [...domainMarkLinks, ...conceptMarkLinks]) {
			await adapter.deleteLink(ml.id);
		}
		// Delete all structural links (has_event, has_domain, has_concept)
		for (const l of [...eventLinks, ...domainLinks, ...conceptLinks]) {
			await adapter.deleteLink(l.id);
		}
		// Delete all child nodes
		for (const n of [...eventNodes, ...domainNodes, ...conceptNodes]) {
			await adapter.deleteNode(n.id);
		}
		// Delete the model node itself
		await adapter.deleteNode(selectedModel.id);

		// Select next available model
		selectedModelId = null;
	}

	// ── Matrix switcher dropdown ──
	let showMatrixSwitcher = $state(false);

	// ── Inline editing state ──
	let editingModelName = $state(false);
	let editingModelNameValue = $state('');
	let editingModelDesc = $state(false);
	let editingModelDescValue = $state('');
	let editingEventId = $state<string | null>(null);
	let editingEventName = $state('');
	let editingDomainId = $state<string | null>(null);
	let editingDimId = $state<string | null>(null);

	async function handleModelNameChange(newName: string) {
		const trimmed = newName.trim();
		if (!trimmed || !selectedModel || trimmed === selectedModel.name) { editingModelName = false; return; }
		await adapter.updateNode(selectedModel.id, { name: trimmed });
		editingModelName = false;
	}

	async function handleModelDescChange(newDesc: string) {
		const trimmed = newDesc.trim();
		if (!selectedModel || trimmed === (selectedModel.description || '')) { editingModelDesc = false; return; }
		await adapter.updateNode(selectedModel.id, { description: trimmed || undefined });
		editingModelDesc = false;
	}

	// ── Warning tooltip for missing driving concept ──
	let warningTooltipEventId = $state<string | null>(null);
	let warningTooltipX = $state(0);
	let warningTooltipY = $state(0);
	let warningHideTimeout: ReturnType<typeof setTimeout> | null = null;

	function showWarningTooltip(eventId: string, el: HTMLElement) {
		if (warningHideTimeout) { clearTimeout(warningHideTimeout); warningHideTimeout = null; }
		const r = el.getBoundingClientRect();
		warningTooltipX = r.left + r.width / 2;
		warningTooltipY = r.bottom;
		warningTooltipEventId = eventId;
	}
	function scheduleHideWarningTooltip() {
		warningHideTimeout = setTimeout(() => { warningTooltipEventId = null; }, 200);
	}
	function cancelHideWarningTooltip() {
		if (warningHideTimeout) { clearTimeout(warningHideTimeout); warningHideTimeout = null; }
	}

	// ── Tooltip state ──
	let tooltipId = $state<string | null>(null);
	let tooltipType = $state<'domain' | 'concept'>('domain');
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

	function showTooltipFor(id: string, type: 'domain' | 'concept', el: HTMLElement) {
		if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
		const r = el.getBoundingClientRect();
		tooltipX = r.left + r.width / 2;
		tooltipY = r.bottom;
		tooltipId = id;
		tooltipType = type;
	}
	function scheduleHideTooltip() {
		hideTimeout = setTimeout(() => { tooltipId = null; }, 200);
	}
	function cancelHideTooltip() {
		if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
	}

	const tooltipItem = $derived.by(() => {
		if (!tooltipId) return null;
		if (tooltipType === 'domain') {
			const dom = domainNodes.find((d) => d.id === tooltipId);
			return dom ? { name: dom.name, description: dom.description || '', aliases: (dom.properties?.aliases as string[]) || [], owner: (dom.properties?.owner as string) || '', notes: (dom.properties?.notes as string) || '', w: null as W | null, color: DOMAIN_COLOR, borderColor: DOMAIN_BORDER, definitionCategory: '', definitionDifferentiator: '' } : null;
		} else {
			const dim = orderedConcepts.find((d) => d.id === tooltipId);
			const wt = (dim?.properties?.w as W) || 'who';
			return dim ? { name: dim.name, description: dim.description || '', aliases: (dim.properties?.aliases as string[]) || [], owner: '', notes: (dim.properties?.notes as string) || '', w: wt, color: W_COLORS[wt], borderColor: W_BORDER[wt], definitionCategory: (dim.properties?.definitionCategory as string) || '', definitionDifferentiator: (dim.properties?.definitionDifferentiator as string) || '' } : null;
		}
	});

	// ── Edit details modal state ──
	let editingDescId = $state<string | null>(null);
	let editingDescType = $state<'domain' | 'concept'>('domain');
	let editingNameValue = $state('');
	let editingDescValue = $state('');
	let editingAliasesValue = $state('');
	let editingOwnerValue = $state('');
	let editingW = $state<W>('who');
	let editingNotesValue = $state('');
	let editingDefCategory = $state('');
	let editingDefDifferentiator = $state('');
	let defCatQuery = $state('');
	let defCatFocusIdx = $state(-1);
	let showDefCatDropdown = $state(false);

	const defCatSuggestions = $derived.by(() => {
		const q = defCatQuery.toLowerCase().trim();
		if (!q) return [] as ContextNode[];
		return conceptNodes
			.filter((n) => n.id !== editingDescId && n.name.toLowerCase().includes(q))
			.sort((a, b) => a.name.localeCompare(b.name))
			.slice(0, 8);
	});

	function handleDefCatInput() {
		defCatQuery = editingDefCategory;
		showDefCatDropdown = defCatSuggestions.length > 0;
		defCatFocusIdx = -1;
	}

	function selectDefCatConcept(concept: ContextNode) {
		editingDefCategory = concept.name;
		defCatQuery = '';
		showDefCatDropdown = false;
		defCatFocusIdx = -1;
	}

	function handleDefCatKeydown(e: KeyboardEvent) {
		if (!showDefCatDropdown) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			defCatFocusIdx = Math.min(defCatFocusIdx + 1, defCatSuggestions.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			defCatFocusIdx = Math.max(defCatFocusIdx - 1, -1);
		} else if (e.key === 'Enter' && defCatFocusIdx >= 0) {
			e.preventDefault();
			selectDefCatConcept(defCatSuggestions[defCatFocusIdx]);
		} else if (e.key === 'Escape') {
			showDefCatDropdown = false;
		}
	}

	// ── @mention in differentiator ──
	let mentionQuery = $state('');
	let mentionStartPos = $state(-1);
	let showMentionDropdown = $state(false);
	let mentionFocusIdx = $state(-1);
	let mentionInputEl = $state<HTMLInputElement | null>(null);

	const glossaryTerms = $derived(nodes.filter((n) => getNodeLabels(n).includes('global_glossary_term')));

	const mentionSuggestions = $derived.by(() => {
		const q = mentionQuery.toLowerCase().trim();
		if (!q) return [] as ContextNode[];
		return glossaryTerms
			.filter((n: ContextNode) => n.name.toLowerCase().includes(q))
			.sort((a: ContextNode, b: ContextNode) => a.name.localeCompare(b.name))
			.slice(0, 8);
	});

	function handleDiffInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const pos = input.selectionStart ?? 0;
		const text = editingDefDifferentiator.substring(0, pos);
		let atPos = -1;
		for (let i = text.length - 1; i >= 0; i--) {
			if (text[i] === '@') { atPos = i; break; }
			if (text[i] === '}') break;
		}
		if (atPos >= 0) {
			const after = text.substring(atPos + 1);
			if (after.includes('{')) {
				if (after.includes('}')) { showMentionDropdown = false; return; }
				mentionQuery = after.substring(1);
			} else {
				mentionQuery = after;
			}
			mentionStartPos = atPos;
			showMentionDropdown = mentionQuery.length > 0;
			mentionFocusIdx = -1;
		} else {
			showMentionDropdown = false;
		}
	}

	function selectMention(term: ContextNode) {
		const input = mentionInputEl;
		const pos = input?.selectionStart ?? editingDefDifferentiator.length;
		const before = editingDefDifferentiator.substring(0, mentionStartPos);
		const after = editingDefDifferentiator.substring(pos);
		editingDefDifferentiator = before + '@{' + term.name + '} ' + after;
		showMentionDropdown = false;
		mentionFocusIdx = -1;
		const newPos = before.length + term.name.length + 4;
		setTimeout(() => { if (input) { input.focus(); input.setSelectionRange(newPos, newPos); } }, 0);
	}

	function handleDiffKeydown(e: KeyboardEvent) {
		if (!showMentionDropdown || mentionSuggestions.length === 0) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			mentionFocusIdx = Math.min(mentionFocusIdx + 1, mentionSuggestions.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			mentionFocusIdx = Math.max(mentionFocusIdx - 1, -1);
		} else if (e.key === 'Enter' && mentionFocusIdx >= 0) {
			e.preventDefault();
			selectMention(mentionSuggestions[mentionFocusIdx]);
		} else if (e.key === 'Escape') {
			showMentionDropdown = false;
		}
	}

	function openEditModal(id: string, type: 'domain' | 'concept') {
		const item = type === 'domain'
			? domainNodes.find((d) => d.id === id)
			: orderedConcepts.find((d) => d.id === id);
		if (!item) return;
		editingDescId = id;
		editingDescType = type;
		editingNameValue = item.name;
		editingDescValue = item.description || '';
		editingAliasesValue = ((item.properties?.aliases as string[]) || []).join(', ');
		editingOwnerValue = (item.properties?.owner as string) || '';
		editingW = (item.properties?.w as W) || 'who';
		editingNotesValue = (item.properties?.notes as string) || '';
		editingDefCategory = (item.properties?.definitionCategory as string) || '';
		editingDefDifferentiator = (item.properties?.definitionDifferentiator as string) || '';
		defCatQuery = '';
		showDefCatDropdown = false;
		defCatFocusIdx = -1;
		showMentionDropdown = false;
		mentionFocusIdx = -1;
		tooltipId = null;
	}

	async function saveEditModal() {
		if (!editingDescId) return;
		const aliases = editingAliasesValue.split(',').map((a) => a.trim()).filter((a) => a.length > 0);
		if (editingDescType === 'domain') {
			await adapter.updateNode(editingDescId, {
				name: editingNameValue,
				description: editingDescValue,
				properties: { aliases, owner: editingOwnerValue, notes: editingNotesValue, order: domainNodes.find((d) => d.id === editingDescId)?.properties?.order }
			});
		} else {
			await adapter.updateNode(editingDescId, {
				name: editingNameValue,
				description: editingDescValue,
				properties: { aliases, w: editingW, notes: editingNotesValue, order: orderedConcepts.find((d) => d.id === editingDescId)?.properties?.order, definitionCategory: editingDefCategory, definitionDifferentiator: editingDefDifferentiator }
			});
		}
		editingDescId = null;
	}

	/**
	 * Delete the domain or concept currently open in the edit modal. Confirms
	 * before deleting (this is destructive — removes the row/column from the
	 * matrix and any cells linked to it). Closes the modal on success.
	 */
	async function deleteFromEditModal() {
		if (!editingDescId) return;
		const name = editingNameValue || (editingDescType === 'domain' ? 'this domain' : 'this concept');
		const kind = editingDescType === 'domain' ? 'domain' : 'concept';
		const ok = window.confirm(
			`Delete ${kind} "${name}"?\n\nThis removes it from the matrix and deletes all its cells. This cannot be undone.`
		);
		if (!ok) return;
		try {
			await adapter.deleteNode(editingDescId);
		} catch (e) {
			alert(`Failed to delete: ${e instanceof Error ? e.message : String(e)}`);
			return;
		}
		editingDescId = null;
	}

	async function handleDomainNameChange(domNode: ContextNode, newName: string) {
		const trimmed = newName.trim();
		if (!trimmed || trimmed === domNode.name) return;
		await adapter.updateNode(domNode.id, { name: trimmed });
	}

	async function handleConceptNameChange(dimNode: ContextNode, newName: string) {
		const trimmed = newName.trim();
		if (!trimmed || trimmed === dimNode.name) return;
		await adapter.updateNode(dimNode.id, { name: trimmed });
	}

	function handleClickOutsideMatrix(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('[data-matrix-switcher]')) {
			showMatrixSwitcher = false;
		}
	}

	/** Auto-focus action — focuses and selects the input on mount */
	function autofocus(node: HTMLInputElement) {
		node.focus();
		node.select();
	}
</script>

<svelte:window onclick={handleClickOutsideMatrix} />

<div class="flex-1 overflow-auto p-4">
	<!-- Tier 1: Header — Matrix switcher + New + Delete (hidden when CP sidebar takes over) -->
	{#if effectiveShowSwitcher}
		<div class="bg-white border border-slate-200 rounded-lg px-4 py-2.5 mb-2">
			<div class="flex items-center gap-2">
				<div class="relative" data-matrix-switcher>
					<button
						onclick={() => (showMatrixSwitcher = !showMatrixSwitcher)}
						class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-100"
					>
						<div class="text-left">
							<div class="text-sm font-semibold text-slate-800 leading-tight">{selectedModel?.name ?? 'No matrix'}</div>
							<div class="text-[10px] text-slate-400 leading-tight">Switch matrix</div>
						</div>
						<svg class="w-4 h-4 text-slate-400 transition-transform {showMatrixSwitcher ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if showMatrixSwitcher}
						<div class="absolute top-full left-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 min-w-[200px]">
							{#each modelNodes as m}
								<button
									onclick={() => { selectedModelId = m.id; showMatrixSwitcher = false; }}
									class="w-full text-left px-4 py-2 text-sm transition-colors {m.id === selectedModelId ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600 hover:bg-slate-50'}"
								>
									{m.name}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<button
					class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 transition-colors"
					onclick={handleCreateModel}
				>
					New Matrix
				</button>
				{#if selectedModel && modelNodes.length > 0}
					<button
						class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-red-500 border border-red-300 hover:bg-red-50 transition-colors"
						onclick={handleDeleteModel}
					>
						Delete
					</button>
				{/if}
			</div>
		</div>

	{/if}

	<!-- Tier 2: Toolbar — Name/Desc + Export (Import moved to sidebar in CP) -->
	{#if selectedModel && showToolbar}
		<div class="bg-white border border-slate-200 rounded-lg mb-2">
			<div class="flex items-center justify-between px-4 py-2.5">
				<div class="flex items-center gap-3 min-w-0">
					<div class="min-w-0">
						{#if editingModelName}
							<input
								type="text"
								bind:value={editingModelNameValue}
								onblur={() => handleModelNameChange(editingModelNameValue)}
								onkeydown={(e) => { if (e.key === 'Enter') handleModelNameChange(editingModelNameValue); if (e.key === 'Escape') { editingModelName = false; } }}
								class="text-sm font-semibold text-slate-800 px-1 border border-blue-400 rounded outline-none w-64"
							/>
						{:else}
							<button
								class="text-sm font-semibold text-slate-800 leading-tight cursor-pointer hover:text-slate-600 transition-colors text-left truncate max-w-md"
								onclick={() => { editingModelNameValue = selectedModel!.name; editingModelName = true; }}
								title="Click to edit name"
							>{selectedModel.name}</button>
						{/if}
						{#if editingModelDesc}
							<input
								type="text"
								bind:value={editingModelDescValue}
								onblur={() => handleModelDescChange(editingModelDescValue)}
								onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleModelDescChange(editingModelDescValue); } if (e.key === 'Escape') { editingModelDesc = false; } }}
								placeholder="Add a description..."
								class="text-[10px] text-slate-500 px-1 border border-blue-400 rounded outline-none w-full mt-0.5"
							/>
						{:else}
							<button
								class="block text-[10px] leading-tight mt-0.5 truncate max-w-md text-left cursor-pointer transition-colors {selectedModel.description ? 'text-slate-400 hover:text-slate-600' : 'text-slate-300 italic hover:text-slate-500'}"
								onclick={() => { editingModelDescValue = selectedModel!.description || ''; editingModelDesc = true; }}
								title="Click to edit description"
							>{selectedModel.description || 'Click to add a description'}</button>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-2 shrink-0">
					{#if onExportJson}
						<button
							class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
							onclick={() => onExportJson(selectedModel?.name ?? '')}
						>
							Export JSON
						</button>
					{/if}
					{#if onExportPdf}
						<button
							class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-teal-600 border border-teal-300 hover:bg-teal-50 transition-colors disabled:opacity-50"
							disabled={exportingPdf}
							onclick={async () => { exportingPdf = true; try { await onExportPdf!(); } finally { exportingPdf = false; } }}
						>
							{exportingPdf ? 'Exporting...' : 'Export PDF'}
						</button>
					{/if}
					{#if onExportCsv}
						<button
							class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
							onclick={() => onExportCsv!()}
						>
							Export CSV
						</button>
					{/if}
					{#if onExportXlsx}
						<button
							class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
							onclick={() => onExportXlsx!()}
						>
							Export Excel
						</button>
					{/if}
					{#if onImportJson}
						<button
							class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
							disabled={importing}
							onclick={async () => { importing = true; try { await onImportJson!(); } finally { importing = false; } }}
						>
							{importing ? 'Importing...' : 'Import JSON'}
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Tier 3: Tabs (§ Tier 3 — blue-600 active, slate-400 inactive) -->
	{#if selectedModel && showTabs}
		<div class="flex gap-0 px-4 border-b border-slate-200 mb-3">
			<button class="flex items-center px-3.5 py-2 text-xs font-medium border-b-2 -mb-px text-blue-600 border-blue-600">Matrix</button>
		</div>
	{/if}

	{#if !selectedModel}
		<div class="text-center py-12 text-slate-400">
			<p class="text-lg mb-2">No matrix found</p>
			<p class="text-sm">Create a new matrix to get started with the Business Event Matrix.</p>
		</div>
	{:else}
		<!-- Action buttons -->
		<div class="flex flex-wrap items-center gap-2 mb-4">
			{#if showAddEvent}
				<div class="relative" data-event-typeahead>
					<input
						use:autofocus
						type="text"
						placeholder={selectedExistingEventId ? '' : 'Search or create event (Subject Verb Object)...'}
						bind:value={newEventName}
						oninput={() => { selectedExistingEventId = null; eventTypeaheadIdx = -1; }}
						onkeydown={handleEventTypeaheadKeydown}
						class="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-72 {selectedExistingEventId ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'}"
					/>
					{#if existingEvents.length > 0 && !selectedExistingEventId}
						<div class="absolute top-full left-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl z-50 py-1 w-80 max-h-48 overflow-y-auto">
							{#each existingEvents as ev, i}
								<button
									onclick={() => selectExistingEvent(ev)}
									class="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 {i === eventTypeaheadIdx ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'}"
								>
									<span class="w-2 h-2 rounded-full shrink-0 bg-emerald-500"></span>
									<span class="font-medium">{ev.name}</span>
									{#if getNodeLabels(ev).includes('global_core_business_event')}
										<span class="text-[10px] text-slate-400 ml-auto">global</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
				<button onclick={commitAddEvent} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-500 transition-colors">
					{selectedExistingEventId ? 'Link Event' : 'Add Event'}
				</button>
				<button onclick={() => { showAddEvent = false; selectedExistingEventId = null; newEventName = ''; eventTypeaheadIdx = -1; }} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-500 border border-slate-300 hover:bg-slate-50 transition-colors">Cancel</button>
			{:else}
				<button onclick={handleAddEvent} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">+ Event</button>
			{/if}
			<div class="w-px h-6 bg-slate-200"></div>
			{#if showAddDomain}
				<div class="relative" data-domain-typeahead>
					<input
						use:autofocus
						type="text"
						placeholder={selectedExistingDomainId ? '' : 'Search or create domain...'}
						bind:value={newDomainName}
						oninput={() => { selectedExistingDomainId = null; domainTypeaheadIdx = -1; }}
						onkeydown={handleDomainTypeaheadKeydown}
						class="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none w-72 {selectedExistingDomainId ? 'border-violet-400 bg-violet-50' : 'border-slate-300'}"
					/>
					{#if existingDomains.length > 0 && !selectedExistingDomainId}
						<div class="absolute top-full left-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl z-50 py-1 w-80 max-h-48 overflow-y-auto">
							{#each existingDomains as d, i}
								<button
									onclick={() => selectExistingDomain(d)}
									class="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 {i === domainTypeaheadIdx ? 'bg-violet-50 text-violet-800' : 'text-slate-700 hover:bg-slate-50'}"
								>
									<span class="w-2 h-2 rounded-full shrink-0 bg-violet-500"></span>
									<span class="font-medium">{d.name}</span>
									{#if getNodeLabels(d).includes('global_domain')}
										<span class="text-[10px] text-slate-400 ml-auto">global</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
				<button onclick={commitAddDomain} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-600 text-white border border-violet-600 hover:bg-violet-500 transition-colors">
					{selectedExistingDomainId ? 'Link Domain' : 'Add Domain'}
				</button>
				<button onclick={() => { showAddDomain = false; selectedExistingDomainId = null; newDomainName = ''; domainTypeaheadIdx = -1; }} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-500 border border-slate-300 hover:bg-slate-50 transition-colors">Cancel</button>
			{:else}
				<button onclick={handleAddDomain} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors">+ Domain</button>
			{/if}
			<div class="w-px h-6 bg-slate-200"></div>
			{#if showAddConcept}
				<div class="relative" data-concept-typeahead>
					<input
						use:autofocus
						type="text"
						placeholder={selectedExistingConceptId ? '' : 'Search or create concept...'}
						bind:value={newConceptName}
						oninput={() => { selectedExistingConceptId = null; typeaheadFocusIndex = -1; }}
						onkeydown={handleTypeaheadKeydown}
						class="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-56 {selectedExistingConceptId ? 'border-blue-400 bg-blue-50' : 'border-slate-300'}"
					/>
					{#if existingConcepts.length > 0 && !selectedExistingConceptId}
						<div class="absolute top-full left-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl z-50 py-1 w-72 max-h-48 overflow-y-auto">
							{#each existingConcepts as concept, i}
								<button
									onclick={() => selectExistingConcept(concept)}
									class="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 {i === typeaheadFocusIndex ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'}"
								>
									<span class="w-2 h-2 rounded-full shrink-0" style="background-color: {W_COLORS[(concept.properties?.w as W)] || '#6b7280'}"></span>
									<span class="font-medium">{concept.name}</span>
									{#if concept.properties?.w}
										<span class="text-[10px] text-slate-400 ml-auto">{W_LABELS[(concept.properties?.w as W)] || concept.properties.w}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
				{@const existingHasW = selectedExistingConceptId ? nodes.find((n) => n.id === selectedExistingConceptId)?.properties?.w : null}
				{#if !selectedExistingConceptId || !existingHasW}
					<select bind:value={newConceptW} class="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
						{#each WS as wt}
							<option value={wt}>{W_LABELS[wt]}</option>
						{/each}
					</select>
				{/if}
				<button onclick={handleAddConcept} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
					{selectedExistingConceptId ? 'Link Concept' : 'Add Concept'}
				</button>
				<button onclick={() => { showAddConcept = false; selectedExistingConceptId = null; newConceptName = ''; }} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-500 border border-slate-300 hover:bg-slate-50 transition-colors">Cancel</button>
			{:else}
				<button onclick={() => (showAddConcept = true)} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">+ Concept</button>
			{/if}
		</div>

		<!-- Search filters + Hide unmarked toggle (single compact row, always shown when there is data) -->
		{#if eventNodes.length > 0 || domainNodes.length > 0 || conceptNodes.length > 0}
			<div class="flex items-center gap-2 mb-2">
				{#if eventNodes.length > 0}
					<div class="relative flex-1 max-w-xs">
						<svg class="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
						<input bind:value={eventSearchQuery} type="text" placeholder="Search events..." class="w-full pl-6 pr-6 py-1 text-[11px] border rounded bg-white focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none border-slate-200" />
						{#if eventSearchQuery}
							<button onclick={() => (eventSearchQuery = '')} class="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]">✕</button>
						{/if}
					</div>
				{/if}
				{#if domainNodes.length > 0}
					<div class="relative flex-1 max-w-xs">
						<svg class="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
						<input bind:value={domainSearchQuery} type="text" placeholder="Search domains..." class="w-full pl-6 pr-6 py-1 text-[11px] border rounded bg-white focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 outline-none border-slate-200" />
						{#if domainSearchQuery}
							<button onclick={() => (domainSearchQuery = '')} class="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]">✕</button>
						{/if}
					</div>
				{/if}
				{#if conceptNodes.length > 0}
					<div class="relative flex-1 max-w-xs">
						<svg class="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
						<input bind:value={conceptSearchQuery} type="text" placeholder="Search concepts..." class="w-full pl-6 pr-6 py-1 text-[11px] border rounded bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none border-slate-200" />
						{#if conceptSearchQuery}
							<button onclick={() => (conceptSearchQuery = '')} class="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]">✕</button>
						{/if}
					</div>
				{/if}

				<!-- Hide unmarked toggle — pill switch, label on the right.
				     Bidirectional: hides unmarked concept/domain columns based on
				     visible events, and unmarked event rows based on visible
				     concepts/domains. Composes with all three search filters. -->
				<button
					onclick={() => (hideUnmarked = !hideUnmarked)}
					role="switch"
					aria-checked={hideUnmarked}
					title="Hide concepts/domains with no marks AND events with no marks in the visible cross-section. Works with the search filters."
					class="relative inline-flex items-center gap-1.5 shrink-0 ml-auto pl-1 pr-2 py-0.5 rounded-md hover:bg-slate-50 transition-colors"
				>
					<span class="relative inline-block h-4 w-7 rounded-full transition-colors {hideUnmarked ? 'bg-blue-600' : 'bg-slate-300'}">
						<span class="absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform {hideUnmarked ? 'translate-x-3' : 'translate-x-0'}"></span>
					</span>
					<span class="text-[11px] text-slate-600 select-none">Hide unmarked</span>
				</button>
			</div>
		{/if}

		<!-- Matrix table -->
		<div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
			<table class="w-auto min-w-full border-collapse text-sm">
				<thead>
					<!-- W's group header -->
					<tr>
						<th rowspan="2" class="sticky left-0 z-20 bg-slate-100 text-slate-600 px-4 py-2 text-left min-w-[220px] border-r border-slate-200">
							<div class="flex items-center justify-between gap-1.5">
								<span class="text-[10px] font-semibold uppercase tracking-wider">Core Business Events</span>
								{#if onAddExisting}
									<button
										onclick={() => onAddExisting('global_core_business_event')}
										class="w-4 h-4 flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
										title="Add existing Core Business Event"
										aria-label="Add existing Core Business Event"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3">
											<path d="M1 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-4ZM10 1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V1ZM6.5 3.5a2.5 2.5 0 0 0-5 0v.006c0 .07.003.14.009.209l2.86 2.86a2.5 2.5 0 0 0 2.122-2.404L6.5 3.5ZM9.5 12.5a2.5 2.5 0 0 0 5 0v-.006a2.52 2.52 0 0 0-.009-.209l-2.86-2.86a2.5 2.5 0 0 0-2.122 2.404l-.009.671Z" />
										</svg>
									</button>
								{/if}
							</div>
						</th>
						<th rowspan="2" class="bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase tracking-wider px-3 py-2 whitespace-nowrap border-r border-slate-200">Concepts</th>
						{#if displayedDomainNodes.length > 0}
							{#if collapsedDomains}
							<th
								rowspan="2"
								class="text-[11px] font-bold uppercase tracking-wider px-1 py-2 text-center border-r cursor-pointer hover:brightness-95 transition-all"
								style="background-color: {DOMAIN_BG}; color: {DOMAIN_COLOR}; border-color: {DOMAIN_BORDER}; writing-mode: vertical-lr; text-orientation: mixed; width: 28px; min-width: 28px;"
								onclick={toggleCollapseDomains}
								title="Expand Domains"
							>
								<span class="text-[9px] opacity-70">▸</span> Domains ({displayedDomainNodes.length})
							</th>
							{:else}
							<th
								colspan={displayedDomainNodes.length}
								class="text-[11px] font-bold uppercase tracking-wider px-3 py-2 text-center border-r cursor-pointer hover:brightness-95 transition-all group/hdr"
								style="background-color: {DOMAIN_BG}; color: {DOMAIN_COLOR}; border-color: {DOMAIN_BORDER};"
								onclick={toggleCollapseDomains}
								title="Collapse Domains"
							>
								<span class="inline-flex items-center gap-1">Domains <span class="text-[9px] opacity-40 group-hover/hdr:opacity-80 transition-opacity">◂</span></span>
							</th>
							{/if}
						{/if}
						{#each wSpans as span}
							{#if collapsedWs.has(span.w)}
							<th
								rowspan="2"
								class="text-[11px] font-bold uppercase tracking-wider px-1 py-2 text-center border-r cursor-pointer hover:brightness-95 transition-all"
								style="background-color: {span.bg}; color: {span.color}; border-color: {span.border}; writing-mode: vertical-lr; text-orientation: mixed; width: 28px; min-width: 28px;"
								onclick={() => toggleCollapseW(span.w)}
								title="Expand {span.label}"
							>
								<span class="text-[9px] opacity-70">▸</span> {span.label} ({span.count})
							</th>
							{:else}
							<th
								colspan={span.count}
								class="text-[11px] font-bold uppercase tracking-wider px-3 py-2 text-center border-r cursor-pointer hover:brightness-95 transition-all group/hdr"
								style="background-color: {span.bg}; color: {span.color}; border-color: {span.border};"
								onclick={() => toggleCollapseW(span.w)}
								title="Collapse {span.label}"
							>
								<span class="inline-flex items-center gap-1">{span.label} <span class="text-[9px] opacity-40 group-hover/hdr:opacity-80 transition-opacity">◂</span></span>
							</th>
							{/if}
						{/each}
					</tr>
					<!-- Domain + Concept names -->
					<tr>
						{#if !collapsedDomains}
						{#each displayedDomainNodes as dom}
							<th class="px-2 py-2 text-xs font-semibold whitespace-nowrap border-r relative group"
								style="background-color: {DOMAIN_BG}; color: {DOMAIN_COLOR}; border-color: {DOMAIN_BORDER}; border-top: 2px solid {DOMAIN_COLOR};"
								onmouseenter={(e) => showTooltipFor(dom.id, 'domain', e.currentTarget as HTMLElement)}
								onmouseleave={() => scheduleHideTooltip()}
							>
								{#if editingDomainId === dom.id}
									<input
										use:autofocus
										type="text"
										value={dom.name}
										size={Math.max(dom.name.length, 8)}
										onblur={(e) => { handleDomainNameChange(dom, (e.target as HTMLInputElement).value); editingDomainId = null; }}
										onkeydown={(e) => { if (e.key === 'Enter') { handleDomainNameChange(dom, (e.target as HTMLInputElement).value); editingDomainId = null; } if (e.key === 'Escape') { editingDomainId = null; } }}
										class="text-xs font-semibold px-1 py-0.5 border border-violet-400 rounded outline-none min-w-[80px]"
									/>
								{:else}
									<button type="button" class="cursor-default bg-transparent border-0 p-0 font-semibold text-inherit" onclick={() => onSelectNode(dom.id)} ondblclick={() => (editingDomainId = dom.id)}>{dom.name}</button>
								{/if}
								<!-- Per-cell remove button removed. To remove a domain from the
								     matrix: open it (single-click → CP detail panel, or double-click
								     → SA edit modal) and use Remove (CP — keeps the node in the
								     graph) or Delete (SA — removes the node entirely). -->
							</th>
						{/each}
						{/if}
						{#each orderedConcepts as dim}
							{@const wt = (dim.properties?.w as W) || 'who'}
							{#if !collapsedWs.has(wt)}
							<th class="px-2 py-2 text-xs font-semibold whitespace-nowrap border-r relative group {dragId === dim.id && dragType === 'concept' ? 'opacity-30' : ''} {dropTargetId === dim.id && dragType === 'concept' ? (dropPosition === 'before' ? 'border-l-2 !border-l-blue-500' : 'border-r-2 !border-r-blue-500') : ''}"
								style="background-color: {W_BG[wt]}; color: {W_COLORS[wt]}; border-color: {W_BORDER[wt]}; border-top: 2px solid {W_COLORS[wt]};"
								onmouseenter={(e) => showTooltipFor(dim.id, 'concept', e.currentTarget as HTMLElement)}
								onmouseleave={() => scheduleHideTooltip()}
								ondragover={(e) => handleDragOverCol(e, dim.id, 'concept', wt)}
								ondrop={handleConceptDrop}
							>
								<span
									class="inline-flex items-center justify-center w-4 h-3 text-[10px] cursor-grab select-none absolute top-0.5 left-0.5"
									style="color: {W_BORDER[wt]}"
									draggable="true"
									ondragstart={(e) => handleDragStart(e, 'concept', dim.id)}
									ondragend={clearDragState}
									role="img"
									aria-label="Drag to reorder"
								>⠿</span>
								{#if editingDimId === dim.id}
									<input
										use:autofocus
										type="text"
										value={dim.name}
										size={Math.max(dim.name.length, 8)}
										onblur={(e) => { handleConceptNameChange(dim, (e.target as HTMLInputElement).value); editingDimId = null; }}
										onkeydown={(e) => { if (e.key === 'Enter') { handleConceptNameChange(dim, (e.target as HTMLInputElement).value); editingDimId = null; } if (e.key === 'Escape') { editingDimId = null; } }}
										class="text-xs font-semibold px-1 py-0.5 border border-blue-400 rounded outline-none min-w-[80px]"
									/>
								{:else}
									<button type="button" class="cursor-default bg-transparent border-0 p-0 font-semibold text-inherit" onclick={() => onSelectNode(dim.id)} ondblclick={() => (editingDimId = dim.id)}>{dim.name}</button>
								{/if}
								<!-- Per-cell remove button removed (see comment on the domain header above). -->
							</th>
							{/if}
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each displayedEventNodes as ev}
						<tr
								class="hover:bg-blue-50/50 transition-colors border-b border-slate-100 {dragId === ev.id && dragType === 'event' ? 'opacity-30' : ''} {dropTargetId === ev.id && dragType === 'event' ? (dropPosition === 'before' ? 'border-t-2 border-t-blue-500' : 'border-b-2 border-b-blue-500') : ''}"
								ondragover={(e) => handleDragOverRow(e, ev.id)}
								ondrop={(e) => handleDrop(e, eventNodes)}
							>
							<td class="sticky left-0 z-10 bg-white px-1.5 py-1.5 border-r border-slate-200">
								<div class="flex items-stretch">
									<span class="inline-flex items-center justify-end pr-0.5 w-3 shrink-0 text-[10px] text-slate-400 font-mono select-none">{(ev.properties?.order as number) || displayedEventNodes.indexOf(ev) + 1}</span>
									{#if displayedEventNodes.length > 1}
										<span
											class="inline-flex items-center justify-center w-4 shrink-0 text-[10px] text-slate-400 hover:text-slate-600 cursor-grab select-none"
											draggable="true"
											ondragstart={(e) => handleDragStart(e, 'event', ev.id)}
											ondragend={clearDragState}
											role="img"
											aria-label="Drag to reorder"
										>⠿</span>
									{/if}
									<div class="flex-1 min-w-0 p-2 rounded-lg border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/30 transition-colors relative group">
										{#if editingEventId === ev.id}
											<input
												use:autofocus
												type="text"
												bind:value={editingEventName}
												onblur={() => { handleEventNameChange(ev, editingEventName); editingEventId = null; }}
												onkeydown={(e) => { if (e.key === 'Enter') { handleEventNameChange(ev, editingEventName); editingEventId = null; } if (e.key === 'Escape') { editingEventId = null; } }}
												class="text-xs font-semibold px-1 py-0.5 border border-blue-400 rounded outline-none w-full"
											/>
										{:else}
											<button type="button" class="cursor-default bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 text-left w-full truncate" ondblclick={() => { editingEventName = ev.name; editingEventId = ev.id; }}>{ev.name}</button>
										{/if}
										<!-- Per-cell remove button removed (see comment on the domain header above). -->
									</div>
								</div>
							</td>
							<td
								class="text-center text-xs font-semibold px-3 py-2 border-r border-slate-100 {eventMissingStar(ev.id) && getConceptCount(ev.id) > 0 ? 'text-amber-600' : 'text-slate-700'}"
								onmouseenter={(e) => { if (eventMissingStar(ev.id) && getConceptCount(ev.id) > 0) showWarningTooltip(ev.id, e.currentTarget as HTMLElement); }}
								onmouseleave={() => scheduleHideWarningTooltip()}
							>{getConceptCount(ev.id)}{#if eventMissingStar(ev.id) && getConceptCount(ev.id) > 0}<span class="text-amber-500 text-[10px] ml-0.5">!</span>{/if}</td>
							{#if !collapsedDomains}
							{#each displayedDomainNodes as dom}
								{@const mark = getDomainMark(ev.id, dom.id)}
								<td
									class="text-center px-3 py-2 cursor-pointer border-r border-slate-100 hover:bg-violet-100/60 transition-colors w-[60px]"
									onclick={() => toggleDomainMark(ev.id, dom.id)}
								>
									{#if mark === 'check'}
										<span class="text-slate-400 text-base">&#10003;</span>
									{:else if mark === 'star'}
										<span class="text-violet-500 text-lg">&#10029;</span>
									{/if}
								</td>
							{/each}
							{:else}
								<td class="border-r border-slate-100" style="width: 28px; min-width: 28px;"></td>
							{/if}
							{#each orderedConcepts as dim}
								{@const wt = (dim.properties?.w as W) || 'who'}
								{#if !collapsedWs.has(wt)}
								{@const mark = getConceptMark(ev.id, dim.id)}
								<td
									class="text-center px-3 py-2 cursor-pointer border-r border-slate-100 hover:bg-blue-100/60 transition-colors w-[60px]"
									onclick={() => toggleConceptMark(ev.id, dim.id)}
								>
									{#if mark === 'check'}
										<span class="text-emerald-500 text-base">&#10003;</span>
									{:else if mark === 'star'}
										<span class="text-amber-500 text-lg">&#10029;</span>
									{/if}
								</td>
								{/if}
							{/each}
							{#each wSpans as span}
								{#if collapsedWs.has(span.w)}
								<td class="border-r border-slate-100" style="width: 28px; min-width: 28px;"></td>
								{/if}
							{/each}
						</tr>
					{/each}
					<!-- Summary row -->
					{#if displayedEventNodes.length > 0}
						<tr class="bg-slate-50 border-t-2 border-slate-300">
							<td class="sticky left-0 z-10 bg-slate-50 px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-500 border-r border-slate-200">Event Count</td>
							<td class="border-r border-slate-200"></td>
							{#if !collapsedDomains}
							{#each displayedDomainNodes as dom}
								<td class="text-center text-xs font-semibold text-slate-700 px-3 py-2 border-r border-slate-200">
									{domainMarkLinks.filter((l) => l.destination_id === dom.id && ((l.properties?.mark as string) === 'check' || (l.properties?.mark as string) === 'star')).length || ''}
								</td>
							{/each}
							{:else}
								<td class="border-r border-slate-200" style="width: 28px; min-width: 28px;"></td>
							{/if}
							{#each orderedConcepts as dim}
								{@const wt = (dim.properties?.w as W) || 'who'}
								{#if !collapsedWs.has(wt)}
								<td class="text-center text-xs font-semibold text-slate-700 px-3 py-2 border-r border-slate-200">
									{conceptMarkLinks.filter((l) => l.destination_id === dim.id && ((l.properties?.mark as string) === 'check' || (l.properties?.mark as string) === 'star')).length || ''}
								</td>
								{/if}
							{/each}
							{#each wSpans as span}
								{#if collapsedWs.has(span.w)}
								<td class="border-r border-slate-200" style="width: 28px; min-width: 28px;"></td>
								{/if}
							{/each}
						</tr>
					{/if}
				</tbody>
			</table>
		</div>

		{#if eventNodes.length === 0}
			<div class="text-center py-12 text-slate-400">
				<p class="text-sm">No events yet. Click "+ Event" to add your first business event.</p>
				<p class="text-xs mt-2 italic">Use the BEAM pattern: "Subject Verb Object", e.g. "Customer Orders Product"</p>
			</div>
		{/if}
	{/if}
</div>

<!-- Hover tooltip for domains and concepts -->
{#if tooltipId && tooltipItem}
	<div
		class="fixed z-50 w-60"
		style="top: {tooltipY + 4}px; left: {tooltipX - 120}px;"
		onmouseenter={() => cancelHideTooltip()}
		onmouseleave={() => scheduleHideTooltip()}
	>
		<div class="bg-white border text-slate-700 text-[11px] font-normal leading-relaxed rounded-lg shadow-lg px-3 py-2.5"
			style="border-color: {tooltipItem.borderColor};">
			<div class="font-semibold mb-1" style="color: {tooltipItem.color};">{tooltipItem.name}</div>
			{#if tooltipItem.definitionCategory || tooltipItem.definitionDifferentiator}
				<p class="text-slate-600">A <span class="font-semibold" style="color: {tooltipItem.color};">{tooltipItem.definitionCategory || '...'}</span> that {#each (tooltipItem.definitionDifferentiator || '...').split(/(@\{[^}]+\})/) as segment}{#if segment.startsWith('@{') && segment.endsWith('}')}<span class="inline-flex items-center px-1 py-0.5 rounded-full text-[9px] font-medium bg-orange-100 text-orange-700 border border-orange-200">{segment.slice(2, -1)}</span>{:else}<span class="font-semibold" style="color: {tooltipItem.color};">{segment}</span>{/if}{/each}</p>
			{:else if tooltipItem.description}
				<p class="text-slate-600">{tooltipItem.description}</p>
			{:else}
				<p class="text-slate-400 italic">No description yet.</p>
			{/if}
			{#if tooltipType === 'domain' && tooltipItem.owner}
				<div class="mt-1.5 flex items-center gap-1">
					<span class="text-[10px] text-slate-400 uppercase tracking-wider">Owner:</span>
					<span class="text-[10px] text-slate-600 font-medium">{tooltipItem.owner}</span>
				</div>
			{/if}
			{#if tooltipItem.aliases.length > 0}
				<div class="mt-1.5 flex flex-wrap gap-1">
					<span class="text-[10px] text-slate-400 uppercase tracking-wider">Aliases:</span>
					{#each tooltipItem.aliases as alias}
						<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{alias}</span>
					{/each}
				</div>
			{/if}
			{#if tooltipItem.notes}
				<div class="mt-1.5">
					<span class="text-[10px] text-slate-400 uppercase tracking-wider">Notes:</span>
					<p class="text-[10px] text-slate-600 mt-0.5 whitespace-pre-wrap">{tooltipItem.notes}</p>
				</div>
			{/if}
			<button
				class="mt-2 text-[10px] underline cursor-pointer" style="color: {tooltipItem.color};"
				onclick={() => openEditModal(tooltipId!, tooltipType)}
			>Edit details</button>
		</div>
	</div>
{/if}

<!-- Warning tooltip for missing driving concept -->
{#if warningTooltipEventId}
	<div
		class="fixed z-50 w-60"
		style="top: {warningTooltipY + 4}px; left: {warningTooltipX - 120}px;"
		onmouseenter={() => cancelHideWarningTooltip()}
		onmouseleave={() => scheduleHideWarningTooltip()}
	>
		<div class="bg-white border border-amber-300 text-slate-700 text-[11px] font-normal leading-relaxed rounded-lg shadow-lg px-3 py-2.5">
			<div class="font-semibold mb-1 text-amber-600">No driving Concept</div>
			<p class="text-slate-600">No driving Concept has been selected for this Event. Click a Concept cell and toggle to ✭ to mark the driving Concept.</p>
		</div>
	</div>
{/if}

<!-- Edit details modal (shared for domains and concepts) -->
{#if editingDescId}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onclick={() => (editingDescId = null)}>
		<div class="bg-white rounded-xl shadow-xl border border-slate-200 p-5 w-full max-w-md" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-sm font-bold text-slate-700 mb-3">{editingDescType === 'domain' ? 'Domain' : 'Concept'} Details</h3>
			<label class="block text-xs font-medium text-slate-500 mb-1" for="edit-name">Name</label>
			<input
				id="edit-name"
				type="text"
				bind:value={editingNameValue}
				class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
			/>
			<label class="block text-xs font-medium text-slate-500 mb-1 mt-3" for="edit-aliases">Aliases <span class="text-slate-400 font-normal">(comma-separated)</span></label>
			<input
				id="edit-aliases"
				type="text"
				bind:value={editingAliasesValue}
				placeholder="e.g. Revenue, Income"
				class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
			/>
			<label class="block text-xs font-medium text-slate-500 mb-1 mt-3" for="edit-desc">Description</label>
			<textarea
				id="edit-desc"
				bind:value={editingDescValue}
				placeholder="Describe what this {editingDescType === 'domain' ? 'domain' : 'concept'} covers..."
				rows={3}
				class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
			></textarea>
			{#if editingDescType === 'domain'}
				<label class="block text-xs font-medium text-slate-500 mb-1 mt-3" for="edit-owner">Domain Owner</label>
				<input
					id="edit-owner"
					type="text"
					bind:value={editingOwnerValue}
					placeholder="e.g. Sales Manager, Jane Smith"
					class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
				/>
			{:else}
				<label class="block text-xs font-medium text-slate-500 mb-1 mt-3" for="edit-wtype">W's</label>
				<select id="edit-wtype" bind:value={editingW} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
					{#each WS as wt}
						<option value={wt}>{W_LABELS[wt]}</option>
					{/each}
				</select>
			{/if}
			{#if editingDescType === 'concept'}
				<div class="mt-3 rounded-lg border border-orange-200 bg-orange-50/50 p-3">
					<label class="block text-xs font-medium text-orange-600 mb-2">Definition</label>
					<p class="text-xs text-slate-500 mb-2">A <strong>{editingNameValue || 'concept'}</strong> is a <span class="text-orange-600 font-medium">[broader category]</span> that <span class="text-orange-600 font-medium">[distinguishing feature]</span></p>
					<div class="flex items-center gap-2 text-sm text-slate-700">
						<span class="text-xs text-slate-400 shrink-0">is a</span>
						<div class="relative flex-1">
						<input type="text" bind:value={editingDefCategory} placeholder="broader category (genus)"
							oninput={handleDefCatInput}
							onkeydown={handleDefCatKeydown}
							onfocus={() => { defCatQuery = editingDefCategory; handleDefCatInput(); }}
							onblur={() => setTimeout(() => { showDefCatDropdown = false; }, 150)}
							autocomplete="off"
							class="w-full px-2 py-1 border border-orange-200 rounded text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-white" />
						{#if showDefCatDropdown && defCatSuggestions.length > 0}
							<div class="absolute top-full left-0 mt-1 bg-white rounded-lg border border-orange-200 shadow-xl z-[60] py-1 w-56 max-h-40 overflow-y-auto">
								{#each defCatSuggestions as concept, i}
									<button
										type="button"
										onmousedown={(e) => { e.preventDefault(); selectDefCatConcept(concept); }}
										class="w-full text-left px-3 py-1.5 text-sm transition-colors {i === defCatFocusIdx ? 'bg-orange-50 text-orange-800' : 'text-slate-700 hover:bg-slate-50'}"
									>
										<span class="font-medium">{concept.name}</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>
					</div>
					<div class="flex items-center gap-2 text-sm text-slate-700 mt-1.5">
						<span class="text-xs text-slate-400 shrink-0">that</span>
						<div class="relative flex-1">
							<input type="text" bind:value={editingDefDifferentiator} bind:this={mentionInputEl}
								placeholder="distinguishing feature (type @ to link)"
								oninput={handleDiffInput}
								onkeydown={handleDiffKeydown}
								onblur={() => setTimeout(() => { showMentionDropdown = false; }, 150)}
								autocomplete="off"
								class="w-full px-2 py-1 border border-orange-200 rounded text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-white" />
							{#if showMentionDropdown && mentionSuggestions.length > 0}
								<div class="absolute top-full left-0 mt-1 bg-white rounded-lg border border-orange-200 shadow-xl z-[60] py-1 w-64 max-h-40 overflow-y-auto">
									{#each mentionSuggestions as term, i}
										<button
											type="button"
											onmousedown={(e) => { e.preventDefault(); selectMention(term); }}
											class="w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center gap-2 {i === mentionFocusIdx ? 'bg-orange-50 text-orange-800' : 'text-slate-700 hover:bg-slate-50'}"
										>
											<span class="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700 border border-orange-200">@</span>
											<span class="font-medium">{term.name}</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
			<label class="block text-xs font-medium text-slate-500 mb-1 mt-3" for="edit-notes">Notes</label>
			<textarea
				id="edit-notes"
				bind:value={editingNotesValue}
				placeholder="Additional notes..."
				rows={3}
				class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
			></textarea>
			<div class="flex justify-between items-center gap-2 mt-4">
				<!-- Delete on the left, away from Save, to reduce mis-click risk; uses
				     the documented danger-button red palette (see tokens.md § buttons.danger_delete_header). -->
				<button onclick={deleteFromEditModal} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-red-600 border border-red-300 hover:bg-red-50 transition-colors">Delete</button>
				<div class="flex gap-2">
					<button onclick={() => (editingDescId = null)} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-500 border border-slate-300 hover:bg-slate-50 transition-colors">Cancel</button>
					<button onclick={saveEditModal} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 transition-colors">Save</button>
				</div>
			</div>
		</div>
	</div>
{/if}
