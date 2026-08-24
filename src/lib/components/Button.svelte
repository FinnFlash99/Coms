<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
		block?: boolean;
		children: Snippet;
	}

	let {
		variant = 'secondary',
		block = false,
		children,
		class: className = '',
		...rest
	}: Props = $props();

	const variantClass = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		ghost: 'btn-ghost',
		icon: 'btn-secondary btn-icon'
	};
</script>

<button class="btn {variantClass[variant]} {block ? 'btn-block' : ''} {className}" {...rest}>
	{@render children()}
</button>
