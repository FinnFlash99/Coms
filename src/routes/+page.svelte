<script lang="ts">
	import { goto } from '$app/navigation';
	import { Settings, Send, NotebookPen, CalendarDays, Search, X, RefreshCw } from 'lucide-svelte';
	import {
		welcomed,
		filteredConversations,
		conversationCounts,
		conversations,
		contacts,
		preferences,
		categoryFilter,
		groupFilter,
		searchQuery,
		activeTab,
		greetDismissed,
		notes,
		notesOpen,
		notesSplit,
		toggleNotesPanel,
		allTypes,
		connections,
		syncState,
		lastSync,
		runSync,
		openComposeDialog
	} from '$lib/stores';
	import { PLATFORMS, syncAgo } from '$lib/types';
	import Button from '$components/Button.svelte';
	import Tag from '$components/Tag.svelte';
	import TabBar from '$components/TabBar.svelte';
	import ConversationRow from '$components/ConversationRow.svelte';
	import EmptyState from '$components/EmptyState.svelte';
	import WelcomeDialog from '$components/WelcomeDialog.svelte';
	import DemoBadge from '$components/DemoBadge.svelte';
	import NotesPanel from '$components/NotesPanel.svelte';

	// How many open thread deadlines are overdue or due within 3 days -- shown as
	// a badge on the Calendar button so it's visible without opening the calendar.
	const dueSoonCount = $derived.by(() => {
		const now = Date.now();
		const threeDays = 3 * 86400000;
		return $conversations.filter((v) => {
			if (!v.dueTs || (v.isRead && v.isResponded)) return false;
			return v.dueTs < now + threeDays;
		}).length;
	});

	// Build category filter options: all + priority + a flat platform list
	const categoryOptions = $derived(() => {
		const options: Array<{ id: string; label: string }> = [{ id: 'all', label: 'All categories' }];
		const priority = $preferences.priority || [];
		if (priority.length) options.push({ id: 'prio:1', label: 'Priority' });

		Object.keys(PLATFORMS).forEach((p) => options.push({ id: `pf:${p}`, label: PLATFORMS[p as keyof typeof PLATFORMS].label }));

		return options;
	});

	// Build group filter options: all groups + every contact type
	const groupOptions = $derived(() => [
		{ id: 'all', label: 'All groups' },
		...$allTypes.map((t) => ({ id: `rel:${t}`, label: t }))
	]);

	const hasConnections = $derived(Object.values($connections).some(Boolean));

	// Summary text
	const summary = $derived(() => {
		if (!hasConnections) return "You're one step away — connect a platform to start seeing messages.";
		const counts = $conversationCounts;
		const attn = counts.unread + counts.needs;
		let text = `${counts.all} threads · `;
		if (attn === 0) {
			text += 'nothing needs attention';
		} else {
			text += `${attn} ${attn === 1 ? 'needs' : 'need'} attention`;
		}
		if (counts.urgent > 0) {
			text += ` · ${counts.urgent} time-sensitive`;
		}
		return text;
	});

	// Manual sync indicator — "Refresh now" until clicked, then "Syncing…", then how
	// long ago it last succeeded.
	const syncLabel = $derived($syncState === 'syncing' ? 'Syncing…' : syncAgo($lastSync));
	const syncTitle = $derived($syncState === 'syncing' ? 'Syncing your platforms' : 'Refresh now');

	// Group conversations for "All" tab (Priority / Active / Done sections)
	const sections = $derived(() => {
		const convs = $filteredConversations;
		const tab = $activeTab;

		if (tab === 'all') {
			const rank = (e: (typeof convs)[0]) =>
				e.urgent ? 0 : e.status === 'unread' ? 1 : e.status === 'needs' ? 2 : 3;
			const byRank = (a: (typeof convs)[0], b: (typeof convs)[0]) => rank(a) - rank(b);
			const open = convs.filter((e) => e.status !== 'done');
			const done = convs.filter((e) => e.status === 'done');

			const priorityIds = $preferences.priority || [];
			const usePriority = $preferences.priorityFirst && priorityIds.length > 0;
			const priorityRows = usePriority ? open.filter((e) => e.isPriority).sort(byRank) : [];
			const activeRows = (usePriority ? open.filter((e) => !e.isPriority) : open).sort(byRank);

			const sections = [];
			if (priorityRows.length) sections.push({ label: 'Priority senders', count: priorityRows.length, rows: priorityRows });
			if (activeRows.length) sections.push({ label: usePriority ? 'Everything else' : 'Active', count: activeRows.length, rows: activeRows });
			if (done.length) sections.push({ label: 'Done', count: done.length, rows: done });
			return sections;
		}

		return [{ label: '', count: 0, rows: convs }];
	});

	const hasRows = $derived($filteredConversations.length > 0);
	const openTaskCount = $derived($notes.filter((n) => n.kind === 'task' && !n.done).length);
	const todayFullDate = new Date().toLocaleDateString([], {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
	const emptyTitle = $derived($searchQuery.trim() ? 'No matches' : 'All clear');
	const emptyBody = $derived(
		$searchQuery.trim()
			? `Nothing matches "${$searchQuery.trim()}". Try a name, a platform, a word from a message, or a time like "yesterday" or "Aug 24".`
			: "You're all caught up. Nothing needs your attention."
	);
</script>

<div class="home-shell" class:split={$notesOpen && $notesSplit}>
<div class="inbox">
	{#if !$greetDismissed}
		<div class="greet-bar">
			<span class="greet-text">Welcome back to Coms, Maya</span>
			<span class="spacer"></span>
			<span class="greet-date">{todayFullDate}</span>
		</div>
	{/if}

	<header class="header">
		<span class="logo"><span class="logo-c">C</span>oms</span>
		<Tag variant="neutral">Full Connect</Tag>
		<span class="spacer"></span>
		<Button variant="primary" onclick={() => openComposeDialog()}>
			<Send size={14} strokeWidth={1.5} />
			New message
		</Button>
		<button class="btn btn-ghost sync-btn" title={syncTitle} disabled={$syncState === 'syncing'} onclick={runSync}>
			<RefreshCw size={13} strokeWidth={1.6} class={$syncState === 'syncing' ? 'sync-spin' : ''} />
			{syncLabel}
		</button>
		<button class="btn btn-secondary" title="Notes and tasks" onclick={toggleNotesPanel}>
			<NotebookPen size={14} strokeWidth={1.5} />
			Notes
			{#if openTaskCount > 0}
				<span class="notes-badge">{openTaskCount}</span>
			{/if}
		</button>
		<a href="/calendar" class="btn btn-secondary" title="Calendar">
			<CalendarDays size={15} strokeWidth={1.5} />
			Calendar
			{#if dueSoonCount > 0}
				<span class="due-badge">{dueSoonCount}</span>
			{/if}
		</a>
		<a href="/settings" class="btn btn-secondary btn-icon" title="Settings">
			<Settings size={16} strokeWidth={1.5} />
		</a>
	</header>

	<p class="summary text-muted">{summary()}</p>

	{#if hasConnections}
		<span class="search-bar">
			<Search size={14} strokeWidth={1.5} class="search-icon" />
			<input
				class="input search-input"
				type="search"
				placeholder="Search messages, people or dates"
				bind:value={$searchQuery}
			/>
			{#if $searchQuery}
				<button class="btn btn-ghost btn-icon search-clear" title="Clear search" onclick={() => ($searchQuery = '')}>
					<X size={13} strokeWidth={1.5} />
				</button>
			{/if}
		</span>

		<div class="tabs-row">
			<TabBar />
			<div class="filters">
				<select
					class="input category-select"
					title="Category"
					bind:value={$categoryFilter}
				>
					{#each categoryOptions() as cat}
						<option value={cat.id}>{cat.label}</option>
					{/each}
				</select>
				<select
					class="input category-select"
					title="Group"
					bind:value={$groupFilter}
				>
					{#each groupOptions() as g}
						<option value={g.id}>{g.label}</option>
					{/each}
				</select>
			</div>
		</div>

		{#if hasRows}
			<div class="sections">
				{#each sections() as section}
					<div class="section">
						{#if section.label}
							<div class="section-header">
								<span class="section-label">{section.label}</span>
								<span class="section-count text-muted">{section.count}</span>
							</div>
						{/if}
						<div class="row-card">
							{#each section.rows as conv, i}
								{@const contact = $contacts.find((c) => c.id === conv.contactId)}
								{#if contact}
									<ConversationRow
										conversation={conv}
										{contact}
										isLast={i === section.rows.length - 1}
									/>
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<EmptyState title={emptyTitle} body={emptyBody} />
		{/if}
	{:else}
		<EmptyState
			title="No platforms connected"
			body="Connect Gmail, Slack, or WhatsApp to see your messages here."
			emoji="🧩"
			badge="Connect a platform"
		>
			{#snippet actions()}
				<Button variant="primary" onclick={() => goto('/settings')}>Connect a platform</Button>
				<button class="btn btn-ghost learn-more" onclick={() => goto('/settings')}>Learn more about connections</button>
			{/snippet}
		</EmptyState>
	{/if}
</div>

{#if $notesOpen}
	<NotesPanel />
{/if}
</div>

<WelcomeDialog visible={!$welcomed} />
<DemoBadge />

<style>
	.home-shell.split {
		display: flex;
		align-items: flex-start;
		gap: 0;
		min-height: 100vh;
	}

	.inbox {
		max-width: 960px;
		margin: 0 auto;
		padding: 38px 32px 100px;
	}

	.home-shell.split .inbox {
		max-width: none;
		margin: 0;
		flex: 1;
		min-width: 0;
		padding: 38px 28px 100px;
	}

	.greet-bar {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		column-gap: 14px;
		row-gap: 4px;
		padding: 0 0 16px;
		margin-bottom: 22px;
		border-bottom: 1px solid var(--color-divider);
		animation: coms-in 0.3s ease;
	}

	.greet-text {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 24px;
		letter-spacing: -0.015em;
	}

	.greet-date {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 13px;
		letter-spacing: -0.01em;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.logo {
		font-family: 'DM Serif Display', Georgia, serif;
		font-weight: 400;
		font-size: 25px;
		letter-spacing: -0.01em;
	}

	.logo-c {
		font-size: 1.4em;
	}

	.spacer {
		flex: 1;
	}

	.due-badge {
		font-size: 10.5px;
		padding: 1px 7px;
		min-width: 18px;
		text-align: center;
		border-radius: 999px;
		background: var(--color-alert);
		color: #fff;
	}

	.notes-badge {
		font-size: 10.5px;
		padding: 1px 7px;
		min-width: 18px;
		text-align: center;
		border-radius: 999px;
		background: var(--color-neutral-800);
		color: var(--color-neutral-100);
	}

	.sync-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
		font-size: 11.5px;
		padding: 4px 2px;
		opacity: 0.72;
	}

	.sync-btn:hover:not(:disabled) {
		opacity: 1;
	}

	.sync-btn:disabled {
		cursor: default;
	}

	:global(.sync-spin) {
		animation: coms-spin 0.9s linear infinite;
	}

	.learn-more {
		font-size: 12.5px;
	}

	.summary {
		font-size: 13px;
		margin: 8px 0 18px;
	}

	.search-bar {
		position: relative;
		display: flex;
		align-items: center;
		width: 312px;
		margin: 0 0 12px auto;
	}

	.search-bar :global(.search-icon) {
		position: absolute;
		left: 11px;
		opacity: 0.55;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		min-height: 36px;
		font-size: 13.5px;
		padding: 5px 30px 5px 32px;
	}

	.search-clear {
		position: absolute;
		right: 3px;
		padding: 3px;
	}

	.tabs-row {
		display: flex;
		flex-wrap: wrap;
		column-gap: 26px;
		row-gap: 8px;
		border-bottom: 1px solid var(--color-divider);
	}

	.filters {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-left: auto;
		margin-bottom: 6px;
	}

	.category-select {
		width: auto;
		min-width: 0;
		max-width: 140px;
		min-height: 32px;
		font-size: 13px;
		padding: 4px 6px 4px 8px;
		background-position: right 4px center;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 38px;
		margin-top: 30px;
	}

	.row-card {
		background: var(--color-surface);
		border: 1px solid var(--color-divider);
		border-radius: 24px;
		border-bottom-left-radius: 8px;
		overflow: hidden;
	}

	.section-header {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-bottom: 10px;
	}

	.section-label {
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 12px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--color-text) 60%, transparent);
	}

	.section-count {
		font-size: 11px;
	}
</style>
