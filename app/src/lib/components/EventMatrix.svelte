<script lang="ts">
	import { getContext } from 'svelte';
	import { WS, W_LABELS, W_COLORS, W_BG, W_BORDER, DOMAIN_COLOR, DOMAIN_BG, DOMAIN_BORDER } from '$lib/types';
	import type { W, Concept, Domain } from '$lib/types';
	import type { BemStore } from '$lib/stores/domain.svelte';

	const store = getContext<BemStore>('bemStore');

	/** Auto-focus action — focuses and selects the input on mount */
	function autofocus(node: HTMLInputElement) {
		node.focus();
		node.select();
	}

	let model = $derived(store.getModel());
	let events = $derived(store.getSortedEvents());
	let dimsByW = $derived(store.getConceptsByW());
	let domains = $derived(store.getSortedDomains());

	let orderedDims = $derived.by(() => {
		const result: Concept[] = [];
		for (const wt of WS) {
			const group = dimsByW.get(wt);
			if (group) result.push(...group);
		}
		return result;
	});

	let wSpans = $derived.by(() => {
		const spans: { w: W; label: string; count: number; color: string; bg: string; border: string }[] = [];
		for (const wt of WS) {
			const group = dimsByW.get(wt);
			if (group && group.length > 0) {
				spans.push({
					w: wt,
					label: W_LABELS[wt],
					count: group.length,
					color: W_COLORS[wt],
					bg: W_BG[wt],
					border: W_BORDER[wt]
				});
			}
		}
		return spans;
	});

	let editingModelName = $state(false);
	let editingModelDesc = $state(false);
	let editingEventId = $state<string | null>(null);
	let editingDimId = $state<string | null>(null);
	let editingDomainId = $state<string | null>(null);

	let newEventName = $state('');
	let showAddEvent = $state(false);
	let newDimName = $state('');
	let newDimW = $state<W>('who');
	let showAddDim = $state(false);
	let newDomainName = $state('');
	let showAddDomain = $state(false);
	let editingDescId = $state<string | null>(null);
	let editingNameValue = $state('');
	let editingDescValue = $state('');
	let editingAliasesValue = $state('');
	let editingOwnerValue = $state('');
	let editingW = $state<W>('who');
	let editingDescType = $state<'domain' | 'concept'>('domain');

	// Shared tooltip state for domains and concepts
	let tooltipId = $state<string | null>(null);
	let tooltipType = $state<'domain' | 'concept'>('domain');
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

	function showTooltip(id: string, type: 'domain' | 'concept', el: HTMLElement) {
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

	let tooltipItem = $derived.by(() => {
		if (!tooltipId) return null;
		if (tooltipType === 'domain') {
			const dom = domains.find(d => d.id === tooltipId);
			return dom ? { name: dom.name, description: dom.description, aliases: dom.aliases || [], owner: dom.owner || '', w: null, color: DOMAIN_COLOR, borderColor: DOMAIN_BORDER } : null;
		} else {
			const dim = orderedDims.find(d => d.id === tooltipId);
			return dim ? { name: dim.name, description: dim.description, aliases: dim.aliases || [], owner: '', w: dim.w, color: W_COLORS[dim.w], borderColor: W_BORDER[dim.w] } : null;
		}
	});

	function handleAddEvent() {
		if (!newEventName.trim()) return;
		store.addEvent(newEventName.trim());
		newEventName = '';
		showAddEvent = false;
	}

	function handleAddDim() {
		if (!newDimName.trim()) return;
		store.addConcept(newDimName.trim(), newDimW);
		newDimName = '';
		showAddDim = false;
	}

	function handleAddDomain() {
		if (!newDomainName.trim()) return;
		store.addDomain(newDomainName.trim());
		newDomainName = '';
		showAddDomain = false;
	}
</script>

<!-- Model Header -->
<div class="mb-4">
	{#if editingModelName}
		<input
			type="text"
			value={model.name}
			onblur={(e) => { store.renameModel((e.target as HTMLInputElement).value); editingModelName = false; }}
			onkeydown={(e) => { if (e.key === 'Enter') { store.renameModel((e.target as HTMLInputElement).value); editingModelName = false; } }}
			class="text-2xl font-bold text-slate-900 px-2 py-1 border border-blue-500 rounded-lg outline-none w-full max-w-md"
		/>
	{:else}
		<h2 class="text-2xl font-bold text-slate-900 cursor-default" ondblclick={() => (editingModelName = true)}>{model.name}</h2>
	{/if}

	{#if editingModelDesc}
		<input
			type="text"
			value={model.description}
			onblur={(e) => { store.updateDescription((e.target as HTMLInputElement).value); editingModelDesc = false; }}
			onkeydown={(e) => { if (e.key === 'Enter') { store.updateDescription((e.target as HTMLInputElement).value); editingModelDesc = false; } }}
			class="text-sm text-slate-500 px-2 py-1 border border-blue-500 rounded-lg outline-none w-full max-w-lg mt-1"
		/>
	{:else}
		<p class="text-sm text-slate-500 mt-1 cursor-default" ondblclick={() => (editingModelDesc = true)}>
			{model.description || 'Double-click to add description'}
		</p>
	{/if}
</div>

<!-- Action Buttons -->
<div class="flex flex-wrap items-center gap-2 mb-4">
	{#if showAddEvent}
		<input
			type="text"
			placeholder="e.g. Customer Orders Product"
			bind:value={newEventName}
			onkeydown={(e) => e.key === 'Enter' && handleAddEvent()}
			class="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
		/>
		<button onclick={handleAddEvent} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">Add Event</button>
		<button onclick={() => (showAddEvent = false)} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors">Cancel</button>
	{:else}
		<button onclick={() => (showAddEvent = true)} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">+ Event</button>
	{/if}

	<div class="w-px h-6 bg-slate-200"></div>

	{#if showAddDomain}
		<input
			type="text"
			placeholder="e.g. Sales, Finance"
			bind:value={newDomainName}
			onkeydown={(e) => e.key === 'Enter' && handleAddDomain()}
			class="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none w-44"
		/>
		<button onclick={handleAddDomain} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors">Add Domain</button>
		<button onclick={() => (showAddDomain = false)} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors">Cancel</button>
	{:else}
		<button onclick={() => (showAddDomain = true)} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors">+ Domain</button>
	{/if}

	<div class="w-px h-6 bg-slate-200"></div>

	{#if showAddDim}
		<input
			type="text"
			placeholder="e.g. Customer"
			bind:value={newDimName}
			onkeydown={(e) => e.key === 'Enter' && handleAddDim()}
			class="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-44"
		/>
		<select bind:value={newDimW} class="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
			{#each WS as wt}
				<option value={wt}>{W_LABELS[wt]}</option>
			{/each}
		</select>
		<button onclick={handleAddDim} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">Add Concept</button>
		<button onclick={() => (showAddDim = false)} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors">Cancel</button>
	{:else}
		<button onclick={() => (showAddDim = true)} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">+ Concept</button>
	{/if}
</div>

<!-- Event Matrix Table -->
<div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
	<table class="w-auto min-w-full border-collapse text-sm">
		<thead>
			<!-- W's group header -->
			<tr>
				<th rowspan="2" class="sticky left-0 z-20 bg-slate-100 text-slate-600 px-4 py-2 text-left min-w-[220px] border-r border-slate-200">
					<div class="flex flex-col">
						<span class="text-[10px] font-semibold uppercase tracking-wider text-left">Events</span>
					</div>
				</th>
				<th rowspan="2" class="bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase tracking-wider px-3 py-2 whitespace-nowrap border-r border-slate-200">Concepts</th>
				{#if domains.length > 0}
					<th
						colspan={domains.length}
						class="text-[11px] font-bold uppercase tracking-wider px-3 py-2 text-center border-r"
						style="background-color: {DOMAIN_BG}; color: {DOMAIN_COLOR}; border-color: {DOMAIN_BORDER};"
					>
						Domains
					</th>
				{/if}
				{#each wSpans as span}
					<th
						colspan={span.count}
						class="text-[11px] font-bold uppercase tracking-wider px-3 py-2 text-center border-r"
						style="background-color: {span.bg}; color: {span.color}; border-color: {span.border};"
					>
						{span.label}
					</th>
				{/each}
			</tr>
			<!-- Domain + Concept names -->
			<tr>
				{#each domains as dom}
					<th class="px-3 py-2 text-xs font-semibold whitespace-nowrap border-r relative group"
						style="background-color: {DOMAIN_BG}; color: {DOMAIN_COLOR}; border-color: {DOMAIN_BORDER}; border-top: 2px solid {DOMAIN_COLOR};"
						data-domain-id={dom.id}
						onmouseenter={(e) => showTooltip(dom.id, 'domain', e.currentTarget as HTMLElement)}
						onmouseleave={() => scheduleHideTooltip()}
					>
						{#if editingDomainId === dom.id}
							<input
								use:autofocus
								type="text"
								value={dom.name}
								size={Math.max(dom.name.length, 8)}
								onblur={(e) => { store.updateDomain(dom.id, { name: (e.target as HTMLInputElement).value }); editingDomainId = null; }}
								onkeydown={(e) => { if (e.key === 'Enter') { store.updateDomain(dom.id, { name: (e.target as HTMLInputElement).value }); editingDomainId = null; } if (e.key === 'Escape') { editingDomainId = null; } }}
								class="text-xs font-semibold px-1 py-0.5 border border-violet-400 rounded outline-none min-w-[80px]"
							/>
						{:else}
							<span class="cursor-default" ondblclick={() => (editingDomainId = dom.id)}>{dom.name}</span>
						{/if}
						<button
							class="absolute top-0.5 right-0.5 hidden group-hover:flex items-center justify-center w-4 h-4 text-[10px] text-red-400 hover:text-white hover:bg-red-500 rounded"
							title="Remove domain"
							onclick={() => store.removeDomain(dom.id)}
						>x</button>
					</th>
				{/each}
				{#each orderedDims as dim}
					<th class="px-3 py-2 text-xs font-semibold whitespace-nowrap border-r relative group"
						style="background-color: {W_BG[dim.w]}; color: {W_COLORS[dim.w]}; border-color: {W_BORDER[dim.w]}; border-top: 2px solid {W_COLORS[dim.w]};"
						onmouseenter={(e) => showTooltip(dim.id, 'concept', e.currentTarget as HTMLElement)}
						onmouseleave={() => scheduleHideTooltip()}
					>
						{#if editingDimId === dim.id}
							<input
								use:autofocus
								type="text"
								value={dim.name}
								size={Math.max(dim.name.length, 8)}
								onblur={(e) => { store.updateConcept(dim.id, { name: (e.target as HTMLInputElement).value }); editingDimId = null; }}
								onkeydown={(e) => { if (e.key === 'Enter') { store.updateConcept(dim.id, { name: (e.target as HTMLInputElement).value }); editingDimId = null; } if (e.key === 'Escape') { editingDimId = null; } }}
								class="text-xs font-semibold px-1 py-0.5 border border-blue-400 rounded outline-none min-w-[80px]"
							/>
						{:else}
							<span class="cursor-default" ondblclick={() => (editingDimId = dim.id)}>{dim.name}</span>
						{/if}
						<button
							class="absolute top-0.5 right-0.5 hidden group-hover:flex items-center justify-center w-4 h-4 text-[10px] text-red-400 hover:text-white hover:bg-red-500 rounded"
							title="Remove concept"
							onclick={() => store.removeConcept(dim.id)}
						>x</button>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each events as ev}
				<tr class="hover:bg-blue-50/50 transition-colors border-b border-slate-100">
					<td class="sticky left-0 z-10 bg-white px-4 py-2 font-medium text-slate-700 whitespace-nowrap border-r border-slate-200 relative group">
						{#if editingEventId === ev.id}
							<input
								use:autofocus
								type="text"
								value={ev.name}
								onblur={(e) => { store.updateEvent(ev.id, { name: (e.target as HTMLInputElement).value }); editingEventId = null; }}
								onkeydown={(e) => { if (e.key === 'Enter') { store.updateEvent(ev.id, { name: (e.target as HTMLInputElement).value }); editingEventId = null; } if (e.key === 'Escape') { editingEventId = null; } }}
								class="text-sm font-semibold px-1 py-0.5 border border-blue-400 rounded outline-none w-full"
							/>
						{:else}
							<span class="cursor-default" ondblclick={() => (editingEventId = ev.id)}>{ev.name}</span>
						{/if}
						<button
							class="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-4 h-4 text-[10px] text-red-400 hover:text-white hover:bg-red-500 rounded"
							title="Remove event"
							onclick={() => store.removeEvent(ev.id)}
						>x</button>
					</td>
					<td class="text-center text-xs font-semibold text-slate-700 px-3 py-2 border-r border-slate-100">{store.getConceptCount(ev.id)}</td>
					{#each domains as dom}
						<td
							class="text-center px-3 py-2 cursor-pointer border-r border-slate-100 hover:bg-violet-100/60 transition-colors w-[60px]"
							onclick={() => store.toggleDomainMark(ev.id, dom.id)}
						>
							{#if ev.domains?.[dom.id] === 'check'}
								<span class="text-violet-500 text-base">&#10003;</span>
							{:else if ev.domains?.[dom.id] === 'star'}
								<span class="text-violet-500 text-lg">&#10029;</span>
							{/if}
						</td>
					{/each}
					{#each orderedDims as dim}
						<td
							class="text-center px-3 py-2 cursor-pointer border-r border-slate-100 hover:bg-blue-100/60 transition-colors w-[60px]"
							onclick={() => store.toggleMark(ev.id, dim.id)}
						>
							{#if ev.concepts[dim.id] === 'check'}
								<span class="text-emerald-500 text-base">&#10003;</span>
							{:else if ev.concepts[dim.id] === 'star'}
								<span class="text-amber-500 text-lg">&#10029;</span>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
			<!-- Summary row -->
			{#if events.length > 0}
				<tr class="bg-slate-50 border-t-2 border-slate-300">
					<td class="sticky left-0 z-10 bg-slate-50 px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-500 border-r border-slate-200">Event Count</td>
					<td class="border-r border-slate-200"></td>
					{#each domains as dom}
						<td class="text-center text-xs font-semibold text-slate-700 px-3 py-2 border-r border-slate-200">
							{events.filter((e) => e.domains?.[dom.id] === 'check' || e.domains?.[dom.id] === 'star').length || ''}
						</td>
					{/each}
					{#each orderedDims as dim}
						<td class="text-center text-xs font-semibold text-slate-700 px-3 py-2 border-r border-slate-200">
							{events.filter((e) => e.concepts[dim.id] === 'check' || e.concepts[dim.id] === 'star').length || ''}
						</td>
					{/each}
				</tr>
			{/if}
		</tbody>
	</table>
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
			{#if tooltipItem.description}
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
			<button
				class="mt-2 text-[10px] underline cursor-pointer" style="color: {tooltipItem.color};"
				onclick={() => { editingDescId = tooltipId; editingDescType = tooltipType; editingNameValue = tooltipItem!.name; editingDescValue = tooltipItem!.description || ''; editingAliasesValue = tooltipItem!.aliases.join(', '); editingOwnerValue = tooltipItem!.owner || ''; editingW = tooltipItem!.w || 'who'; tooltipId = null; }}
			>Edit details</button>
		</div>
	</div>
{/if}

<!-- Edit details modal (shared for domains and concepts) -->
{#if editingDescId}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onclick={() => (editingDescId = null)}>
		<div class="bg-white rounded-xl shadow-xl border border-slate-200 p-5 w-full max-w-md" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-sm font-bold text-slate-700 mb-3">{editingDescType === 'domain' ? 'Domain' : 'Concept'} Details</h3>
			<label class="block text-xs font-medium text-slate-500 mb-1">Name</label>
			<input
				type="text"
				bind:value={editingNameValue}
				class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
			/>
			<label class="block text-xs font-medium text-slate-500 mb-1 mt-3">Description</label>
			<textarea
				bind:value={editingDescValue}
				placeholder="Describe what this {editingDescType === 'domain' ? 'domain' : 'concept'} covers..."
				rows={3}
				class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
			></textarea>
			{#if editingDescType === 'domain'}
				<label class="block text-xs font-medium text-slate-500 mb-1 mt-3">Domain Owner</label>
				<input
					type="text"
					bind:value={editingOwnerValue}
					placeholder="e.g. Sales Manager, Jane Smith"
					class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
				/>
			{:else}
				<label class="block text-xs font-medium text-slate-500 mb-1 mt-3">W-Type</label>
				<select bind:value={editingW} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
					{#each WS as wt}
						<option value={wt}>{W_LABELS[wt]}</option>
					{/each}
				</select>
			{/if}
			<label class="block text-xs font-medium text-slate-500 mb-1 mt-3">Aliases <span class="text-slate-400 font-normal">(comma-separated)</span></label>
			<input
				type="text"
				bind:value={editingAliasesValue}
				placeholder="e.g. Revenue, Income"
				class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
			/>
			<div class="flex justify-end gap-2 mt-4">
				<button onclick={() => (editingDescId = null)} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors">Cancel</button>
				<button onclick={() => {
					const aliases = editingAliasesValue.split(',').map(a => a.trim()).filter(a => a.length > 0);
					if (editingDescType === 'domain') {
						store.updateDomain(editingDescId!, { name: editingNameValue, description: editingDescValue, aliases, owner: editingOwnerValue });
					} else {
						store.updateConcept(editingDescId!, { name: editingNameValue, description: editingDescValue, aliases, w: editingW });
					}
					editingDescId = null;
				}} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">Save</button>
			</div>
		</div>
	</div>
{/if}

{#if events.length === 0}
	<div class="text-center py-12 text-slate-400">
		<p class="text-sm">No events yet. Click "+ Event" to add your first business event.</p>
		<p class="text-xs mt-2 italic">Use the BEAM pattern: "Subject Verb Object", e.g. "Customer Orders Product"</p>
	</div>
{/if}
