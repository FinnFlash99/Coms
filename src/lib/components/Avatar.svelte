<script lang="ts">
	import { getInitials } from '$lib/types';

	interface Props {
		name: string;
		size?: 'sm' | 'md' | 'lg';
	}

	let { name, size = 'md' }: Props = $props();

	const initials = $derived(getInitials(name));

	const sizeStyles = {
		sm: { width: '38px', height: '38px', fontSize: '15px' },
		md: { width: '42px', height: '42px', fontSize: '16px' },
		lg: { width: '58px', height: '58px', fontSize: '22px' }
	};

	const style = $derived(sizeStyles[size]);
</script>

<div
	class="avatar"
	style:width={style.width}
	style:height={style.height}
	style:font-size={style.fontSize}
>
	{initials}
</div>

<style>
	.avatar {
		flex: none;
		display: grid;
		place-items: center;
		border: 1px solid var(--color-divider);
		font-family: var(--font-heading);
		font-weight: 600;
		color: var(--color-accent);
	}
</style>
