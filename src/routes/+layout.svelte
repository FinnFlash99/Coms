<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme, preferences } from '$lib/stores';
	import Toast from '$components/Toast.svelte';

	let { children } = $props();

	onMount(() => {
		// Initialize theme
		theme.init();
		theme.set($preferences.theme);
	});
</script>

<svelte:head>
	<title>Coms - Unified Inbox</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;700&family=Barlow+Condensed:wght@400;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}

<Toast />
