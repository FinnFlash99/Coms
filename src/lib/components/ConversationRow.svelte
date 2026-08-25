<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		markConversationRead,
		markConversationResponded,
		toggleTimeSensitive,
		togglePriority,
		preferences,
		toast
	} from '$lib/stores';
	import {
		type Conversation,
		type Contact,
		getConversationStatus,
		relativeTime,
		isMailPlatform,
		familyOf,
		PLATFORMS
	} from '$lib/types';
	import Avatar from './Avatar.svelte';
	import Tag from './Tag.svelte';
	import PlatformChip from './PlatformChip.svelte';
	import Button from './Button.svelte';
	import { Check, Flag, ExternalLink, Star } from 'lucide-svelte';

	interface Props {
		conversation: Conversation;
		contact: Contact;
		isLast?: boolean;
	}

	let { conversation, contact, isLast = false }: Props = $props();

	const status = $derived(getConversationStatus(conversation));
	const urgent = $derived(conversation.timeSensitive && !(conversation.isRead && conversation.isResponded));
	const canRead = $derived(status === 'unread');
	const canRespond = $derived(status !== 'done');
	const isDone = $derived(status === 'done');
	const isMail = $derived(isMailPlatform(conversation.platform));
	const lastMessage = $derived(conversation.messages[conversation.messages.length - 1]);
	const previewText = $derived(
		isMail ? lastMessage?.subject || lastMessage?.content || '' : lastMessage?.content || conversation.lastMessagePreview
	);
	const platformLabel = $derived(`${familyOf(conversation.platform).label} · ${PLATFORMS[conversation.platform].label}`);
	const isPriority = $derived(($preferences.priority || []).includes(contact.id));

	function handleClick() {
		goto(`/conversation/${contact.id}?conv=${conversation.id}`);
	}

	function handleMarkRead(e: MouseEvent) {
		e.stopPropagation();
		markConversationRead(conversation.id);
	}

	function handleMarkResponded(e: MouseEvent) {
		e.stopPropagation();
		markConversationResponded(conversation.id);
	}

	function handleToggleFlag(e: MouseEvent) {
		e.stopPropagation();
		toggleTimeSensitive(conversation.id);
	}

	function handleTogglePriority(e: MouseEvent) {
		e.stopPropagation();
		togglePriority(contact.id);
	}

	function handleOpenIn(e: MouseEvent) {
		e.stopPropagation();
		toast.show(`The full product would open this in ${PLATFORMS[conversation.platform].label}.`);
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="row" class:last={isLast} onclick={handleClick}>
	<Avatar name={contact.name} />

	<div class="content">
		<div class="header">
			{#if status === 'unread'}
				<span class="unread-dot"></span>
			{/if}
			<span class="name">{contact.name}</span>
			<span class="platforms">
				<PlatformChip platform={conversation.platform} label={platformLabel} />
			</span>
		</div>

		<p class="preview" class:mail={isMail} class:unread={status === 'unread'}>
			{previewText}
		</p>

		<div class="chips">
			{#if status === 'unread'}
				<Tag variant="accent">Unread</Tag>
			{:else if status === 'needs'}
				<Tag variant="outline">Needs response</Tag>
			{:else}
				<Tag variant="neutral">Responded</Tag>
			{/if}

			{#if urgent}
				<Tag variant="alert">Time-sensitive</Tag>
			{/if}

			{#if conversation.importance === 'high'}
				<Tag variant="outline">High</Tag>
			{/if}

			{#if isPriority}
				<Tag variant="outline">Priority sender</Tag>
			{/if}

			<Tag variant="neutral">{contact.type}</Tag>
			<Tag variant="neutral">{contact.connection}</Tag>
		</div>

		<div class="open-in-row">
			<button class="btn btn-ghost open-btn" onclick={handleOpenIn}>
				Open in {PLATFORMS[conversation.platform].label}
				<ExternalLink size={12} strokeWidth={1.5} />
			</button>
		</div>
	</div>

	<div class="actions">
		<span class="time text-muted">{relativeTime(conversation.lastMessageAt)}</span>

		{#if canRead}
			<Button variant="secondary" onclick={handleMarkRead}>Mark read</Button>
		{/if}

		{#if canRespond}
			<Button variant="secondary" onclick={handleMarkResponded}>Mark responded</Button>
		{/if}

		{#if isDone}
			<span class="done-indicator text-muted">
				<Check size={13} strokeWidth={1.5} />
				Done
			</span>
		{/if}

		<Button
			variant="secondary"
			title={isPriority ? 'Remove from priority list' : 'Add sender to priority list'}
			onclick={handleTogglePriority}
		>
			<Star
				size={13}
				strokeWidth={1.5}
				fill={isPriority ? 'var(--color-accent)' : 'none'}
				color={isPriority ? 'var(--color-accent)' : 'currentColor'}
			/>
			Priority
		</Button>

		<Button
			variant="secondary"
			title={urgent ? 'Unflag — remove urgent' : 'Flag as urgent'}
			onclick={handleToggleFlag}
		>
			<Flag
				size={13}
				strokeWidth={1.5}
				fill={urgent ? 'var(--color-alert)' : 'none'}
				color={urgent ? 'var(--color-alert)' : 'currentColor'}
			/>
			{urgent ? 'Unflag' : 'Flag'}
		</Button>
	</div>
</div>

<style>
	.row {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		padding: 19px 22px;
		cursor: pointer;
		border-bottom: 1px solid var(--color-divider);
	}

	.row:hover {
		background: color-mix(in srgb, var(--color-text) 4%, transparent);
	}

	.row.last {
		border-bottom: none;
	}

	.content {
		flex: 1;
		min-width: 0;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.unread-dot {
		width: 8px;
		height: 8px;
		flex: none;
		background: var(--color-accent);
		border-radius: 50%;
	}

	.name {
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 18px;
		line-height: 1.1;
	}

	.platforms {
		display: inline-flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.preview {
		display: inline-block;
		max-width: 100%;
		margin: 8px 0 10px;
		padding: 7px 13px;
		font-size: 14.5px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		border: 1px solid var(--color-divider);
		border-radius: 16px;
		border-bottom-left-radius: 5px;
		background: color-mix(in srgb, var(--color-text) 6%, transparent);
		opacity: 0.92;
	}

	.preview.mail {
		display: block;
		padding: 0;
		border: none;
		border-radius: 0;
		background: none;
	}

	.preview.unread {
		font-weight: 500;
		opacity: 1;
	}

	.chips {
		display: flex;
		gap: 6px;
		align-items: center;
		flex-wrap: wrap;
	}

	.open-in-row {
		display: flex;
		margin: 10px 0 0 -6px;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 7px;
		flex: none;
		align-items: flex-end;
		min-width: 150px;
	}

	.time {
		font-size: 12px;
	}

	.done-indicator {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 12px;
	}

	.open-btn {
		font-size: 12px;
		padding: 4px 6px;
	}

	.actions :global(.btn) {
		font-size: 12px;
		padding: 5px 11px;
	}
</style>
