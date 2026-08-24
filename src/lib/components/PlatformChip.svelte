<script lang="ts">
	import { PLATFORMS, type Platform } from '$lib/types';

	interface Props {
		platform: Platform;
	}

	let { platform }: Props = $props();

	const info = $derived(PLATFORMS[platform]);
</script>

<span
	class="platform-chip"
	style:background="color-mix(in srgb, {info.color} 18%, transparent)"
	style:color="color-mix(in srgb, {info.color} 62%, var(--color-text))"
>
	{info.label}
</span>

<style>
	.platform-chip {
		display: inline-flex;
		align-items: center;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 3px 9px;
	}
</style>
