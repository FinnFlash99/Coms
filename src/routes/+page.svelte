<script lang="ts">
	import { Settings, Send, Plus, CalendarDays } from 'lucide-svelte';
	import {
		welcomed,
		filteredConversations,
		conversationCounts,
		conversations,
		contacts,
		preferences,
		categoryFilter,
		activeTab,
		openComposeDialog,
		openSimulateDialog
	} from '$lib/stores';
	import { PLATFORMS, PLATFORM_FAMILIES, familyOf } from '$lib/types';
	import Button from '$components/Button.svelte';
	import Tag from '$components/Tag.svelte';
	import TabBar from '$components/TabBar.svelte';
	import ConversationRow from '$components/ConversationRow.svelte';
	import EmptyState from '$components/EmptyState.svelte';
	import WelcomeDialog from '$components/WelcomeDialog.svelte';
	import DemoBadge from '$components/DemoBadge.svelte';

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

	// Build category filter options
	const categoryOptions = $derived(() => {
		const options = [{ id: 'all', label: 'All categories' }];
		const priority = $preferences.priority || [];
		if (priority.length) options.push({ id: 'prio:1', label: 'Priority senders only' });

		const livePlatforms = [...new Set($filteredConversations.map((v) => v.platform))];
		const liveFamilies = PLATFORM_FAMILIES.filter((f) => livePlatforms.some((p) => familyOf(p).id === f.id));
		liveFamilies.forEach((f) => {
			const label = f.platforms.filter((p) => livePlatforms.includes(p)).map((p) => PLATFORMS[p].label).join(', ');
			options.push({ id: `fam:${f.id}`, label: `${f.label} — ${label}` });
		});
		livePlatforms.forEach((p) => options.push({ id: `pf:${p}`, label: `${familyOf(p).label} · ${PLATFORMS[p].label}` }));

		// Relationship types
		const types = [...new Set($contacts.map((c) => c.type))];
		types.forEach((t) => options.push({ id: `rel:${t}`, label: `Relationship · ${t}` }));

		// Connection strengths
		const connections = [...new Set($contacts.map((c) => c.connection))];
		connections.forEach((c) => options.push({ id: `con:${c}`, label: `Connection · ${c}` }));

		return options;
	});

	// Summary text
	const summary = $derived(() => {
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
</script>

<div class="inbox">
	<header class="header">
		<span class="logo">COMS</span>
		<Tag variant="neutral">UNIFIED INBOX</Tag>
		<span class="spacer"></span>
		<Button variant="primary" onclick={() => openComposeDialog()}>
			<Send size={14} strokeWidth={1.5} />
			New message
		</Button>
		<Button variant="secondary" title="Simulate an incoming message" onclick={openSimulateDialog}>
			<Plus size={14} strokeWidth={1.5} />
			Simulate
		</Button>
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

	<div class="tabs-row">
		<TabBar />
		<span class="spacer"></span>
		<select
			class="input category-select"
			title="Category"
			bind:value={$categoryFilter}
		>
			{#each categoryOptions() as cat}
				<option value={cat.id}>{cat.label}</option>
			{/each}
		</select>
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
		<EmptyState />
	{/if}
</div>

<WelcomeDialog visible={!$welcomed} />
<DemoBadge />

<style>
	.inbox {
		max-width: 960px;
		margin: 0 auto;
		padding: 38px 32px 100px;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.logo {
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 24px;
		letter-spacing: 0.02em;
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

	.summary {
		font-size: 13px;
		margin: 8px 0 30px;
	}

	.tabs-row {
		display: flex;
		gap: 26px;
		border-bottom: 1px solid var(--color-divider);
	}

	.category-select {
		width: auto;
		min-height: 32px;
		font-size: 13px;
		padding: 4px 8px;
		align-self: center;
		margin-bottom: 6px;
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
