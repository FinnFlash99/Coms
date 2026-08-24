<script lang="ts">
	import { toast } from '$lib/stores';
</script>

{#if $toast}
	<div class="toast animate-in">
		{$toast}
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		left: 50%;
		bottom: 26px;
		transform: translateX(-50%);
		z-index: 80;
		border: 1px solid var(--color-divider);
		background: var(--color-bg);
		box-shadow: var(--shadow-md);
		padding: 9px 16px;
		font-size: 13px;
	}
</style>
