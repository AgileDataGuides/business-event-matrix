<script lang="ts">
	// The Steps tab: the Business Event Matrix filled in one step at a time.
	// A rail of steps on the left, the selected step's panel on the right,
	// Back and Next under the panel. A checklist, never a wizard: every step
	// is reachable at any time and no step blocks another. Each row's status
	// line reads off the matrix, so the Steps tab and the Matrix tab are two
	// views of the same Events, Domains, Concepts and marks.
	//
	// Relative imports, never $lib: the Context Plane imports this view
	// through BusinessEventMatrixLayout, and $lib there is its own folder.
	import { STEP_CONTENT, STEP_NAV, STEP_PANEL, STEP_RAIL } from '../../ui/tokens';
	import { STEPS, stepLabel, type StepCanon, type StepId } from '../../canon/steps';
	import { stepStatus, type MatrixActions, type MatrixView } from '../../model/matrix-view';
	import ScopePanel from './steps/ScopePanel.svelte';
	import AddList from './steps/AddList.svelte';
	import ConceptsPanel from './steps/ConceptsPanel.svelte';
	import MarkPanel from './steps/MarkPanel.svelte';
	import CheckPanel from './steps/CheckPanel.svelte';

	let {
		matrix,
		actions,
		onSelectNode,
		onOpenMatrix,
		selected = $bindable()
	}: {
		matrix: MatrixView;
		actions: MatrixActions;
		/** Opens a Domain, Event or Concept in the host's edit popup, the same as on the Matrix tab. */
		onSelectNode: (id: string) => void;
		/** Shows the Matrix tab, where the host has one. */
		onOpenMatrix?: () => void;
		/** The selected step. A host can bind it; an unknown value falls back to the remembered step. */
		selected?: string;
	} = $props();

	// Without a step from the host, the selected step is a per-viewer convenience, remembered in this browser
	const STORAGE_KEY = 'bem-active-step';

	function isStep(value: string | null | undefined): value is StepId {
		return STEPS.some((s) => s.id === value);
	}

	function remembered(): StepId {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (isStep(saved)) return saved;
		} catch {
			// no storage: start at Step 1
		}
		return STEPS[0].id;
	}

	if (!isStep(selected)) selected = remembered();
	const stepIndex = $derived(Math.max(0, STEPS.findIndex((s) => s.id === selected)));
	const step = $derived(STEPS[stepIndex]);

	function select(target: StepCanon | StepId) {
		const id = typeof target === 'string' ? target : target.id;
		selected = id;
		try {
			localStorage.setItem(STORAGE_KEY, id);
		} catch {
			// no storage: the choice lasts until reload
		}
	}

	// Back and Next: the steps either side of this one
	const previous = $derived(stepIndex > 0 ? STEPS[stepIndex - 1] : undefined);
	const next = $derived(stepIndex < STEPS.length - 1 ? STEPS[stepIndex + 1] : undefined);

	// A step opens at its top, whether it was picked on the rail or with Back and Next
	let scroller = $state<HTMLElement>();
	$effect(() => {
		void step;
		scroller?.scrollTo({ top: 0 });
	});

	const statuses = $derived(new Map(STEPS.map((s) => [s.id, stepStatus(matrix, s.id)])));
</script>

<div class="flex h-full min-h-0">
	<nav class={STEP_RAIL.container} aria-label="The steps">
		<ul class="py-2">
			{#each STEPS as s (s.id)}
				{@const active = s.id === step.id}
				{@const status = statuses.get(s.id)}
				<li>
					<button
						type="button"
						aria-current={active ? 'step' : undefined}
						class="{STEP_RAIL.row} {active ? STEP_RAIL.rowActive : STEP_RAIL.rowInactive}"
						onclick={() => select(s)}
					>
						<span class={status?.started ? STEP_RAIL.dotStarted : STEP_RAIL.dotEmpty}></span>
						<span class="min-w-0">
							<span class="block {active ? STEP_RAIL.labelActive : STEP_RAIL.labelInactive}">{stepLabel(s)}</span>
							<span class="block {STEP_RAIL.status}">{status?.line}</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
	</nav>

	<section class="flex-1 min-w-0 flex flex-col overflow-hidden bg-slate-50">
		<div bind:this={scroller} class="flex-1 overflow-y-auto {STEP_PANEL.body}">
			<header class="space-y-1 pb-3 mb-4 border-b border-slate-200">
				<p class={STEP_PANEL.label}>{stepLabel(step)}</p>
				<h2 class={STEP_PANEL.question}>{step.question}</h2>
				<p class={STEP_PANEL.description}>{step.description}</p>
				{#if step.guide}
					<p class={STEP_PANEL.guide}>{step.guide}</p>
				{/if}
			</header>
			<div class={STEP_CONTENT}>
				{#if step.id === 'scope'}
					<ScopePanel model={matrix.model} {actions} />
				{:else if step.id === 'domains'}
					<AddList kind="domain" nodes={matrix.domains} onAdd={actions.addDomain} {onSelectNode} />
				{:else if step.id === 'events'}
					<AddList kind="event" nodes={matrix.events} onAdd={actions.addEvent} {onSelectNode} />
				{:else if step.id === 'concepts'}
					<ConceptsPanel concepts={matrix.concepts} onAdd={actions.addConcept} {onSelectNode} />
				{:else if step.id === 'event-domains'}
					<MarkPanel mode="domains" {matrix} {actions} {onSelectNode} />
				{:else if step.id === 'event-concepts'}
					<MarkPanel mode="concepts" {matrix} {actions} {onSelectNode} />
				{:else if step.id === 'driving'}
					<MarkPanel mode="driving" {matrix} {actions} {onSelectNode} />
				{:else if step.id === 'check'}
					<CheckPanel {matrix} {onSelectNode} onGoToStep={select} {onOpenMatrix} />
				{/if}
			</div>
		</div>

		<nav class={STEP_NAV.bar} aria-label="Move between steps">
			{#if previous}
				{@const to = previous}
				<button type="button" class={STEP_NAV.button} title="Back: {stepLabel(to)}" onclick={() => select(to)}>
					<svg class={STEP_NAV.icon} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
					</svg>
					<span class={STEP_NAV.label}>Back: {stepLabel(to)}</span>
				</button>
			{:else}
				<span></span>
			{/if}
			{#if next}
				{@const to = next}
				<button type="button" class={STEP_NAV.button} title="Next: {stepLabel(to)}" onclick={() => select(to)}>
					<span class={STEP_NAV.label}>Next: {stepLabel(to)}</span>
					<svg class={STEP_NAV.icon} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
					</svg>
				</button>
			{/if}
		</nav>
	</section>
</div>
