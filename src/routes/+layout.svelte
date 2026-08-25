<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme, preferences } from '$lib/stores';
	import Toast from '$components/Toast.svelte';
	import ComposeDialog from '$components/ComposeDialog.svelte';
	import SimulateDialog from '$components/SimulateDialog.svelte';

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
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}

<ComposeDialog />
<SimulateDialog />
<Toast />
