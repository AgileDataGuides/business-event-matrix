<script lang="ts">
	// Step 8: the gaps to look at before the matrix is used. Each gap names
	// what is missing, lists the items, and goes to the step that fills it.
	// A gap is a prompt to look, never a block: a Domain no Event happens in
	// can be right for this matrix.
	import { NEEDS_EARLIER_STEP, getStep, stepLabel, type StepId } from '../../../canon/steps';
	import { count, findGaps, type MatrixView } from '../../../model/matrix-view';
	import { BUTTON, CARD, GAP_ITEM, NAME_BUTTON, ROW_ACTION, STATE_CHIP, STEP_PANEL, TEXT } from '../../../ui/tokens';

	let {
		matrix,
		onSelectNode,
		onGoToStep,
		onOpenMatrix
	}: {
		matrix: MatrixView;
		onSelectNode: (id: string) => void;
		onGoToStep: (id: StepId) => void;
		onOpenMatrix?: () => void;
	} = $props();

	const gaps = $derived(findGaps(matrix));
</script>

<div class="space-y-3">
	{#if matrix.events.length === 0}
		<p class={TEXT.empty}>{NEEDS_EARLIER_STEP.events}</p>
	{:else if gaps.length === 0}
		<div class="{CARD} flex items-center gap-2">
			<span class="{STATE_CHIP.base} {STATE_CHIP.positive}">No gaps found</span>
			<span class={STEP_PANEL.description}>
				{count(matrix.events.length, 'Event', 'Events')}, each in a Domain, with a driving Concept, and every Domain and Concept in use.
			</span>
		</div>
	{:else}
		{#each gaps as gap (gap.id)}
			<div class={CARD}>
				<div class="flex items-start justify-between gap-3 mb-2">
					<h3 class={TEXT.cardTitle}>{gap.heading}</h3>
					<span class="{STATE_CHIP.base} {STATE_CHIP.warning} shrink-0">{gap.items.length}</span>
				</div>
				<ul class="flex flex-wrap gap-x-3 gap-y-1 mb-2">
					{#each gap.items as item (item.id)}
						<li>
							<button type="button" class="{GAP_ITEM} {NAME_BUTTON}" onclick={() => onSelectNode(item.id)}>{item.name}</button>
						</li>
					{/each}
				</ul>
				<button type="button" class={ROW_ACTION} onclick={() => onGoToStep(gap.fixStep)}>Go to {stepLabel(getStep(gap.fixStep))}</button>
			</div>
		{/each}
	{/if}

	{#if onOpenMatrix && matrix.events.length > 0}
		<div class="pt-2">
			<button type="button" class={BUTTON.secondary} onclick={onOpenMatrix}>Open the Matrix tab</button>
		</div>
	{/if}
</div>
