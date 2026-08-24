<script lang="ts">
	import { page } from '$app/stores';
	import { ChevronLeft, Flag, ExternalLink } from 'lucide-svelte';
	import {
		contacts,
		conversations,
		updateContact,
		markConversationRead,
		markConversationResponded,
		toggleTimeSensitive,
		updateConversationImportance,
		toast
	} from '$lib/stores';
	import {
		type ContactType,
		type ConnectionStrength,
		type Importance,
		getConversationStatus,
		relativeTime,
		formatTime,
		PLATFORMS
	} from '$lib/types';
	import Blueprint from '$components/Blueprint.svelte';
	import Button from '$components/Button.svelte';
	import Avatar from '$components/Avatar.svelte';
	import Tag from '$components/Tag.svelte';
	import PlatformChip from '$components/PlatformChip.svelte';
	import SegmentedControl from '$components/SegmentedControl.svelte';
	import DemoBadge from '$components/DemoBadge.svelte';

	const contactId = $derived($page.params.id);
	const contact = $derived($contacts.find((c) => c.id === contactId));

	// Get conversations for this contact
	const contactConversations = $derived(
		$conversations.filter((c) => c.contactId === contactId).sort((a, b) => b.lastMessageAt - a.lastMessageAt)
	);

	const platformSummary = $derived(
		[...new Set(contactConversations.map((c) => PLATFORMS[c.platform].label))].join(', ')
	);

	const relationshipOptions: Array<{ value: ContactType; label: string }> = [
		{ value: 'Client', label: 'Client' },
		{ value: 'Subcontractor', label: 'Subcontractor' },
		{ value: 'Vendor', label: 'Vendor' },
		{ value: 'Personal', label: 'Personal' }
	];

	const connectionOptions: Array<{ value: ConnectionStrength; label: string }> = [
		{ value: 'Close', label: 'Close' },
		{ value: 'Regular', label: 'Regular' },
		{ value: 'Occasional', label: 'Occasional' },
		{ value: 'New', label: 'New' }
	];

	function handleRelationshipChange(type: ContactType) {
		if (contact) updateContact(contact.id, { type });
	}

	function handleConnectionChange(connection: ConnectionStrength) {
		if (contact) updateContact(contact.id, { connection });
	}
</script>

