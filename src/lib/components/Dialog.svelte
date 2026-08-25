<script lang="ts">
	import type { Snippet } from 'svelte';
	import Blueprint from './Blueprint.svelte';

	interface Props {
		title: string;
		open: boolean;
		onclose: () => void;
		children: Snippet;
		actions?: Snippet;
		maxWidth?: string;
	}

	let { title, open, onclose, children, actions, maxWidth }: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="dialog-backdrop" onclick={handleBackdropClick}>
		<Blueprint class="dialog animate-pop" style={maxWidth ? `width:min(${maxWidth}, 92vw);max-width:${maxWidth}` : ''}>
			<div class="dialog-title">{title}</div>
			<div class="dialog-body">
				{@render children()}
			</div>
			{#if actions}
				<div class="dialog-actions">
					{@render actions()}
				</div>
			{/if}
		</Blueprint>
	</div>
{/if}

<style>
	.dialog-backdrop {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: grid;
		place-items: center;
		padding: var(--space-4);
		background: color-mix(in srgb, var(--color-neutral-900) 50%, transparent);
	}

	:global(.dialog) {
		background: var(--color-bg) !important;
		width: min(440px, 100%);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
	}
</style>
