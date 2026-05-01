<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { createBemStore } from '$lib/stores/domain.svelte';
	import { createStandaloneAdapter } from '$lib/adapters/standalone-adapter';
	import { bemToContextPlane, contextPlaneToBem } from '$lib/converters/context-plane';
	import type { DataAdapter, ContextNode, ContextLink } from '$lib/cp-shared';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import Instructions from '$lib/components/Instructions.svelte';
	import BusinessEventMatrixLayout from '$lib/components/canvas/BusinessEventMatrixLayout.svelte';

	const store = createBemStore();
	setContext('bemStore', store);

	let activeTab = $state<string>('matrix');
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

	async function loadOtherModelConcepts() {
		const savedList = store.getSavedList();
		const currentId = store.getModel().id;
		const extras: ContextNode[] = [];
		for (const s of savedList) {
			if (s.id === currentId) continue;
			try {
				const res = await fetch(`/api/models/${s.id}`);
				const m = await res.json();
				const { nodes: otherNodes } = bemToContextPlane(m);
				for (const n of otherNodes) {
					if (n.label === 'global_concept') extras.push(n);
				}
			} catch {}
		}
		otherModelConcepts = extras;
	}

	const graphData = $derived.by(() => {
		void version;
		if (!loaded) return { nodes: [] as ContextNode[], links: [] as ContextLink[] };
		return bemToContextPlane(store.getModel());
	});

	const nodes = $derived([...graphData.nodes, ...otherModelConcepts.filter((n) => !graphData.nodes.some((gn) => gn.id === n.id))]);
	const links = $derived(graphData.links);

	let realAdapter: DataAdapter | null = null;

	const proxyAdapter: DataAdapter = {
		async getNodes(filter) { return realAdapter?.getNodes(filter) ?? []; },
		async getNode(id) { return realAdapter?.getNode(id) ?? null; },
		async createNode(input) { const result = await realAdapter!.createNode(input); version++; return result; },
		async updateNode(id, updates) { const result = await realAdapter!.updateNode(id, updates); version++; return result; },
		async deleteNode(id) { await realAdapter!.deleteNode(id); version++; },
		async getLinks(filter) { return realAdapter?.getLinks(filter) ?? []; },
		async createLink(input) { const result = await realAdapter!.createLink(input); version++; return result; },
		async deleteLink(id) { await realAdapter!.deleteLink(id); version++; },
		async exportAll() { return realAdapter?.exportAll() ?? { nodes: [], links: [] }; },
		async importAll(data) { await realAdapter?.importAll(data); version++; }
	};

	setContext('dataAdapter', proxyAdapter);

	onMount(async () => {
		await store.initStore();
		const sa = createStandaloneAdapter(store);
		realAdapter = sa.adapter;
		loaded = true;
		await loadOtherModelConcepts();
	});

	function handleSelectNode(id: string) {}

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

{#if activeTab === 'matrix'}
	{#if loaded}
		<div class="px-6 py-3 border-b border-slate-200 bg-white shrink-0">
			<Toolbar bind:activeTab />
		</div>
		<div class="flex-1 overflow-hidden flex flex-col">
			<BusinessEventMatrixLayout
				{nodes}
				{links}
				onSelectNode={handleSelectNode}
				onAddNode={handleAddNode}
				showModelSelector={false}
				showToolbar={false}
				showTabs={false}
			/>
		</div>
	{:else}
		<div class="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>
	{/if}
{:else}
	{#if loaded}
		<div class="px-6 py-3 border-b border-slate-200 bg-white shrink-0">
			<Toolbar bind:activeTab />
		</div>
	{/if}
	<div class="p-6 overflow-y-auto flex-1">
		<Instructions />
	</div>
{/if}