{#if contact}
	<div class="detail animate-in">
		<a href="/" class="back-link btn btn-ghost">
			<ChevronLeft size={14} strokeWidth={1.5} />
			Back to inbox
		</a>

		<header class="contact-header">
			<Avatar name={contact.name} size="lg" />
			<div>
				<h2>{contact.name}</h2>
				<p class="text-muted">{contact.type} · {platformSummary}</p>
			</div>
		</header>

		<div class="controls">
			<div class="field">
				<span class="field-label">Relationship</span>
				<SegmentedControl
					options={relationshipOptions}
					value={contact.type}
					name="coms-rel"
					onchange={handleRelationshipChange}
				/>
			</div>
			<div class="field">
				<span class="field-label">Connection</span>
				<SegmentedControl
					options={connectionOptions}
					value={contact.connection}
					name="coms-con"
					onchange={handleConnectionChange}
				/>
			</div>
		</div>

		<div class="threads">
			{#each contactConversations as conv}
				{@const status = getConversationStatus(conv)}
				{@const urgent = conv.timeSensitive && !(conv.isRead && conv.isResponded)}
				{@const canRead = status === 'unread'}
				{@const canRespond = status !== 'done'}
				<Blueprint>
					<div class="thread-header">
						<PlatformChip platform={conv.platform} />
						{#if status === 'unread'}
							<Tag variant="accent">Unread</Tag>
						{:else if status === 'needs'}
							<Tag variant="outline">Needs response</Tag>
						{:else}
							<Tag variant="neutral">Responded</Tag>
						{/if}
						{#if urgent}
							<Tag variant="accent">Time-sensitive</Tag>
						{/if}
						{#if conv.importance === 'high'}
							<Tag variant="outline">High</Tag>
						{/if}
						<span class="spacer"></span>
						<span class="time text-muted">{relativeTime(conv.lastMessageAt)}</span>
					</div>

					<div class="messages">
						{#each conv.messages as msg}
							{@const isOutbound = msg.direction === 'outbound'}
							<div class="message" class:outbound={isOutbound}>
								<div class="message-meta text-muted">
									{msg.senderName} · {formatTime(msg.timestamp)}
								</div>
								<div class="message-bubble" class:outbound={isOutbound}>
									{msg.content}
								</div>
							</div>
						{/each}
					</div>

					<div class="thread-actions">
						{#if canRead}
							<Button variant="secondary" onclick={() => markConversationRead(conv.id)}>
								Mark read
							</Button>
						{/if}
						{#if canRespond}
							<Button variant="primary" onclick={() => markConversationResponded(conv.id)}>
								Mark responded
							</Button>
						{/if}
						<Button
							variant="secondary"
							title={urgent ? 'Unflag — remove urgent' : 'Flag as urgent'}
							onclick={() => toggleTimeSensitive(conv.id)}
						>
							<Flag
								size={13}
								strokeWidth={1.5}
								fill={urgent ? 'var(--color-accent)' : 'none'}
								color={urgent ? 'var(--color-accent)' : 'currentColor'}
							/>
							{urgent ? 'Unflag' : 'Flag time-sensitive'}
						</Button>
						<span class="spacer"></span>
						<label class="importance-label text-muted">
							Importance
							<select
								class="input importance-select"
								value={conv.importance}
								onchange={(e) => updateConversationImportance(conv.id, e.currentTarget.value as Importance)}
							>
								<option value="low">Low</option>
								<option value="normal">Normal</option>
								<option value="high">High</option>
							</select>
						</label>
						<Button
							variant="secondary"
							onclick={() => toast.show(`The full product would open this thread in ${PLATFORMS[conv.platform].label}.`)}
						>
							Open in {PLATFORMS[conv.platform].label}
							<ExternalLink size={12} strokeWidth={1.5} />
						</Button>
					</div>
				</Blueprint>
			{/each}
		</div>
	</div>
{:else}
	<div class="not-found">
		<h2>Contact not found</h2>
		<a href="/">Back to inbox</a>
	</div>
{/if}

<DemoBadge />

<style>
	.detail {
		max-width: 840px;
		margin: 0 auto;
		padding: 38px 32px 100px;
	}

	.back-link {
		font-size: 13px;
		padding: 4px 6px;
		margin: 0 0 30px -6px;
		text-decoration: none;
	}

	.contact-header {
		display: flex;
		align-items: center;
		gap: 20px;
		margin-bottom: 24px;
	}

	.contact-header h2 {
		margin: 0;
		font-size: 32px;
		line-height: 1.1;
	}

	.contact-header p {
		font-size: 14.5px;
		margin: 4px 0 0;
	}

	.controls {
		display: flex;
		gap: 26px;
		flex-wrap: wrap;
		margin: 0 0 40px;
	}

	.field {
		margin: 0;
	}

	.field .field-label {
		display: block;
		font-size: 12px;
		margin-bottom: 5px;
		color: color-mix(in srgb, var(--color-text) 70%, transparent);
	}

	.threads {
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.thread-header {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		padding: 20px 24px;
		border-bottom: 1px solid var(--color-divider);
	}

	.spacer {
		flex: 1;
	}

	.time {
		font-size: 12px;
	}

	.messages {
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding: 28px 24px;
	}

	.message {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-width: 78%;
		align-self: flex-start;
	}

	.message.outbound {
		align-self: flex-end;
		align-items: flex-end;
	}

	.message-meta {
		font-size: 11.5px;
	}

	.message-bubble {
		padding: 10px 14px;
		font-size: 14px;
		line-height: 1.5;
		border: 1px solid var(--color-divider);
		background: var(--color-surface);
	}

	.message-bubble.outbound {
		background: var(--color-accent-100);
	}

	.thread-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		padding: 16px 24px;
		border-top: 1px solid var(--color-divider);
	}

	.thread-actions :global(.btn) {
		font-size: 12px;
		padding: 5px 11px;
	}

	.importance-label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
	}

	.importance-select {
		width: auto;
		min-height: 30px;
		font-size: 13px;
		padding: 3px 8px;
	}

	.not-found {
		text-align: center;
		padding: 100px 32px;
	}
</style>
