<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme, preferences, greetDismissed, activeTab, categoryFilter } from '$lib/stores';
	import type { TabId } from '$lib/types';
	import Toast from '$components/Toast.svelte';
	import ComposeDialog from '$components/ComposeDialog.svelte';

	let { children } = $props();

	onMount(() => {
		// Initialize theme
		theme.init();
		theme.set($preferences.theme);

		// Apply the user's default tab -- either a status tab, or "pf:<platform>" to
		// open filtered to a single platform via the category filter instead.
		const defaultTab = $preferences.defaultTab;
		if (defaultTab.startsWith('pf:')) {
			activeTab.set('all');
			categoryFilter.set(defaultTab);
		} else {
			activeTab.set(defaultTab as TabId);
		}

		const greetTimer = setTimeout(() => greetDismissed.set(true), 11000);
		return () => clearTimeout(greetTimer);
	});
</script>

<svelte:head>
	<title>Coms - Unified Inbox</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Serif+Display&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}

<ComposeDialog />
<Toast />
