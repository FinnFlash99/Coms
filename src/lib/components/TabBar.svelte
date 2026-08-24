<script lang="ts">
	import { activeTab, conversationCounts } from '$lib/stores';
	import { TABS, type TabId } from '$lib/types';

	const tabs = TABS;
</script>

<div class="tab-bar">
	{#each tabs as [id, label]}
		{@const isActive = $activeTab === id}
		{@const count = $conversationCounts[id]}
		<button
			class="tab"
			class:active={isActive}
			onclick={() => activeTab.set(id)}
		>
			{label}
			<span class="count" class:active={isActive}>{count}</span>
		</button>
	{/each}
</div>

<style>
	.tab-bar {
		display: flex;
		gap: 26px;
	}

	.tab {
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 15px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		padding: 9px 2px;
		margin-bottom: -1px;
		display: inline-flex;
		gap: 7px;
		align-items: center;
		color: inherit;
	}

	.tab.active {
		border-bottom-color: var(--color-accent);
		color: var(--color-accent);
	}

	.count {
		font-size: 10.5px;
		font-family: var(--font-body);
		padding: 1px 6px;
		min-width: 16px;
		text-align: center;
		background: var(--color-neutral-100);
		color: var(--color-neutral-800);
	}

	.count.active {
		background: var(--color-accent-100);
		color: var(--color-accent-800);
	}
</style>
