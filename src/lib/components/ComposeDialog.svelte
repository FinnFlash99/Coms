<script lang="ts">
	import { contacts, conversations, sendNewMessage } from '$lib/stores';
	import { PLATFORMS, type Platform } from '$lib/types';
	import Dialog from './Dialog.svelte';
	import Button from './Button.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
		onsent: (conversationId: string, contactId: string, platform: Platform) => void;
	}

	let { open, onclose, onsent }: Props = $props();

	let contactId = $state('c1');
	let platform = $state<Platform>('slack');
	let content = $state('');

	const platformOptions = Object.entries(PLATFORMS).map(([id, p]) => ({
		id: id as Platform,
		label: p.label
	}));

	const contactName = $derived($contacts.find((c) => c.id === contactId)?.name.split(' (')[0] ?? '');
	const platformLabel = $derived(PLATFORMS[platform].label);
	const hasExisting = $derived(
		$conversations.some((v) => v.contactId === contactId && v.platform === platform)
	);
	const hint = $derived(
		hasExisting
			? `Adds to your existing ${platformLabel} thread with ${contactName}.`
			: `Starts a new ${platformLabel} thread with ${contactName}.`
	);
	const isEmpty = $derived(!content.trim());

	function send() {
		const result = sendNewMessage(contactId, platform, content);
		if (!result) return;
		content = '';
		onsent(result.conversationId, contactId, platform);
	}
</script>

<Dialog title="New message" {open} {onclose}>
	<div class="form-grid">
		<div class="field">
			<label for="cmp-contact">To</label>
			<select id="cmp-contact" class="input" bind:value={contactId}>
				{#each $contacts as c}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="cmp-platform">Send via</label>
			<select id="cmp-platform" class="input" bind:value={platform}>
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
			bind:value={content}
		></textarea>
	</div>

	<p class="text-muted hint">{hint}</p>

	{#snippet actions()}
		<Button variant="secondary" onclick={onclose}>Cancel</Button>
		<Button variant="primary" disabled={isEmpty} onclick={send}>Send</Button>
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
