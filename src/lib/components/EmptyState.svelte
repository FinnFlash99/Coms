<script lang="ts">
	import Blueprint from './Blueprint.svelte';

	interface Props {
		title?: string;
		body?: string;
	}

	let { title = 'All clear', body = "You're all caught up. Nothing needs your attention." }: Props = $props();
</script>

<div class="empty-state animate-pop">
	<Blueprint class="otter-frame">
		<div class="otter-placeholder">
			<span class="otter-emoji">🦦</span>
			<span class="otter-text">All clear!</span>
		</div>
	</Blueprint>
	<h3>{title}</h3>
	<p class="text-muted">{body}</p>
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 52px 0 20px;
		text-align: center;
	}

	:global(.otter-frame) {
		width: 320px;
		height: 220px;
		margin-bottom: 22px;
	}

	.otter-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}

	.otter-emoji {
		font-size: 64px;
	}

	.otter-text {
		font-size: 14px;
		color: var(--color-accent);
		font-family: var(--font-heading);
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	h3 {
		margin: 0 0 4px;
	}

	p {
		font-size: 14px;
		margin: 0;
	}
</style>
