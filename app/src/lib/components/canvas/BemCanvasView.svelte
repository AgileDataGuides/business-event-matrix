<script lang="ts">
	/**
	 * BemCanvasView — card-based view of the BEM model's three core entity
	 * collections: Concepts (the matrix columns), Core Business Events (the
	 * matrix rows), and Domains (the row groupings).
	 *
	 * Matrix tab is the dense intersection grid. This Canvas tab is the same
	 * data laid out as add/edit/remove card sections — useful when the user
	 * wants to manage the entity catalogs themselves without thinking about
	 * intersection marks.
	 *
	 * Both views read from / write to the same store, so adding a Concept here
	 * adds a column to the Matrix and vice versa. Wiring goes through the
	 * standard DataAdapter from context (same pattern Data Contract / IPC use).
	 *
	 * Design tokens — all values come straight from the existing BEM section in
	 * design/DESIGN_SYSTEM.md (§ Business Event Matrix). No new tokens added:
	 *   - Concepts:              #2563eb  (blue-600 — DESIGN_SYSTEM "W-Type: What")
	 *   - Core Business Events:  #16a34a  (green-600 — DESIGN_SYSTEM "W-Type: Who" / bem_model)
	 *   - Domains:               #7c3aed  (violet-600 — DESIGN_SYSTEM bem_domain)
	 *
	 * The matrix uses `bem_dimension` historically; the converter today emits
	 * `global_concept` as the primary label (with `bem_dimension` as a legacy
	 * fallback). We accept both so concepts created via the Matrix tab show up
	 * here too.
	 */
	import CanvasSection from '$lib/components/canvas/CanvasSection.svelte';
	import { getNodeLabels } from '$lib/cp-shared';
	import type { ContextNode, ContextLink } from '$lib/cp-shared';

	let {
		nodes,
		links,
		onSelectNode,
		onAddNode,
		onAddExisting
	}: {
		nodes: ContextNode[];
		links: ContextLink[];
		onSelectNode: (id: string) => void;
		onAddNode: (entityLabel: string, name: string) => void;
		onAddExisting?: (entityLabel: string) => void;
	} = $props();

	// Suppress unused-warning while keeping the prop in the contract — `links`
	// isn't read here today (the three sections only need their own entity
	// nodes), but every BEM canvas component takes both for parity.
	void links;

	const COLORS = {
		concept: '#2563eb',  // blue-600 (token: dict_column blue-600)
		event: '#16a34a',    // green-600 (token: global_core_business_event)
		domain: '#7c3aed'    // violet-600 (token: global_domain)
	};

	function nodesByLabels(...labels: string[]): ContextNode[] {
		return nodes.filter((n) => {
			const nodeLabels = getNodeLabels(n);
			return labels.some((l) => nodeLabels.includes(l));
		});
	}

	// Concepts: prefer global_concept (current converter output), accept
	// bem_dimension as legacy fallback for older graphs.
	const conceptNodes = $derived(nodesByLabels('global_concept', 'bem_dimension'));
	const eventNodes = $derived(nodesByLabels('bem_event'));
	const domainNodes = $derived(nodesByLabels('bem_domain'));
</script>

<div class="flex-1 overflow-auto p-6 bg-slate-50">
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
		<CanvasSection
			title="Concepts"
			entityLabel="bem_dimension"
			nodes={conceptNodes}
			color={COLORS.concept}
			{onSelectNode}
			{onAddNode}
			onAddExisting={onAddExisting}
		/>
		<CanvasSection
			title="Core Business Events"
			entityLabel="bem_event"
			nodes={eventNodes}
			color={COLORS.event}
			{onSelectNode}
			{onAddNode}
			onAddExisting={onAddExisting}
		/>
		<CanvasSection
			title="Domains"
			entityLabel="bem_domain"
			nodes={domainNodes}
			color={COLORS.domain}
			{onSelectNode}
			{onAddNode}
			onAddExisting={onAddExisting}
		/>
	</div>
</div>
