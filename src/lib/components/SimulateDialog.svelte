<script lang="ts">
	import { contacts, simulateMessage, toast } from '$lib/stores';
	import { PLATFORMS, type Platform, type Importance } from '$lib/types';
	import Dialog from './Dialog.svelte';
	import Button from './Button.svelte';
	import SegmentedControl from './SegmentedControl.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open, onclose }: Props = $props();

	let contactId = $state('c1');
	let platform = $state<Platform>('slack');
	let content = $state('');
	let importance = $state<Importance>('normal');
	let timeSensitive = $state(false);

	const platformOptions = Object.entries(PLATFORMS).map(([id, p]) => ({
		id: id as Platform,
		label: p.label
	}));

	const importanceOptions = [
		{ value: 'low' as const, label: 'Low' },
		{ value: 'normal' as const, label: 'Normal' },
		{ value: 'high' as const, label: 'High' }
	];

	function deliver() {
		const wasTimeSensitive = simulateMessage(contactId, platform, content, importance, timeSensitive);
		toast.show('Message delivered' + (wasTimeSensitive ? ' — flagged time-sensitive' : ''));

		// Reset form
		content = '';
		timeSensitive = false;
		importance = 'normal';
		onclose();
	}
</script>

<Dialog title="Simulate incoming message" {open} {onclose}>
	<div class="form-grid">
		<div class="field">
			<label for="sim-contact">Contact</label>
			<select id="sim-contact" class="input" bind:value={contactId}>
				{#each $contacts as c}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="sim-platform">Platform</label>
			<select id="sim-platform" class="input" bind:value={platform}>
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
			bind:value={content}
		></textarea>
	</div>

	<div class="options-row">
		<div class="field" style="margin: 0;">
			<label>Importance</label>
			<SegmentedControl
				options={importanceOptions}
				value={importance}
				name="coms-sim-imp"
				onchange={(v) => (importance = v)}
			/>
		</div>
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={timeSensitive} />
			Time-sensitive
		</label>
	</div>

	<p class="text-muted hint">
		Deadlines like "tomorrow at 3pm" are auto-detected as time-sensitive.
	</p>

	{#snippet actions()}
		<Button variant="secondary" onclick={onclose}>Cancel</Button>
		<Button variant="primary" onclick={deliver}>Deliver message</Button>
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
		align-items: center;
	}

	.checkbox-label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		align-self: flex-end;
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
	}

	.field label {
		font-size: 12px;
		color: color-mix(in srgb, var(--color-text) 70%, transparent);
	}

	textarea.input {
		min-height: 90px;
		resize: vertical;
	}
</style>
