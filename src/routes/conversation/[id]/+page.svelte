<script lang="ts">
	import { page } from '$app/stores';
	import { ChevronLeft, Flag, ExternalLink, Send } from 'lucide-svelte';
	import {
		contacts,
		conversations,
		drafts,
		setDraft,
		sendReply,
		setDue,
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
		dateKey,
		isMailPlatform,
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

	function handleSend(conversationId: string) {
		if (sendReply(conversationId)) {
			toast.show('Sent — thread marked responded');
		}
	}

	function handleReplyKey(e: KeyboardEvent, conversationId: string) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend(conversationId);
		}
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
				{@const isMail = isMailPlatform(conv.platform)}
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
							<Tag variant="alert">Time-sensitive</Tag>
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
							<div class="message" class:outbound={isOutbound} class:mail={isMail}>
								<div class="message-meta text-muted">
									{msg.senderName} · {formatTime(msg.timestamp)}
								</div>
								{#if isMail}
									<div class="message-bubble mail" class:outbound={isOutbound}>
										{msg.subject || msg.content}
									</div>
									<p class="text-muted mail-snippet">{msg.content}</p>
								{:else}
									<div class="message-bubble" class:outbound={isOutbound}>
										{msg.content}
									</div>
								{/if}
							</div>
						{/each}
					</div>

					<div class="reply-row">
						<textarea
							class="input reply-input"
							placeholder={`Reply to ${contact.name.split(' (')[0]} on ${PLATFORMS[conv.platform].label}…`}
							value={$drafts[conv.id] || ''}
							oninput={(e) => setDraft(conv.id, e.currentTarget.value)}
							onkeydown={(e) => handleReplyKey(e, conv.id)}
						></textarea>
						<Button
							variant="primary"
							class="reply-send"
							disabled={!($drafts[conv.id] || '').trim()}
							onclick={() => handleSend(conv.id)}
						>
							<Send size={14} strokeWidth={1.5} />
							Send
						</Button>
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
								fill={urgent ? 'var(--color-alert)' : 'none'}
								color={urgent ? 'var(--color-alert)' : 'currentColor'}
							/>
							{urgent ? 'Unflag' : 'Flag time-sensitive'}
						</Button>
						<span class="spacer"></span>
						<label class="importance-label text-muted">
							Due
							<input
								class="input due-input"
								type="date"
								value={conv.dueTs ? dateKey(conv.dueTs) : ''}
								onchange={(e) => setDue(conv.id, e.currentTarget.value)}
							/>
						</label>
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

	.message.mail {
		max-width: 100%;
		align-self: stretch;
	}

	.message-meta {
		font-size: 11.5px;
	}

	.message-bubble {
		padding: 10px 14px;
		font-size: 14px;
		line-height: 1.5;
		border: 1px solid var(--color-divider);
		background: color-mix(in srgb, var(--color-text) 6%, transparent);
	}

	.message-bubble.outbound {
		background: color-mix(in srgb, var(--color-accent) 24%, transparent);
	}

	.message-bubble.mail {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 15px;
		line-height: 1.4;
		letter-spacing: -0.01em;
		padding: 0 0 0 12px;
		border: none;
		border-left: 2px solid var(--color-divider);
		background: none;
	}

	.message-bubble.mail.outbound {
		border-left-color: color-mix(in srgb, var(--color-accent) 60%, transparent);
		background: none;
	}

	.mail-snippet {
		margin: 2px 0 0 14px;
		font-size: 13px;
		line-height: 1.5;
	}

	.reply-row {
		display: flex;
		align-items: flex-end;
		gap: 10px;
		padding: 16px 24px;
		border-top: 1px solid var(--color-divider);
	}

	.reply-input {
		flex: 1;
		min-height: 44px;
		max-height: 120px;
		font-size: 14px;
		padding: 11px 13px;
		resize: vertical;
	}

	.reply-row :global(.reply-send) {
		flex: none;
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

	.due-input {
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
