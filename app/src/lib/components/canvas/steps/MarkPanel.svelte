<script lang="ts">
	// Steps 4, 6 and 7: one card per Core Business Event, with a chip for each
	// thing it can be marked with. A click on a chip marks or unmarks it, and
	// writes the same mark the matrix cell holds.
	//   - domains:  every Domain. A click gives a ✓, or takes the mark off.
	//   - concepts: every Concept, under its 7W. A click gives a ✓, or takes the mark off.
	//   - driving:  only the Concepts the Event involves. A click turns a ✓ into
	//               the ✭ that marks the driving Concept, and back.
	// A Domain or Concept that already holds a ✭ shows it, so no mark is hidden.
	import { SvelteSet } from 'svelte/reactivity';
	import type { ContextNode } from '$lib/cp-shared';
	import { NEEDS_EARLIER_STEP } from '../../../canon/steps';
	import { conceptW, count, markOf, type Mark, type MatrixActions, type MatrixView } from '../../../model/matrix-view';
	import { WS, W_COLORS, W_LABELS } from '../../../types';
	import { CARD, CHIP, NAME_BUTTON, STAR, STATE_CHIP, TEXT, W_LABEL } from '../../../ui/tokens';

	let {
		mode,
		matrix,
		actions,
		onSelectNode
	}: {
		mode: 'domains' | 'concepts' | 'driving';
		matrix: MatrixView;
		actions: MatrixActions;
		onSelectNode: (id: string) => void;
	} = $props();

	const targets = $derived(mode === 'domains' ? matrix.domains : matrix.concepts);
	const marks = $derived(mode === 'domains' ? matrix.domainMarks : matrix.conceptMarks);

	/** The chips for one Event, in groups: one group of Domains, or one group per 7W. */
	function groupsFor(eventId: string): { heading?: string; color?: string; nodes: ContextNode[] }[] {
		if (mode === 'domains') return [{ nodes: matrix.domains }];
		const offered = mode === 'driving' ? matrix.concepts.filter((c) => markOf(marks, eventId, c.id)) : matrix.concepts;
		return WS.map((w) => ({ heading: W_LABELS[w], color: W_COLORS[w], nodes: offered.filter((c) => conceptW(c) === w) })).filter(
			(g) => g.nodes.length > 0
		);
	}

	// One write at a time per chip, so a double click never writes the mark twice
	const pending = new SvelteSet<string>();

	async function toggle(eventId: string, targetId: string) {
		const key = `${eventId}|${targetId}`;
		if (pending.has(key)) return;
		const current = markOf(marks, eventId, targetId);
		let next: Mark;
		if (mode === 'driving') next = current === 'star' ? 'check' : 'star';
		else next = current ? '' : 'check';
		pending.add(key);
		try {
			if (mode === 'domains') await actions.setDomainMark(eventId, targetId, next);
			else await actions.setConceptMark(eventId, targetId, next);
		} finally {
			pending.delete(key);
		}
	}

	function markedCount(eventId: string): number {
		return marks.get(eventId)?.size ?? 0;
	}

	function hasStar(eventId: string): boolean {
		return [...(marks.get(eventId)?.values() ?? [])].includes('star');
	}

	const emptyLine = $derived.by(() => {
		if (matrix.events.length === 0) return NEEDS_EARLIER_STEP.events;
		if (targets.length === 0) return mode === 'domains' ? NEEDS_EARLIER_STEP.domains : NEEDS_EARLIER_STEP.concepts;
		return '';
	});
</script>

{#if emptyLine}
	<p class={TEXT.empty}>{emptyLine}</p>
{:else}
	<div class="space-y-2">
		{#each matrix.events as event (event.id)}
			{@const groups = groupsFor(event.id)}
			<div class={CARD}>
				<div class="flex items-start justify-between gap-3 mb-2">
					<button type="button" class="{TEXT.cardTitle} {NAME_BUTTON}" onclick={() => onSelectNode(event.id)}>
						{event.name}
					</button>
					{#if mode === 'driving'}
						{#if markedCount(event.id) > 0 && !hasStar(event.id)}
							<span class="{STATE_CHIP.base} {STATE_CHIP.warning} shrink-0">No driving Concept</span>
						{/if}
					{:else}
						<span class="{TEXT.count} shrink-0">
							{count(markedCount(event.id), mode === 'domains' ? 'Domain' : 'Concept', mode === 'domains' ? 'Domains' : 'Concepts')}
						</span>
					{/if}
				</div>
				{#if groups.length === 0}
					<p class={TEXT.empty}>{NEEDS_EARLIER_STEP.linked}</p>
				{:else}
					<div class="space-y-1.5">
						{#each groups as group, i (i)}
							<div class="flex items-start gap-2">
								{#if group.heading}
									<span class="{TEXT.sectionHeading} {W_LABEL}" style="color: {group.color}">{group.heading}</span>
								{/if}
								<div class={CHIP.wrapper}>
									{#each group.nodes as target (target.id)}
										{@const mark = markOf(marks, event.id, target.id)}
										<button
											type="button"
											aria-pressed={mode === 'driving' ? mark === 'star' : !!mark}
											class="{CHIP.base} {(mode === 'driving' ? mark === 'star' : !!mark) ? CHIP.active : CHIP.inactive}"
											onclick={() => toggle(event.id, target.id)}
										>
											{#if mark === 'star'}<span class={STAR} aria-hidden="true">✭</span>{/if}
											{target.name}
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
