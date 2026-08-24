<script lang="ts">
	interface Props {
		visible?: boolean;
	}

	let { visible = true }: Props = $props();
</script>

{#if visible}
	<div class="demo-badge">
		<i class="pulse-dot"></i>
		Demo mode
	</div>
{/if}

<style>
	.demo-badge {
		position: fixed;
		left: 14px;
		bottom: 14px;
		z-index: 50;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font-size: 9.5px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		border: 1px solid var(--color-divider);
		padding: 5px 9px;
		background: var(--color-bg);
		color: var(--color-text);
		opacity: 0.85;
	}

	.pulse-dot {
		width: 6px;
		height: 6px;
		background: var(--color-accent);
		animation: coms-pulse 2.4s ease infinite;
	}
</style>
