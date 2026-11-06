<script lang="ts">
	// Steps 2 and 3: an add field over the Domains or the Core Business Events.
	// Capture happens live on a shared screen, so the add field is the full
	// form input, and Enter adds and keeps the cursor in the field. The cards
	// are the Canvas tab's cards: a click on a card opens the edit popup.
	import CanvasCard from '$lib/components/canvas/CanvasCard.svelte';
	import type { ContextNode } from '$lib/cp-shared';
	import { ADD_PLACEHOLDER } from '../../../canon/steps';
	import { DOMAIN_COLOR } from '../../../types';
	import { BUTTON, INPUT, TEXT } from '../../../ui/tokens';

	let {
		kind,
		nodes,
		onAdd,
		onSelectNode
	}: {
		kind: 'domain' | 'event';
		nodes: ContextNode[];
		onAdd: (name: string) => Promise<void>;
		onSelectNode: (id: string) => void;
	} = $props();

	// The Domain violet and the Core Business Event green the Canvas tab uses
	const color = $derived(kind === 'domain' ? DOMAIN_COLOR : '#16a34a');
	const heading = $derived(kind === 'domain' ? 'Domains' : 'Core Business Events');

	let value = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	async function submit() {
		const text = value.trim();
		if (!text) return;
		value = '';
		inputEl?.focus();
		try {
			await onAdd(text);
		} catch (err) {
			// Give the text back, so a failed save does not lose what was typed
			console.error('Add failed', err);
			if (!value) value = text;
		}
	}
</script>

<section class="space-y-2">
	<div class="flex items-center justify-between">
		<h3 class={TEXT.sectionHeading} style="color: {color}">{heading}</h3>
		<span class={TEXT.count}>{nodes.length}</span>
	</div>

	<div class="flex items-center gap-2">
		<input
			bind:this={inputEl}
			bind:value
			type="text"
			placeholder={ADD_PLACEHOLDER[kind]}
			aria-label={ADD_PLACEHOLDER[kind]}
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
		<button type="button" class="{BUTTON.add} shrink-0" onclick={submit}>Add</button>
	</div>

	{#if nodes.length > 0}
		<div class="space-y-1.5">
			{#each nodes as node (node.id)}
				<CanvasCard {node} {color} onSelect={onSelectNode} />
			{/each}
		</div>
	{/if}
</section>
