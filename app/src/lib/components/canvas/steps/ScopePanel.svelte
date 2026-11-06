<script lang="ts">
	// Step 1: the matrix's name and its scope line, the same two values the
	// toolbar shows over the Matrix tab. Each saves when the field loses focus,
	// and Enter in the name saves it too.
	import type { ContextNode } from '$lib/cp-shared';
	import type { MatrixActions } from '../../../model/matrix-view';
	import { INPUT } from '../../../ui/tokens';

	let { model, actions }: { model: ContextNode; actions: MatrixActions } = $props();

	// What is typed, until it is saved. A change from elsewhere (the toolbar, another matrix) resets it
	let name = $derived(model.name);
	let description = $derived(model.description ?? '');

	function saveName() {
		const text = name.trim();
		if (!text) {
			name = model.name;
			return;
		}
		if (text !== model.name) actions.updateModel({ name: text });
	}

	function saveDescription() {
		const text = description.trim();
		if (text !== (model.description ?? '').trim()) actions.updateModel({ description: text });
	}
</script>

<div class="space-y-4">
	<div>
		<label for="bem-step-name" class={INPUT.label}>Matrix name</label>
		<input
			id="bem-step-name"
			type="text"
			class={INPUT.text}
			value={name}
			oninput={(e) => (name = e.currentTarget.value)}
			onblur={saveName}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					e.currentTarget.blur();
				}
			}}
		/>
	</div>
	<div>
		<label for="bem-step-scope" class={INPUT.label}>Scope</label>
		<textarea
			id="bem-step-scope"
			rows="3"
			class={INPUT.textarea}
			placeholder="For example: the SaaS customer funnel, from the first ad click to renewal or cancellation."
			value={description}
			oninput={(e) => (description = e.currentTarget.value)}
			onblur={saveDescription}
		></textarea>
	</div>
</div>
