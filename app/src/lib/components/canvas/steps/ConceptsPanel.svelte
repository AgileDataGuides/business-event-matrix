<script lang="ts">
	// Step 5: the Concepts, each added under one of the 7W's. The W stays
	// picked after an add, so a run of Who's goes in without a click between
	// them. The list shows the Concepts under their W, in the matrix's colours,
	// and a click opens a Concept the same as on the Matrix tab.
	import CanvasCard from '$lib/components/canvas/CanvasCard.svelte';
	import type { ContextNode } from '$lib/cp-shared';
	import { ADD_PLACEHOLDER } from '../../../canon/steps';
	import { conceptW } from '../../../model/matrix-view';
	import { WS, W_COLORS, W_LABELS, type W } from '../../../types';
	import { BUTTON, CHIP, INPUT, TEXT } from '../../../ui/tokens';

	let {
		concepts,
		onAdd,
		onSelectNode
	}: {
		concepts: ContextNode[];
		onAdd: (name: string, w: W) => Promise<void>;
		onSelectNode: (id: string) => void;
	} = $props();

	let w = $state<W>('who');
	let value = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	const groups = $derived(WS.map((wt) => ({ w: wt, nodes: concepts.filter((c) => conceptW(c) === wt) })));

	async function submit() {
		const text = value.trim();
		if (!text) return;
		value = '';
		inputEl?.focus();
		try {
			await onAdd(text, w);
		} catch (err) {
			// Give the text back, so a failed save does not lose what was typed
			console.error('Add failed', err);
			if (!value) value = text;
		}
	}
</script>

<div class="space-y-5">
	<div class="space-y-2">
		<div class="flex items-center gap-2">
			<span class={TEXT.label}>7W</span>
			<div class={CHIP.wrapper} role="radiogroup" aria-label="The W for the next Concept">
				{#each WS as wt (wt)}
					<button
						type="button"
						role="radio"
						aria-checked={w === wt}
						class="{CHIP.base} {w === wt ? CHIP.active : CHIP.inactive}"
						onclick={() => {
							w = wt;
							inputEl?.focus();
						}}
					>{W_LABELS[wt]}</button>
				{/each}
			</div>
		</div>
		<div class="flex items-center gap-2">
			<input
				bind:this={inputEl}
				bind:value
				type="text"
				placeholder={ADD_PLACEHOLDER.concept}
				aria-label="{ADD_PLACEHOLDER.concept}, as a {W_LABELS[w]}"
				class={INPUT.text}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						submit();
					} else if (e.key === 'Escape') {
						value = '';
					}
				}}
			/>
			<button type="button" class="{BUTTON.add} shrink-0" onclick={submit}>Add as {W_LABELS[w]}</button>
		</div>
	</div>

	{#each groups as group (group.w)}
		{#if group.nodes.length > 0}
			<section class="space-y-2">
				<div class="flex items-center justify-between">
					<h3 class={TEXT.sectionHeading} style="color: {W_COLORS[group.w]}">{W_LABELS[group.w]}</h3>
					<span class={TEXT.count}>{group.nodes.length}</span>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
					{#each group.nodes as node (node.id)}
						<CanvasCard {node} color={W_COLORS[group.w]} onSelect={onSelectNode} />
					{/each}
				</div>
			</section>
		{/if}
	{/each}
</div>
