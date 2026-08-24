<script lang="ts">
	import type { HTMLInputAttributes, HTMLTextareaAttributes } from 'svelte/elements';

	interface InputProps extends HTMLInputAttributes {
		multiline?: false;
		class?: string;
	}

	interface TextareaProps extends HTMLTextareaAttributes {
		multiline: true;
		class?: string;
	}

	type Props = InputProps | TextareaProps;

	// Not compiled as a custom element, so the rest-props warning below doesn't apply.
	// eslint-disable-next-line svelte/valid-compile
	let { multiline = false, class: className = '', ...rest }: Props = $props();
</script>

{#if multiline}
	<textarea class="input {className}" {...rest as HTMLTextareaAttributes}></textarea>
{:else}
	<input class="input {className}" {...rest as HTMLInputAttributes} />
{/if}
