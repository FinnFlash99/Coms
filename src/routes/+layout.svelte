<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		theme,
		preferences,
		greetDismissed,
		activeTab,
		categoryFilter,
		authed,
		onboarded,
		loadNotes,
		loadConversations,
		loadContacts,
		loadConnections,
		toast,
		initUser
	} from '$lib/stores';
	import type { TabId } from '$lib/types';
	import { CONNECTIONS } from '$lib/types';
	import Toast from '$components/Toast.svelte';
	import ComposeDialog from '$components/ComposeDialog.svelte';
	import SignInScreen from '$components/SignInScreen.svelte';
	import OnboardingScreen from '$components/OnboardingScreen.svelte';

	let { children, data } = $props();

	// Initialize user from server data
	$effect(() => {
		initUser(data.user);
	});

	// Terms/Privacy are linked from the sign-in screen itself, so they must be
	// reachable before signing in -- the only routes exempt from the auth gate below.
	const PUBLIC_ROUTES = ['/terms', '/privacy'];
	const isPublicRoute = $derived(PUBLIC_ROUTES.includes($page.url.pathname));

	// Load data from API when user is authenticated and onboarded
	$effect(() => {
		if ($authed && $onboarded) {
			loadNotes();
			loadConversations();
			loadContacts();
		}
	});

	onMount(() => {
		// Initialize theme
		theme.init();
		theme.set($preferences.theme);

		// Load real connection status from API (for both onboarding and settings)
		if (data.user) {
			loadConnections();
		}

		// Handle OAuth callback success/error (may come back during onboarding or after)
		const connected = $page.url.searchParams.get('connected');
		const error = $page.url.searchParams.get('error');

		if (connected) {
			const platformName = CONNECTIONS.find((c) => c.id === connected)?.name || connected;
			toast.show(`${platformName} connected`);
			goto('/', { replaceState: true });
		} else if (error) {
			const message = error === 'oauth_denied' ? 'Connection cancelled' : 'Connection failed';
			toast.show(message);
			goto('/', { replaceState: true });
		}

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

{#if isPublicRoute}
	{@render children()}
{:else if !$authed}
	<SignInScreen />
{:else if !$onboarded}
	<OnboardingScreen />
{:else}
	{@render children()}
	<ComposeDialog />
{/if}
<Toast />
