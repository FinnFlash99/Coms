<script lang="ts">
	import { contacts, showSimulate, simulateState, closeSimulateDialog, simulateMessage } from '$lib/stores';
	import { PLATFORMS, type Platform, type Importance } from '$lib/types';
	import Dialog from './Dialog.svelte';
	import Button from './Button.svelte';
	import SegmentedControl from './SegmentedControl.svelte';

	const platformOptions = Object.entries(PLATFORMS).map(([id, p]) => ({
		id: id as Platform,
		label: p.label
	}));

	const importanceOptions: Array<{ value: Importance; label: string }> = [
		{ value: 'low', label: 'Low' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'high', label: 'High' }
	];

	function handleImportanceChange(importance: Importance) {
		simulateState.update((s) => ({ ...s, importance }));
	}
</script>

<Dialog title="Simulate incoming message" open={$showSimulate} onclose={closeSimulateDialog}>
	<div class="form-grid">
		<div class="field">
			<label for="sim-contact">From</label>
			<select id="sim-contact" class="input" bind:value={$simulateState.contactId}>
				{#each $contacts as c}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="sim-platform">Platform</label>
			<select id="sim-platform" class="input" bind:value={$simulateState.platform}>
				{#each platformOptions as p}
					<option value={p.id}>{p.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="field">
		<label for="sim-message">Message</label>
		<textarea
			id="sim-message"
			class="input"
			placeholder="e.g. Can you send the files by tomorrow 3pm?"
			bind:value={$simulateState.content}
		></textarea>
	</div>

	<div class="options-row">
		<div class="field" style="margin: 0;">
			<span class="field-label">Importance</span>
			<SegmentedControl
				options={importanceOptions}
				value={$simulateState.importance}
				name="coms-sim-imp"
				onchange={handleImportanceChange}
			/>
		</div>
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={$simulateState.ts} />
			Time-sensitive
		</label>
	</div>

	<p class="text-muted hint">Deadlines like "tomorrow at 3pm" are auto-detected as time-sensitive.</p>

	{#snippet actions()}
		<Button variant="secondary" onclick={closeSimulateDialog}>Cancel</Button>
		<Button variant="primary" onclick={simulateMessage}>Deliver message</Button>
	{/snippet}
</Dialog>

<style>
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.options-row {
		display: flex;
		gap: 22px;
		flex-wrap: wrap;
		align-items: flex-end;
	}

	.checkbox-label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		padding-bottom: 8px;
		cursor: pointer;
	}

	.checkbox-label input {
		width: 15px;
		height: 15px;
		accent-color: var(--color-accent);
	}

	.hint {
		font-size: 12px;
		margin: 0;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 5px;
		margin: 0 0 14px;
	}

	.field .field-label {
		font-size: 12px;
		color: color-mix(in srgb, var(--color-text) 70%, transparent);
	}

	.form-grid .field {
		margin: 0;
	}

	textarea.input {
		min-height: 80px;
	}
</style>
