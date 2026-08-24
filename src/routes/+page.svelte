<script lang="ts">
	import { Settings, Plus } from 'lucide-svelte';
	import {
		welcomed,
		filteredConversations,
		conversationCounts,
		contacts,
		categoryFilter,
		activeTab
	} from '$lib/stores';
	import { PLATFORMS, getConversationStatus } from '$lib/types';
	import Blueprint from '$components/Blueprint.svelte';
	import Button from '$components/Button.svelte';
	import Tag from '$components/Tag.svelte';
	import TabBar from '$components/TabBar.svelte';
	import ConversationRow from '$components/ConversationRow.svelte';
	import EmptyState from '$components/EmptyState.svelte';
	import WelcomeDialog from '$components/WelcomeDialog.svelte';
	import SimulateDialog from '$components/SimulateDialog.svelte';
	import DemoBadge from '$components/DemoBadge.svelte';

	let showSimulate = $state(false);

	// Build category filter options
	const categoryOptions = $derived(() => {
		const options = [{ id: 'all', label: 'All categories' }];

		// Relationship types
		const types = [...new Set($contacts.map((c) => c.type))];
		types.forEach((t) => options.push({ id: `rel:${t}`, label: t }));

		// Connection strengths
		const connections = [...new Set($contacts.map((c) => c.connection))];
		connections.forEach((c) => options.push({ id: `con:${c}`, label: c }));

		// Platforms
		const platforms = [...new Set($filteredConversations.map((v) => v.platform))];
		platforms.forEach((p) => options.push({ id: `pf:${p}`, label: PLATFORMS[p].label }));

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

	// Group conversations for "All" tab (Active vs Done sections)
	const sections = $derived(() => {
		const convs = $filteredConversations;
		const tab = $activeTab;

		if (tab === 'all') {
			const rank = (e: (typeof convs)[0]) =>
				e.urgent ? 0 : e.status === 'unread' ? 1 : e.status === 'needs' ? 2 : 3;
			const active = convs.filter((e) => e.status !== 'done').sort((a, b) => rank(a) - rank(b));
			const done = convs.filter((e) => e.status === 'done');

			const sections = [];
			if (active.length) sections.push({ label: 'Active', count: active.length, rows: active });
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
		<Tag variant="neutral">Unified inbox</Tag>
		<span class="spacer"></span>
		<Button variant="secondary" onclick={() => (showSimulate = true)}>
			<Plus size={14} strokeWidth={1.5} />
			Simulate message
		</Button>
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
					<Blueprint>
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
					</Blueprint>
				</div>
			{/each}
		</div>
	{:else}
		<EmptyState />
	{/if}
</div>

<WelcomeDialog visible={!$welcomed} />
<SimulateDialog open={showSimulate} onclose={() => (showSimulate = false)} />
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
