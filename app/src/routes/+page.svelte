<script lang="ts">
	import { onMount, setContext, untrack } from 'svelte';
	import { createBemStore } from '$lib/stores/domain.svelte';
	import { applyBemDemoSeeds } from '$lib/stores/demo-seed';
	import { createStandaloneAdapter } from '$lib/adapters/standalone-adapter';
	import { bemToContextPlane, contextPlaneToBem } from '$lib/converters/context-plane';
	import type { DataAdapter, ContextNode, ContextLink } from '$lib/cp-shared';
	import { nodeHasLabel } from '$lib/cp-shared';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import Instructions from '$lib/components/Instructions.svelte';
	import BusinessEventMatrixLayout from '$lib/components/canvas/BusinessEventMatrixLayout.svelte';
	import BemCanvasView from '$lib/components/canvas/BemCanvasView.svelte';
	import ConceptCardEditModal from '$lib/components/canvas/ConceptCardEditModal.svelte';

	const store = createBemStore();
	setContext('bemStore', store);

	let activeTab = $state<string>('steps');
	let loaded = $state(false);
	let version = $state(0);

	// Model management
	let showSwitcher = $state(false);
	let showNew = $state(false);
	let newModelName = $state('');

	function handleClickOutsideSwitcher(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-model-switcher]')) showSwitcher = false;
	}

	function handleNew() {
		const name = newModelName.trim();
		if (!name) return;
		store.newModel(name);
		newModelName = '';
		showNew = false;
	}

	function handleDelete() {
		if (!confirm(`Delete "${store.getModel().name}"?`)) return;
		store.deleteModel(store.getModel().id);
	}

	/**
	 * Import a BEM model file as a NEW matrix (never overwrites the current one).
	 * store.importJSON handles the creation side: it uniquifies the imported
	 * name against existing IDs and calls apiCreateModel, so the existing
	 * matrix stays in the list and the new one lands alongside it.
	 *
	 * Accepts native BEM JSON ({ id, concepts|dimensions, events, ... }) or a
	 * Context Plane graph export ({ nodes, links }) — the latter is converted
	 * via contextPlaneToBem before import.
	 */
	function handleImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			if (file.size > 5 * 1024 * 1024) {
				alert('File too large (max 5MB)');
				return;
			}
			try {
				const text = await file.text();
				const data = JSON.parse(text);
				if (data.nodes && data.links) {
					const bemModel = contextPlaneToBem(data);
					await store.importJSON(JSON.stringify(bemModel));
				} else {
					await store.importJSON(text);
				}
			} catch {
				alert('Could not parse JSON file');
			}
		};
		input.click();
	}

	// Extra concept nodes from other saved models (for typeahead linking)
	let otherModelConcepts = $state<ContextNode[]>([]);

	async function loadOtherModelConcepts(currentId: string) {
		const others = store.getSavedList().filter((s) => s.id !== currentId);
		const perMatrix = await Promise.all(
			others.map(async (s) => {
				try {
					// Concept nodes carry more than one label ('global_concept,global_glossary_term')
					return bemToContextPlane(await store.readSavedModel(s.id)).nodes.filter((n) => nodeHasLabel(n, 'global_concept'));
				} catch {
					return [];
				}
			})
		);
		// A quicker switch may have opened another matrix while this one was loading
		if (store.getModel().id === currentId) otherModelConcepts = perMatrix.flat();
	}

	// Reload the other matrices' Concepts whenever a different matrix opens
	$effect(() => {
		if (!loaded) return;
		const currentId = store.getModel().id;
		untrack(() => loadOtherModelConcepts(currentId));
	});

	const graphData = $derived.by(() => {
		void version;
		if (!loaded) return { nodes: [] as ContextNode[], links: [] as ContextLink[] };
		return bemToContextPlane(store.getModel());
	});

	// The other matrices' Concepts are suggestions only: each name once, and never a
	// node or a name this matrix already has (the list can lag a matrix switch).
	// Only the + Concept typeahead gets them: the Canvas tab and the edit modal get graphData.nodes.
	const suggestions = $derived.by(() => {
		const ownIds = new Set(graphData.nodes.map((n) => n.id));
		const taken = new Set(
			graphData.nodes.filter((n) => nodeHasLabel(n, 'global_concept')).map((n) => n.name.toLowerCase())
		);
		return otherModelConcepts.filter((n) => {
			const key = n.name.toLowerCase();
			if (ownIds.has(n.id) || taken.has(key)) return false;
			taken.add(key);
			return true;
		});
	});
	const nodes = $derived([...graphData.nodes, ...suggestions]);
	const links = $derived(graphData.links);

	let realAdapter: DataAdapter | null = null;

	function otherModelConcept(id: string): ContextNode | undefined {
		return suggestions.find((n) => n.id === id);
	}

	// The W picked for a suggestion that has none, held until the link copies it in.
	// Kept off the suggestion itself, so the suggestion keeps its source matrix's W after the copy-in.
	const pendingW = new Map<string, unknown>();

	// A Concept from another matrix is not in this matrix's store, so the standalone
	// adapter cannot link it. Picking one copies it into this matrix instead.
	async function copyConceptIn(source: ContextNode, modelId: string): Promise<ContextLink> {
		const p = source.properties ?? {};
		const w = pendingW.get(source.id) ?? p.w;
		pendingW.delete(source.id);
		const created = await realAdapter!.createNode({ label: 'global_concept', name: source.name, properties: { w } });
		await realAdapter!.updateNode(created.id, {
			description: source.description ?? '',
			properties: {
				aliases: p.aliases ?? [],
				notes: p.notes,
				definitionCategory: p.definitionCategory,
				definitionDifferentiator: p.definitionDifferentiator
			}
		});
		const ts = new Date().toISOString();
		return { id: `link-${modelId}-has-concept-${created.id}`, source_id: modelId, destination_id: created.id, label: 'has_concept', created_at: ts, updated_at: ts };
	}

	const proxyAdapter: DataAdapter = {
		async getNodes(filter) { return realAdapter?.getNodes(filter) ?? []; },
		async getNode(id) { return realAdapter?.getNode(id) ?? null; },
		async createNode(input) { const result = await realAdapter!.createNode(input); version++; return result; },
		async updateNode(id, updates) {
			const other = otherModelConcept(id);
			if (other) {
				pendingW.set(id, updates.properties?.w);
				return { ...other, ...updates, properties: { ...other.properties, ...updates.properties } };
			}
			const result = await realAdapter!.updateNode(id, updates); version++; return result;
		},
		async deleteNode(id) { await realAdapter!.deleteNode(id); version++; },
		async getLinks(filter) { return realAdapter?.getLinks(filter) ?? []; },
		async createLink(input) {
			const other = input.label === 'has_concept' ? otherModelConcept(input.destination_id) : undefined;
			const result = other ? await copyConceptIn(other, input.source_id) : await realAdapter!.createLink(input);
			version++;
			return result;
		},
		async deleteLink(id) { await realAdapter!.deleteLink(id); version++; },
		async exportAll() { return realAdapter?.exportAll() ?? { nodes: [], links: [] }; },
		async importAll(data) { await realAdapter?.importAll(data); version++; }
	};

	setContext('dataAdapter', proxyAdapter);

	onMount(async () => {
		// Apply demo seeds BEFORE initStore so the store sees seeded localStorage
		// as the source of truth on first/cold visit. No-op outside demo mode.
		const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
		if (isDemo) applyBemDemoSeeds();

		await store.initStore();
		const sa = createStandaloneAdapter(store);
		realAdapter = sa.adapter;
		loaded = true;
	});

	// Card edit modal — clicking a card on the Canvas tab (or a domain/concept
	// label on the Matrix tab) opens the shared ConceptCardEditModal with the
	// same fields the
	// Matrix tab's "Edit details" tooltip button uses: name, description,
	// aliases, owner (domain) / w-type + definition (concept), notes. Save /
	// delete go through the DataAdapter from context.
	let editingCardId = $state<string | null>(null);
	const editingCardNode = $derived(
		editingCardId ? nodes.find((n) => n.id === editingCardId) ?? null : null
	);

	function handleSelectNode(id: string) {
		editingCardId = id;
	}

	async function handleAddNode(entityLabel: string, name: string) {
		await proxyAdapter.createNode({ label: entityLabel, name });
	}
