<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		events,
		contacts,
		conversations,
		followUps,
		addFollowUp,
		completeFollowUp,
		openComposeDialog,
		toast
	} from '$lib/stores';
	import { EVENT_KINDS, PLATFORMS, relativeTime, dueLabel, getInitials } from '$lib/types';
	import Dialog from './Dialog.svelte';
	import Button from './Button.svelte';
	import Tag from './Tag.svelte';

	interface Props {
		eventId: string | null;
		onclose: () => void;
	}

	let { eventId, onclose }: Props = $props();

	let followText = $state('');
	let followDate = $state('');

	const event = $derived($events.find((e) => e.id === eventId));
	const kind = $derived(event ? EVENT_KINDS[event.kind] : null);

	const meta = $derived.by(() => {
		if (!event) return '';
		const parts = [
			new Date(event.startTs).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }),
			event.mins ? `${formatHHMM(event.startTs)} · ${event.mins} min` : `due ${formatHHMM(event.startTs)}`,
			event.where || null
		];
		return parts.filter(Boolean).join(' · ');
	});

	function formatHHMM(ts: number): string {
		return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}

	const attendees = $derived.by(() => {
		if (!event) return [];
		return event.attendees.map((id) => {
			const c = $contacts.find((x) => x.id === id);
			if (!c) return null;
			const theirs = $conversations.filter((v) => v.contactId === id);
			const last = theirs
				.map((v) => v.messages[v.messages.length - 1])
				.filter(Boolean)
				.sort((a, b) => b.timestamp - a.timestamp)[0];
			const open = theirs.filter((v) => !(v.isRead && v.isResponded)).length;
			return {
				initials: getInitials(c.name),
				name: c.name,
				type: `${c.type} · ${c.connection}`,
				openCount: open,
				lastLine: last ? `Last: "${last.content}" — ${relativeTime(last.timestamp)}` : 'No messages yet.'
			};
		}).filter((a): a is NonNullable<typeof a> => a !== null);
	});

	const context = $derived.by(() => {
		if (!event) return [];
		const convs = $conversations.filter((v) => event.convIds.includes(v.id));
		return convs
			.flatMap((v) => v.messages.slice(-2).map((m) => ({ v, m })))
			.sort((a, b) => b.m.timestamp - a.m.timestamp)
			.slice(0, 4)
			.map(({ v, m }) => ({
				platform: v.platform,
				content: m.content,
				who: m.senderName,
				time: relativeTime(m.timestamp),
				contactId: v.contactId
			}));
	});

	const eventFollowUps = $derived(
		event ? $followUps.filter((f) => f.eventId === event.id && !f.done).sort((a, b) => a.dueTs - b.dueTs) : []
	);

	function handleAddFollow() {
		if (!event) return;
		addFollowUp(event.id, followText, followDate);
		followText = '';
		followDate = '';
	}

	function openConversation(contactId: string) {
		onclose();
		goto(`/conversation/${contactId}`);
	}

	function messageAttendees() {
		if (!event) return;
		const first = event.attendees[0];
		if (!first) {
			toast.show('No attendees to message.');
			return;
		}
		const title = event.title;
		onclose();
		openComposeDialog({ contactId: first, content: `Ahead of ${title} — ` });
		goto('/');
	}
</script>

