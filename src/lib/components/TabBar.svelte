<script lang="ts">
	import { activeTab, conversationCounts } from '$lib/stores';
	import { TABS } from '$lib/types';

	const tabs = TABS;
</script>

<div class="tab-bar">
	{#each tabs as [id, label]}
		{@const isActive = $activeTab === id}
		{@const count = $conversationCounts[id]}
		{@const isAlert = id === 'urgent' && count > 0}
		<button
			class="tab"
			class:active={isActive}
			class:alert={isAlert}
			onclick={() => activeTab.set(id)}
		>
			{label}
			<span class="count" class:active={isActive} class:alert={isAlert}>{count}</span>
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

	/* Urgent tab with items pending: a subtle alert tint even when not selected */
	.tab.alert {
		color: var(--color-alert-text);
	}

	.tab.active.alert {
		border-bottom-color: var(--color-alert);
		color: var(--color-alert);
	}

	.count {
		font-size: 10.5px;
		font-family: var(--font-body);
		padding: 1px 6px;
		min-width: 16px;
		text-align: center;
		background: var(--color-neutral-800);
		color: var(--color-neutral-100);
	}

	.count.active {
		background: var(--color-accent-800);
		color: var(--color-accent-100);
	}

	/* Urgent tab's count pill is always solid-alert, active or not */
	.count.alert {
		background: var(--color-alert);
		color: #fff;
	}
</style>