</script>

<svelte:window onclick={handleClickOutsideSwitcher} />

<!-- App Header (dark) -->
<header class="bg-slate-900 text-white px-6 py-3 shrink-0">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-lg font-bold tracking-tight">Business Events Matrix</h1>
			<p class="text-xs text-slate-400 mt-0.5">Map business events across domains and concepts</p>
		</div>
		{#if loaded}
			<div class="flex items-center gap-2" data-model-switcher>
				<div class="relative">
					<button
						onclick={() => (showSwitcher = !showSwitcher)}
						class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-800 text-sm"
					>
						<span class="text-slate-300">{store.getModel().name}</span>
						<svg class="w-3.5 h-3.5 text-slate-400 transition-transform {showSwitcher ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if showSwitcher}
						<div class="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 min-w-[200px]">
							{#each store.getSavedList() as item}
								<button
									onclick={() => { store.switchTo(item.id); showSwitcher = false; }}
									class="w-full text-left px-4 py-2 text-sm transition-colors {item.id === store.getModel().id ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600 hover:bg-slate-50'}"
								>{item.name}</button>
							{/each}
						</div>
					{/if}
				</div>
				{#if showNew}
					<input type="text" placeholder="Matrix name..." bind:value={newModelName} onkeydown={(e) => e.key === 'Enter' && handleNew()} class="px-3 py-1.5 border border-slate-600 bg-slate-800 text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-40 placeholder-slate-500" />
					<button onclick={handleNew} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">Create</button>
					<button onclick={() => { showNew = false; newModelName = ''; }} class="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
				{:else}
					<button onclick={() => (showNew = true)} class="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-300 border border-slate-600 hover:bg-slate-800 transition-colors">New Matrix</button>
					<!-- Import sits next to New Matrix because Import IS a creation
					     action — it always lands as a brand-new matrix alongside
					     the existing ones, never overwriting the current model. -->
					<button
						onclick={handleImport}
						class="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-300 border border-slate-600 hover:bg-slate-800 transition-colors"
						title="Import a BEM JSON file as a new matrix"
					>Import</button>
				{/if}
				<button onclick={handleDelete} class="px-3 py-1.5 text-sm font-medium rounded-lg text-red-400 border border-slate-600 hover:bg-slate-800 transition-colors">Delete</button>
			</div>
		{/if}
	</div>
</header>

{#if loaded}
	<div class="px-6 py-3 border-b border-slate-200 bg-white shrink-0">
		<Toolbar bind:activeTab />
	</div>
{/if}

{#if activeTab === 'matrix' || activeTab === 'steps'}
	{#if loaded}
		<div class="flex-1 overflow-hidden flex flex-col">
			<BusinessEventMatrixLayout
				{nodes}
				{links}
				onSelectNode={handleSelectNode}
				onAddNode={handleAddNode}
				showModelSelector={false}
				showToolbar={false}
				showTabs={false}
				activeBemTab={activeTab === 'steps' ? 'steps' : 'matrix'}
				onBemTabChange={(tab) => (activeTab = tab)}
			/>
		</div>
	{:else}
		<div class="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>
	{/if}
{:else if activeTab === 'canvas'}
	{#if loaded}
		<div class="flex-1 overflow-hidden flex flex-col">
			<BemCanvasView
				nodes={graphData.nodes}
				{links}
				onSelectNode={handleSelectNode}
				onAddNode={handleAddNode}
			/>
		</div>
	{:else}
		<div class="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>
	{/if}
{:else}
	<div class="p-6 overflow-y-auto flex-1">
		<Instructions />
	</div>
{/if}

{#if editingCardNode}
	<ConceptCardEditModal
		node={editingCardNode}
		allNodes={graphData.nodes}
		onClose={() => (editingCardId = null)}
	/>
{/if}
