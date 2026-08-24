<script lang="ts">
	interface Props {
		variant?: 'accent' | 'accent-2' | 'neutral' | 'outline';
		children: import('svelte').Snippet;
	}

	let { variant = 'neutral', children }: Props = $props();

	const variantClass = {
		accent: 'tag-accent',
		'accent-2': 'tag-accent-2',
		neutral: 'tag-neutral',
		outline: 'tag-outline'
	};
</script>

<span class="tag {variantClass[variant]}">
	{@render children()}
</span>
