<script lang="ts">
	import { contacts, conversations, showCompose, composeState, closeComposeDialog, sendComposeAndNavigate } from '$lib/stores';
	import { PLATFORMS, type Platform } from '$lib/types';
	import Dialog from './Dialog.svelte';
	import Button from './Button.svelte';

	const platformOptions = Object.entries(PLATFORMS).map(([id, p]) => ({
		id: id as Platform,
		label: p.label
	}));

	const contactName = $derived(
		$contacts.find((c) => c.id === $composeState.contactId)?.name.split(' (')[0] ?? ''
	);
	const platformLabel = $derived(PLATFORMS[$composeState.platform].label);
	const hasExisting = $derived(
		$conversations.some(
			(v) => v.contactId === $composeState.contactId && v.platform === $composeState.platform
		)
	);
	const hint = $derived(
		hasExisting
			? `Adds to your existing ${platformLabel} thread with ${contactName}.`
			: `Starts a new ${platformLabel} thread with ${contactName}.`
	);
	const isEmpty = $derived(!$composeState.content.trim());
</script>

<Dialog title="New message" open={$showCompose} onclose={closeComposeDialog}>
	<div class="form-grid">
		<div class="field">
			<label for="cmp-contact">To</label>
			<select id="cmp-contact" class="input" bind:value={$composeState.contactId}>
				{#each $contacts as c}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="cmp-platform">Send via</label>
			<select id="cmp-platform" class="input" bind:value={$composeState.platform}>
				{#each platformOptions as p}
					<option value={p.id}>{p.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="field">
		<label for="cmp-message">Message</label>
		<textarea
			id="cmp-message"
			class="input"
			placeholder="Write your message…"
			bind:value={$composeState.content}
		></textarea>
	</div>

	<p class="text-muted hint">{hint}</p>

	{#snippet actions()}
		<Button variant="secondary" onclick={closeComposeDialog}>Cancel</Button>
		<Button variant="primary" disabled={isEmpty} onclick={sendComposeAndNavigate}>Send</Button>
	{/snippet}
</Dialog>

<style>
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
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

	.field label {
		font-size: 12px;
		color: color-mix(in srgb, var(--color-text) 70%, transparent);
	}

	.form-grid .field {
		margin: 0;
	}

	textarea.input {
		min-height: 96px;
	}
</style>
