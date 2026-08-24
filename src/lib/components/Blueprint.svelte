<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div class="blueprint {className}">
	<i class="corner tl"></i>
	<i class="corner tr"></i>
	<i class="corner bl"></i>
	<i class="corner br"></i>
	{@render children()}
</div>