{#if event && kind}
	<Dialog title={event.title} open={!!event} {onclose} maxWidth="620px">
		<div class="prep-scroll">
			<p class="text-muted meta">
				<Tag variant={kind.tagVariant}>{kind.label}</Tag>
				{meta}
			</p>

			<div class="prep-section">
				<div class="prep-heading">Who's coming</div>
				{#if attendees.length}
					<div class="attendees">
						{#each attendees as a}
							<div class="attendee">
								<div class="attendee-avatar">{a.initials}</div>
								<div class="attendee-body">
									<div class="attendee-top">
										<span class="attendee-name">{a.name}</span>
										<Tag variant="neutral">{a.type}</Tag>
										{#if a.openCount}
											<Tag variant="outline">{a.openCount} open</Tag>
										{/if}
									</div>
									<p class="text-muted attendee-last">{a.lastLine}</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted">No attendees for this event.</p>
				{/if}
			</div>

			<div class="prep-section">
				<div class="prep-heading">Context from your conversations</div>
				{#if context.length}
					<div class="context-list">
						{#each context as c}
							<div class="context-row">
								<span class="platform-tag">{PLATFORMS[c.platform].label}</span>
								<div class="context-body">
									<p class="context-content">{c.content}</p>
									<p class="text-muted context-meta">{c.who} · {c.time}</p>
								</div>
								<button class="btn btn-ghost context-open" onclick={() => openConversation(c.contactId)}>Open</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted">No linked conversations yet.</p>
				{/if}
			</div>

			<div class="field">
				<label for="follow-text">Set a follow-up reminder</label>
				<div class="follow-form">
					<input
						id="follow-text"
						class="input follow-input"
						placeholder="e.g. Send recap and next steps"
						bind:value={followText}
					/>
					<input class="input" type="date" bind:value={followDate} />
					<Button variant="secondary" disabled={!followText.trim()} onclick={handleAddFollow}>Add</Button>
				</div>
				{#if eventFollowUps.length}
					<div class="follow-list">
						{#each eventFollowUps as f}
							<div class="follow-row">
								<span class="follow-dot"></span>
								<span class="follow-text">{f.text}</span>
								<span class="text-muted follow-due">{dueLabel(f.dueTs)}</span>
								<button class="btn btn-ghost follow-done" onclick={() => completeFollowUp(f.id)}>Done</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		{#snippet actions()}
			<Button variant="secondary" onclick={onclose}>Close</Button>
			<Button variant="primary" onclick={messageAttendees}>Message attendees</Button>
		{/snippet}
	</Dialog>
{/if}

<style>
	.prep-scroll {
		display: flex;
		flex-direction: column;
		gap: 22px;
		max-height: min(66vh, 540px);
		overflow: auto;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 9px;
		font-size: 13.5px;
		margin: 0;
	}

	.prep-heading {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--color-text) 60%, transparent);
		margin-bottom: 10px;
	}

	.attendees {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.attendee {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.attendee-avatar {
		width: 34px;
		height: 34px;
		flex: none;
		display: grid;
		place-items: center;
		border: 1px solid var(--color-divider);
		border-radius: 50%;
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 13px;
		color: var(--color-accent);
	}

	.attendee-body {
		flex: 1;
		min-width: 0;
	}

	.attendee-top {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.attendee-name {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 14.5px;
	}

	.attendee-last {
		font-size: 12.5px;
		margin: 5px 0 0;
	}

	.context-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.context-row {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		padding: 11px 13px;
		border: 1px solid var(--color-divider);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-text) 4%, transparent);
	}

	.platform-tag {
		flex: none;
		display: inline-flex;
		align-items: center;
		font-size: 10.5px;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		padding: 3px 9px;
		border-radius: calc(var(--radius-md) * 0.75);
		background: color-mix(in srgb, var(--color-text) 10%, transparent);
	}

	.context-body {
		flex: 1;
		min-width: 0;
	}

	.context-content {
		font-size: 13px;
		margin: 0;
		line-height: 1.5;
	}

	.context-meta {
		font-size: 11.5px;
		margin: 5px 0 0;
	}

	.context-open {
		flex: none;
		font-size: 11.5px;
		padding: 3px 6px;
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

	.follow-form {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.follow-input {
		flex: 1;
		min-width: 180px;
	}

	.follow-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 12px;
	}

	.follow-row {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 13px;
	}

	.follow-dot {
		width: 5px;
		height: 5px;
		flex: none;
		border-radius: 50%;
		background: var(--color-accent);
	}

	.follow-text {
		flex: 1;
		min-width: 0;
	}

	.follow-due {
		font-size: 11.5px;
	}

	.follow-done {
		font-size: 11.5px;
		padding: 2px 5px;
	}
</style>
