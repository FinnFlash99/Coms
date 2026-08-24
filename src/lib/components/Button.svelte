<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
		block?: boolean;
		children: Snippet;
	}

	// Not compiled as a custom element, so the rest-props/custom-element-prop-inference
	// warning below doesn't apply here.
	let {
		variant = 'secondary',
		block = false,
		children,
		class: className = '',
		// eslint-disable-next-line svelte/valid-compile
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
